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
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/users/users-page').then((m) => m.UsersPage),
        title: 'Usuarios',
      },
      {
        path: 'repositorios',
        loadComponent: () =>
          import('./features/repositories/repositories-page').then((m) => m.RepositoriesPage),
        title: 'Repositorios',
      },
    ],
  },
];
