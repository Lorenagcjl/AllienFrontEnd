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
        loadComponent: () => import('./cliente.component/cliente.component')
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
        path: 'compra-producto',
        loadComponent: () => import('./compra-producto.component/compra-producto.component'),
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
        path: 'nuevo-movimiento',
        loadComponent: () => import('./nuevo-movimiento.component/nuevo-movimiento.component')
      },
      {
        path: 'nueva-venta',
        loadComponent: () => import('./nueva-venta.component/nueva-venta.component')
      },
      {
        path: 'nueva-compra',
        loadComponent: () => import('./nueva-compra.component/nueva-compra.component')
      },
      {
        path: 'catalogo',
        loadComponent: () => import('./catalogo-management.component/catalogo-management.component')
      },
      {
        path: 'config-iva',
        loadComponent: () => import('./iva-config.component/iva-config.component')
      },
      {
        path: 'historial-precios',
        loadComponent: () => import('./historial-precios.component/historial-precios.component')
      },
      {
        path: 'comisiones-usuarios',
        loadComponent: () => import('./comisiones-usuarios.component/comisiones-usuarios.component')
      },
      {
        path: 'comisiones-mi-usuarios',
        loadComponent: () => import('./comisiones-mi-usuario.component/comisiones-mi-usuario.component')
      },
      // {
      //   path: 'movimiento-detalle',
      //   loadComponent: () => import('./movimiento-detalle/movimiento-detalle')
      // },
      {
        path: 'venta-detalle-serial',
        loadComponent: () => import('./venta-detalle-serial/venta-detalle-serial')
      },
      {
        path: 'ubicacion',
        loadComponent: () => import('./ubicacion/ubicacion.component')
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
      {
        path: 'inventariomovimiento',
        loadComponent: () => import('./inventariomovimiento/inventariomovimiento'),
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComponentRoutingModule { }
