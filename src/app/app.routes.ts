import { type Routes } from '@angular/router';
import { MainLayout } from './layouts/main/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/home/home').then((m) => m.Home),
        title: 'Inicio',
        data: {
          description:
            'Descubre a los developers que admiras y los repositorios de GitHub que están dejando huella, en un único lugar. GhQuerry, proyecto académico de MISO-4104.',
        },
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/users/users-page').then((m) => m.UsersPage),
        title: 'Usuarios',
        data: {
          description:
            'Directorio de developers de la comunidad GhQuerry: explora perfiles, ubicaciones y los repositorios que mantienen.',
        },
      },
      {
        path: 'usuarios/:id',
        loadComponent: () =>
          import('./features/users/user-detail-page').then((m) => m.UserDetailPage),
        title: 'Detalle de usuario',
        data: {
          description:
            'Perfil detallado de un developer GhQuerry: información de contacto, repositorios mantenidos y comunidad relacionada.',
        },
      },
      {
        path: 'repositorios',
        loadComponent: () =>
          import('./features/repositories/repositories-page').then((m) => m.RepositoriesPage),
        title: 'Repositorios',
        data: {
          description:
            'Repositorios destacados de la comunidad GhQuerry: lenguajes, popularidad y descripción de cada proyecto.',
        },
      },
      {
        path: 'repositorios/:id',
        loadComponent: () =>
          import('./features/repositories/repository-detail-page').then(
            (m) => m.RepositoryDetailPage,
          ),
        title: 'Detalle de repositorio',
        data: {
          description:
            'Perfil detallado de un repositorio GhQuerry: lenguaje, popularidad, propietario y proyectos relacionados de la comunidad.',
        },
      },
    ],
  },
];
