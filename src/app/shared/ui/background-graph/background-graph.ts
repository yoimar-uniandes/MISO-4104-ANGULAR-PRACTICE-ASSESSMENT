import { isPlatformBrowser } from '@angular/common';
import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  PLATFORM_ID,
  inject,
  viewChild,
} from '@angular/core';

interface GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * Pulso "neuronal" — un nodo negro de vida corta con su propio drift.
 * Aparece, se mueve un poco, dispara conexiones a los nodos amarillos
 * cercanos y se desvanece.
 */
interface PulseNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  birth: number;
  lifetime: number;
  radius: number;
}

/**
 * Background animado tipo "red neuronal":
 *
 *   • N nodos amarillos (Uniandes) con movimiento browniano que se conectan
 *     con líneas cuya opacidad cae con la distancia.
 *   • Eventos aleatorios disparan PULSOS NEGROS que aparecen, propagan
 *     conexiones a los nodos amarillos cercanos, y se disuelven. Tres
 *     "reglas" distintas controlan estos eventos: single, burst, cascade.
 *
 * Decorativo (aria-hidden, pointer-events: none). No corre en SSR.
 * Respeta prefers-reduced-motion.
 */
@Component({
  selector: 'app-background-graph',
  template: `<canvas #canvas class="bg-graph__canvas" aria-hidden="true"></canvas>`,
  styleUrl: './background-graph.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackgroundGraph implements AfterViewInit {
  /* ── Configuración del grafo amarillo ──────────────────────────── */
  private static readonly nodeDensity = 1 / 22000;
  private static readonly minNodes = 30;
  private static readonly maxNodes = 110;
  private static readonly connectionDistance = 150;
  private static readonly maxSpeed = 0.32;
  private static readonly hue = '255, 228, 30'; // amarillo Uniandes
  private static readonly nodeAlpha = 0.63; // +15% visibilidad
  private static readonly edgeMaxAlpha = 0.32; // +15% visibilidad

  /* ── Configuración de pulsos negros ─────────────────────────────── */
  private static readonly pulseHue = '25, 25, 22'; // brand-black
  private static readonly pulseConnectionDistance = 140;
  private static readonly pulseFadeRatio = 0.18;
  private static readonly cascadeMaxLength = 5;

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private rafId = 0;
  private nodes: GraphNode[] = [];
  private pulses: PulseNode[] = [];
  private width = 0;
  private height = 0;
  private dpr = 1;
  private prefersReducedMotion = false;
  private nextEventTime = 0;
  private cascadeRemaining = 0;
  private cascadeCenter: { x: number; y: number } = { x: 0, y: 0 };

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    this.dpr = window.devicePixelRatio || 1;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.resize(ctx);
    this.initNodes();

    const onResize = (): void => {
      this.resize(ctx);
      this.initNodes();
    };
    window.addEventListener('resize', onResize, { passive: true });

    const animate = (): void => {
      const now = performance.now();
      if (!this.prefersReducedMotion) {
        this.update(now);
      }
      this.draw(ctx, now);
      this.rafId = window.requestAnimationFrame(animate);
    };
    this.rafId = window.requestAnimationFrame(animate);

    this.destroyRef.onDestroy(() => {
      window.cancelAnimationFrame(this.rafId);
      window.removeEventListener('resize', onResize);
    });
  }

  private resize(ctx: CanvasRenderingContext2D): void {
    const canvas = this.canvasRef().nativeElement;
    const parent = canvas.parentElement;
    if (!parent) {
      return;
    }
    this.width = parent.clientWidth;
    this.height = parent.clientHeight;
    canvas.width = Math.floor(this.width * this.dpr);
    canvas.height = Math.floor(this.height * this.dpr);
    canvas.style.width = `${String(this.width)}px`;
    canvas.style.height = `${String(this.height)}px`;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private initNodes(): void {
    const target = Math.floor(this.width * this.height * BackgroundGraph.nodeDensity);
    const count = Math.max(BackgroundGraph.minNodes, Math.min(BackgroundGraph.maxNodes, target));
    this.nodes = Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * BackgroundGraph.maxSpeed * 2,
      vy: (Math.random() - 0.5) * BackgroundGraph.maxSpeed * 2,
    }));
  }

  /* ── Update: movimiento amarillo + pulsos negros ────────────────── */
  private update(now: number): void {
    /* Mover nodos amarillos */
    for (const node of this.nodes) {
      node.x += node.vx;
      node.y += node.vy;
      if (node.x <= 0 || node.x >= this.width) {
        node.vx = -node.vx;
        node.x = Math.max(0, Math.min(this.width, node.x));
      }
      if (node.y <= 0 || node.y >= this.height) {
        node.vy = -node.vy;
        node.y = Math.max(0, Math.min(this.height, node.y));
      }
    }

    /* Disparar siguiente evento si toca */
    if (now >= this.nextEventTime) {
      this.fireEvent(now);
    }

    /* Mover pulsos vivos y descartar los expirados */
    const survivors: PulseNode[] = [];
    for (const p of this.pulses) {
      if (now - p.birth >= p.lifetime) {
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      survivors.push(p);
    }
    this.pulses = survivors;
  }

  /**
   * Selecciona aleatoriamente una "regla" para disparar el siguiente
   * evento orgánico:
   *
   *   • Single   (65%) — un pulso aislado en posición aleatoria.
   *   • Burst    (27%) — 3-5 pulsos simultáneos en un radio pequeño.
   *   • Cascade   (8%) — secuencia de 3-5 pulsos disparados cada ~250ms
   *                     desde la misma región (efecto "encadenado").
   */
  private fireEvent(now: number): void {
    /* Si hay un cascade activo, continuar emitiendo pulsos cercanos */
    if (this.cascadeRemaining > 0) {
      this.cascadeRemaining--;
      const ox = (Math.random() - 0.5) * 110;
      const oy = (Math.random() - 0.5) * 110;
      this.spawnPulse(now, this.cascadeCenter.x + ox, this.cascadeCenter.y + oy, 1700, 2.4);
      this.nextEventTime = now + 200 + Math.random() * 280;
      return;
    }

    const r = Math.random();
    if (r < 0.65) {
      /* Regla 1 — pulso único */
      this.spawnPulse(now, Math.random() * this.width, Math.random() * this.height, 2200, 2.5);
      this.nextEventTime = now + 600 + Math.random() * 1600;
    } else if (r < 0.92) {
      /* Regla 2 — burst: cluster simultáneo */
      const cx = Math.random() * this.width;
      const cy = Math.random() * this.height;
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const ox = (Math.random() - 0.5) * 80;
        const oy = (Math.random() - 0.5) * 80;
        this.spawnPulse(now, cx + ox, cy + oy, 1700, 2);
      }
      this.nextEventTime = now + 1400 + Math.random() * 2200;
    } else {
      /* Regla 3 — cascade: secuencia de pulsos */
      this.cascadeCenter = {
        x: Math.random() * this.width,
        y: Math.random() * this.height,
      };
      this.cascadeRemaining =
        2 + Math.floor(Math.random() * (BackgroundGraph.cascadeMaxLength - 2));
      this.spawnPulse(now, this.cascadeCenter.x, this.cascadeCenter.y, 1800, 2.6);
      this.nextEventTime = now + 220 + Math.random() * 240;
    }
  }

  private spawnPulse(now: number, x: number, y: number, lifetime: number, radius: number): void {
    this.pulses.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      birth: now,
      lifetime,
      radius,
    });
  }

  /** Curva de fade in/out: rampa de subida 0→0.18, hold, rampa de bajada 0.82→1. */
  private pulseAlpha(t: number): number {
    const fade = BackgroundGraph.pulseFadeRatio;
    if (t < fade) {
      return t / fade;
    }
    if (t > 1 - fade) {
      return (1 - t) / fade;
    }
    return 1;
  }

  /* ── Draw ───────────────────────────────────────────────────────── */
  private draw(ctx: CanvasRenderingContext2D, now: number): void {
    ctx.clearRect(0, 0, this.width, this.height);

    /* Aristas amarillas — opacidad inversa a la distancia */
    const max = BackgroundGraph.connectionDistance;
    ctx.lineWidth = 1;
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const a = this.nodes[i];
        const b = this.nodes[j];
        if (!a || !b) {
          continue;
        }
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < max * max) {
          const dist = Math.sqrt(distSq);
          const alpha = (1 - dist / max) * BackgroundGraph.edgeMaxAlpha;
          ctx.strokeStyle = `rgba(${BackgroundGraph.hue}, ${String(alpha)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    /* Nodos amarillos */
    ctx.fillStyle = `rgba(${BackgroundGraph.hue}, ${String(BackgroundGraph.nodeAlpha)})`;
    for (const node of this.nodes) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    /* Pulsos negros — primero las aristas hacia los nodos amarillos cercanos */
    const pulseMax = BackgroundGraph.pulseConnectionDistance;
    for (const p of this.pulses) {
      const age = now - p.birth;
      const t = age / p.lifetime;
      const a = this.pulseAlpha(t);
      for (const yellow of this.nodes) {
        const dx = p.x - yellow.x;
        const dy = p.y - yellow.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < pulseMax * pulseMax) {
          const dist = Math.sqrt(distSq);
          const lineAlpha = (1 - dist / pulseMax) * a * 0.45;
          ctx.strokeStyle = `rgba(${BackgroundGraph.pulseHue}, ${String(lineAlpha)})`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(yellow.x, yellow.y);
          ctx.stroke();
        }
      }
    }

    /* Luego los nodos negros encima (con halo sutil) */
    for (const p of this.pulses) {
      const age = now - p.birth;
      const t = age / p.lifetime;
      const a = this.pulseAlpha(t);
      /* Halo difuso */
      const haloAlpha = a * 0.22;
      ctx.fillStyle = `rgba(${BackgroundGraph.pulseHue}, ${String(haloAlpha)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2.6, 0, Math.PI * 2);
      ctx.fill();
      /* Núcleo sólido */
      ctx.fillStyle = `rgba(${BackgroundGraph.pulseHue}, ${String(a * 0.85)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
