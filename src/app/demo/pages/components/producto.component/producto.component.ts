import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { ProductoService } from 'src/app/@theme/services/producto.service';
import { ProductoSerialService } from 'src/app/@theme/services/producto-serial.service';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { Producto } from 'src/app/demo/models/producto.model';
import { ProductoFormModalComponent } from '../producto-form-modal.component/producto-form-modal.component';

// import { ProductoFormModalComponent } from '../producto-form-modal/producto-form-modal.component';

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
    ProductoFormModalComponent
  ],
  templateUrl: './producto.component.html',
  styleUrl: './producto.component.scss',
})
export default class ProductoComponent {
  private readonly productoService = inject(ProductoService);
  private readonly productoSerialService = inject(ProductoSerialService);
  private readonly alert = inject(AlertService);

  displayedColumns: string[] = [
    'idProducto',
    'nombre',
    'precioVenta',
    'esConSerial',
    'porcentajeComision',
    'fechaCreacion',
    'acciones'
  ];

  dataSource = new MatTableDataSource<Producto>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Modal state
  modalOpen = false;
  productoSeleccionado?: Producto;
  isEditing = false;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = (row: Producto, filter: string) => {
      const f = filter.trim().toLowerCase();
      return (
        (row.nombre ?? '').toLowerCase().includes(f) ||
        (row.descripcion ?? '').toLowerCase().includes(f)
      );
    };

    this.cargarProductos();
  }

  cargarProductos(): void {
    this.alert.loading('Cargando productos...', 'Consultando lista de productos.');


    this.productoService.listarProductos().subscribe({
      next: (productos) => {
        this.dataSource.data = productos ?? [];
        this.alert.close();
      },
      error: (err) => {
        console.error(err);
        this.dataSource.data = [];
        this.alert.close();
        this.alert.error('Error', this.alert.getErrorMessage(err, 'No se pudo cargar la lista de productos.'));
      }
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.dataSource.filter = value.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  // Abrir modal (crear o editar)
  abrirFormulario(row?: Producto): void {
    this.productoSeleccionado = row;
    this.modalOpen = true;
  }

  cerrarModal(): void {
    this.modalOpen = false;
    this.productoSeleccionado = undefined;
  }

  // Cuando el modal guarda OK
  async onSaved(ok: boolean): Promise<void> {
    if (!ok) return;

    this.cerrarModal();
    // éxito después de cerrar el modal (como pediste)
    await this.alert.success('Confirmado', 'Guardado correctamente.');
    this.cargarProductos();
  }

  // editar(row: Producto): void {
  //   const id = row?.idProducto;
  //   if (!id) return;

  //   const loadingId = this.alert.loading('Cargando producto...', 'Obteniendo información del producto.');

  //   this.productoService.obtenerPorId(id).subscribe({
  //     next: (producto) => {
  //       this.abrirFormulario(producto);

  //       // cierro SOLO el loading que abrí aquí
  //       setTimeout(() => this.alert.close(loadingId), 0);
  //     },
  //     error: (err) => {
  //       this.alert.close(loadingId);
  //       this.alert.error('Error', this.alert.getErrorMessage(err, 'No se pudo obtener el producto.'));
  //     }
  //   });
  // }
  editar(row: Producto): void {
    this.abrirFormulario(row);
  }

  async eliminar(row: Producto): Promise<void> {
    const id = row?.idProducto;
    if (!id) return;

    this.alert.loading('Validando...', 'Revisando si el producto tiene seriales asociados.');

    this.productoSerialService.listarProductosSerial().subscribe({
      next: async (seriales: any[]) => {
        const tieneSeriales = (seriales ?? []).some(s => s.fkProducto?.idProducto === id);
        this.alert.close();

        if (tieneSeriales) {
          await this.alert.warning('No se puede eliminar', 'Este producto tiene seriales asociados.');
          return;
        }

        const confirmado = await this.alert.confirm(
          'Confirmar eliminación',
          `¿Eliminar el producto "${row.nombre}"?`,
          'Sí, eliminar',
          'Cancelar'
        );
        if (!confirmado) return;

        this.alert.loading('Eliminando...', 'Procesando la eliminación del producto.');

        this.productoService.eliminarProducto(id).subscribe({
          next: async () => {
            this.alert.close();
            await this.alert.success('Eliminado', 'El producto fue eliminado correctamente.');
            this.cargarProductos();
          },
          error: async (err) => {
            console.error('Error eliminando producto', err);
            this.alert.close();
            await this.alert.error('Error al eliminar', this.alert.getErrorMessage(err, 'No se pudo eliminar el producto.'));
          }
        });
      },
      error: (err) => {
        console.error('Error consultando seriales', err);
        this.alert.close();
        this.alert.error('Error', this.alert.getErrorMessage(err, 'No se pudo validar los seriales del producto.'));
      }
    });
  }
}
