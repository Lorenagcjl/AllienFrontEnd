import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'usuarios',
        loadComponent: () => import('./usuarios/usuarios.component') 
      },
      {
        path: 'color',
        loadComponent: () => import('./color/color.component')
      },
      {
        path: 'venta',
        loadComponent: () => import('./venta/venta')
      },
      {
        path: 'producto',
        loadComponent: () => import('./producto.component/producto.component')
      },
      {
        path: 'producto-serial',
        loadComponent: () => import('./producto-serial.component/producto-serial.component')
      },
      {
        path: 'compra',
        loadComponent: () => import('./compra.component/compra.component')
      },
      {
        path: 'detalle-compra',
        loadComponent: () => import('./compra-detalle.component/compra-detalle.component')
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComponentRoutingModule {}
