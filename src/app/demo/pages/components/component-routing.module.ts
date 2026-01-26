import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'typography',
        loadComponent: () => import('./typography/typography.component')
      },
      {
        path: 'color',
        loadComponent: () => import('./color/color.component')
      },
      {
        path: 'movimiento',
        loadComponent: () => import('./movimiento/movimiento')
      },
      {
        path: 'movimiento-detalle',
        loadComponent: () => import('./movimiento-detalle/movimiento-detalle')
      },
      {
        path: 'venta-detalle-serial',
        loadComponent: () => import('./venta-detalle-serial/venta-detalle-serial')
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComponentRoutingModule { }
