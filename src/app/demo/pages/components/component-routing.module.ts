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
        path: 'ubicacion',
        loadComponent: () => import('./ubicacion/ubicacion.component')
      },
       {
        path: 'ventaDetalleSerial',
        loadComponent: () => import('./ventaDetalleSerial/ventaDetalleSerial.component')
      }
      
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComponentRoutingModule {}
