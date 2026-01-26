import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './@theme/guards/auth.guard';

// project import
import { AdminComponent } from './demo/layout/admin';
import { EmptyComponent } from './demo/layout/empty';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: '',
    component: EmptyComponent,
    children: [
      {
        path: 'auth',
        loadChildren: () =>
          import('./demo/pages/auth/auth.module').then((m) => m.AuthModule)
      }
    ]
  },
  {
    path: '',
    component: AdminComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'admin-dashboard',
        loadComponent: () =>
          import('./demo/pages/dashboard/dashboard.component'),
        data: { roles: ['Administrador'] }
      },
      // Dashboard para EMPLEADO
      {
        path: 'empleado-dashboard',
        loadComponent: () => import('./demo/pages/empl-dashboard/empl-dashboard.component'),
        data: { roles: ['Empleado'] } 
      },
      {
        path: 'component',
        loadChildren: () =>
          import('./demo/pages/components/component.module').then(
            (m) => m.ComponentModule
          )
      },
      {
        path: 'sample-page',
        loadComponent: () =>
          import('./demo/pages/other/sample-page/sample-page.component')
      }
    ]
  },
  { path: '**', redirectTo: 'auth/login' } // Captura cualquier ruta inexistente
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
