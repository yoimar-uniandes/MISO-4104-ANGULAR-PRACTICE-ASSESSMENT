#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Configura la protección de las ramas `main` y `develop` vía GitHub API.
# Modelo de ramas (Git Flow simplificado):
#
#                          feature/*  ──PR──▶  develop  ──PR──▶  main
#
# Requisitos:
#   - gh CLI autenticado (`gh auth login`)
#   - permisos de admin sobre el repo
#
# Uso:
#   ./.github/scripts/setup-branch-protection.sh                 # detecta el repo actual
#   ./.github/scripts/setup-branch-protection.sh OWNER/REPO      # repo explícito
#
# Reglas comunes a 'main' y 'develop':
#   - Push directo BLOQUEADO (sólo vía PR).
#   - Status checks obligatorios:
#       · Lint, typecheck, test, build       (ci.yml)
#       · Validate PR source branch          (branch-policy.yml)
#   - Branches deben estar al día con la base (strict).
#   - Conversation resolution obligatorio.
#   - Linear history (sin merge commits → squash o rebase).
#   - Sin force-push, sin deletion.
#   - 1 approval requerida; stale reviews descartadas.
#   - enforce_admins = false (admins pueden bypassear si hace falta).
#
# Reglas adicionales se enforcen en branch-policy.yml:
#   - main  ← sólo acepta PR desde 'develop' (o release-please).
#   - develop ← sólo acepta PR desde ramas 'feature/*'.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

if [[ -z "$REPO" ]]; then
  echo "ERROR: No se pudo detectar el repositorio. Pasa OWNER/REPO como argumento."
  exit 1
fi

ensure_remote_branch() {
  local branch="$1"

  if gh api "repos/${REPO}/branches/${branch}" &>/dev/null; then
    return 0
  fi

  echo "⚠ La rama '${branch}' no existe en el remote."

  if ! git show-ref --verify --quiet "refs/heads/${branch}"; then
    echo "❌ Tampoco existe localmente. Créala con:"
    echo "   git branch ${branch} main && git push -u origin ${branch}"
    return 1
  fi

  echo "   → Empujando rama local a origin/${branch}..."
  git push -u origin "${branch}"
}

apply_protection() {
  local branch="$1"

  ensure_remote_branch "${branch}" || return 1

  echo "▶ Aplicando protección a ${REPO}:${branch}..."

  gh api -X PUT "repos/${REPO}/branches/${branch}/protection" \
    -H "Accept: application/vnd.github+json" \
    --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Lint, typecheck, test, build",
      "Validate PR source branch"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "require_last_push_approval": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": false,
  "block_creations": false
}
JSON

  echo "✓ ${branch} protegida."
}

apply_protection main
apply_protection develop

echo
echo "▶ Verifica la configuración en:"
echo "  https://github.com/${REPO}/settings/branches"
