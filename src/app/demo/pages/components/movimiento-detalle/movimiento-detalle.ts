import { Component, OnInit, inject, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';

import { MovimientoDetalleService } from 'src/app/@theme/services/movimiento-detalle.service';
import { ProductoService } from 'src/app/@theme/services/producto.service';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { MovimientoDetalleModel } from 'src/app/demo/models/movimiento-detalle.model'; // Asegura esta ruta
import { MovimientoDetalleForm } from '../movimiento-detalle-form/movimiento-detalle-form';

@Component({
  selector: 'app-movimiento-detalle',
  standalone: true,
  imports: [
    CommonModule, SharedModule, ReactiveFormsModule, 
    MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, 
    MatPaginatorModule, MatProgressBarModule, MatSelectModule, 
    MatButtonModule, MatTooltipModule, MatDialogModule, MovimientoDetalleForm
  ],
  templateUrl: './movimiento-detalle.html'
})
export default class MovimientoDetalleComponent implements OnInit, AfterViewInit {
  private detalleService = inject(MovimientoDetalleService);
  private productoService = inject(ProductoService);
  private alertService = inject(AlertService);

  // Lógica de Usuarios
  modalOpen = false;
  detalleParaEditar?: any;
  cargando: boolean = false;
  
  displayedColumns: string[] = ['idMovimientoDetalle', 'idMovimiento', 'producto', 'cantidad', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  productos: any[] = [];

  ngOnInit() {
    this.cargarProductos();
    this.cargarDetalles();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  cargarProductos() {
    this.productoService.listarProductos().subscribe(res => this.productos = res);
  }

  cargarDetalles() {
    this.cargando = true;
    this.detalleService.listarMovimientoDetalles().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.alertService.error('Error', 'No se pudieron cargar los detalles');
      }
    });
  }

  // Lógica de formulario igual que Usuarios
  abrirFormulario(detalle?: any) {
    this.detalleParaEditar = detalle;
    this.modalOpen = true;
  }

  cerrarModal() {
    this.modalOpen = false;
    this.detalleParaEditar = undefined;
  }

  onSaved(exito: boolean) {
    if (exito) {
      this.cerrarModal();
      this.cargarDetalles();
    }
  }

  async cambiarEstado(detalle: any) {
    // Si tu Detalle tiene 'esActivo', usamos esta lógica de Usuarios
    const accion = detalle.esActivo ? 'desactivar' : 'activar';
    const confirmado = await this.alertService.confirm(
      `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} detalle?`,
      `¿Confirmas cambiar el estado del registro #${detalle.idMovimientoDetalle}?`
    );

    if (confirmado) {
      this.cargando = true;
      const loadingId = this.alertService.loading('Procesando...');
      // Usamos el eliminar (que suele ser el toggle de estado en tu backend)
      this.detalleService.eliminar(detalle.idMovimientoDetalle).subscribe({
        next: () => {
          this.alertService.close(loadingId);
          this.cargarDetalles();
          this.alertService.toast('success', `Estado actualizado`);
        },
        error: (err) => {
          this.cargando = false;
          this.alertService.close(loadingId);
          this.alertService.error('Error', 'No se pudo cambiar el estado');
        }
      });
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getNombreProducto(id: number): string {
    const p = this.productos.find(prod => prod.idProducto === id);
    return p ? p.nombre : 'ID: ' + id;
  }
}