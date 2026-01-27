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
        path: 'producto',
        loadComponent: () => import('./producto.component/producto.component')
      },
      {
        path: 'producto-serial',
        loadComponent: () => import('./producto-serial.component/producto-serial.component')
      },
      {
        path: 'compra-producto',
        loadComponent: () => import('./compra-producto.component/compra-producto.component'),
      },
      {
        path: 'compra-producto-detalle',
        loadComponent: () => import('./compra-producto-detalle.component/compra-producto-detalle.component'),
      },

      // ✅ OPCIONAL: ver detalles filtrados por compra
      {
        path: 'compra-producto-detalle/:idCompraProducto',
        loadComponent: () => import('./compra-producto-detalle.component/compra-producto-detalle.component'),
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComponentRoutingModule {}
