import { Component, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ProductoService } from 'src/app/@theme/services/producto.service';
import { ProductoSerialService } from 'src/app/@theme/services/producto-serial.service';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { Producto } from 'src/app/demo/models/producto.model';
import { ProductoFormModalComponent } from '../producto-form-modal.component/producto-form-modal.component';
import { ChangePriceModalComponent } from '../change-price-modal.component/change-price-modal.component';

@Component({
  selector: 'app-producto.component',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    MatTooltipModule,
    ProductoFormModalComponent,
    ChangePriceModalComponent
  ],
  templateUrl: './producto.component.html',
  styleUrl: './producto.component.scss',
})
export default class ProductoComponent implements AfterViewInit {
  private readonly productoService = inject(ProductoService);
  private readonly productoSerialService = inject(ProductoSerialService);
  private readonly alert = inject(AlertService);

  displayedColumns: string[] = [
    'idProducto',
    'nombre',
    'marca',
    'tipo',
    'precioVenta',
    'esConSerial',
    'porcentajeComision',
    'fechaCreacion',
    'acciones'
  ];

  dataSource = new MatTableDataSource<Producto>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  modalOpen = false;
  productoSeleccionado?: Producto;
  cargando = false;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargando = true;
    this.productoService.listarProductos().subscribe({
      next: (productos) => {
        // Filtramos solo los productos activos
        this.dataSource.data = (productos ?? []).filter((p: any) => p.esActivo !== false);
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.alert.error('Error', this.alert.getErrorMessage(err, 'No se pudo cargar la lista.'));
      }
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.dataSource.filter = value.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  abrirFormulario(row?: Producto): void {
    this.productoSeleccionado = row;
    this.modalOpen = true;
  }

  cerrarModal(): void {
    this.modalOpen = false;
    this.productoSeleccionado = undefined;
  }

  async onSaved(ok: boolean): Promise<void> {
    if (!ok) return;
    this.cerrarModal();
    await this.alert.success('Confirmado', 'Guardado correctamente.');
    this.cargarProductos();
  }

  editar(row: Producto): void {
    const id = row.idProducto;
    if (!id) return;

    // ✅ abre inmediatamente con lo que ya tienes (sin foto)
    this.abrirFormulario({ ...row, foto: '' } as Producto);

    // ✅ luego trae el completo (incluye foto)
    this.productoService.obtenerPorId(id).subscribe({
      next: (productoCompleto) => {
        // ✅ actualiza el input del modal
        this.productoSeleccionado = productoCompleto;
      },
      error: (err) => {
        this.alert.error('Error', this.alert.getErrorMessage(err, 'No se pudo cargar el producto para editar.'));
      }
    });
  }

  async eliminar(row: Producto): Promise<void> {
    const id = row?.idProducto;
    if (!id) return;

    const confirmado = await this.alert.confirm(
      'Confirmar eliminación',
      `¿Eliminar el producto "${row.nombre}"?`,
      'Sí, eliminar'
    );
    if (!confirmado) return;

    this.cargando = true;
    const loadingId = this.alert.loading('Eliminando...', 'Validando y procesando');

    this.productoSerialService.listarProductosSerial().subscribe({
      next: (seriales: any[]) => {
        const tieneSeriales = (seriales ?? []).some(s => s.fkProducto?.idProducto === id);

        if (tieneSeriales) {
          this.cargando = false;
          this.alert.close(loadingId);
          this.alert.warning('No se puede eliminar', 'Este producto tiene seriales asociados.');
          return;
        }

        this.productoService.eliminarProducto(id).subscribe({
          next: () => {
            this.alert.close(loadingId);
            this.alert.toast('success', 'Producto eliminado');
            this.cargarProductos();
          },
          error: (err) => {
            this.cargando = false;
            this.alert.close(loadingId);
            this.alert.error('Error', this.alert.getErrorMessage(err));
          }
        });
      },
      error: (err) => {
        this.cargando = false;
        this.alert.close(loadingId);
        this.alert.error('Error', 'Error al validar seriales');
      }
    });
  }

  changePriceOpen = false;
  productoParaPrecio?: Producto;

  abrirCambioPrecio(p: Producto) {
    this.productoParaPrecio = p;
    this.changePriceOpen = true;
  }

  cerrarCambioPrecio() {
    this.changePriceOpen = false;
    this.productoParaPrecio = undefined;
  }

  onPrecioCambiado(ok: boolean) {
    if (!ok) return;
    this.cerrarCambioPrecio();
    this.cargarProductos(); // refresca precio vigente en la tabla
  }

}
