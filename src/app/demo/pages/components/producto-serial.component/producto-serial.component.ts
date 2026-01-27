import { AfterViewInit, Component, ViewChild, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { ProductoSerialService } from 'src/app/@theme/services/producto-serial.service';
import { ProductoService } from 'src/app/@theme/services/producto.service';
import { ProductoSerial } from 'src/app/demo/models/producto-serial.model';
import { Producto } from 'src/app/demo/models/producto.model';

import { ProductoSerialModal } from '../producto-serial.modal/producto-serial.modal';

// ✅ AlertService
import { AlertService } from 'src/app/@theme/services/alert.service'; // ajusta ruta

@Component({
  selector: 'app-producto-serial',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ProductoSerialModal,
  ],
  templateUrl: './producto-serial.component.html',
  styleUrls: ['./producto-serial.component.scss'],
})
export default class ProductoSerialComponent implements AfterViewInit {
  private readonly productoSerialService = inject(ProductoSerialService);
  private readonly productoService = inject(ProductoService);
  private readonly alert = inject(AlertService); // ✅

  displayedColumns: string[] = ['idProducto', 'producto', 'serial', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<ProductoSerial>([]);
  productosMap = new Map<number, Producto>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  modalOpen = false;
  serialSeleccionado?: ProductoSerial;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = (row, filter) => {
      const f = filter.trim().toLowerCase();
      const nombre = (this.productosMap.get(row.idProducto)?.nombre ?? '').toLowerCase();

      return (
        String(row.idProducto ?? '').includes(f) ||
        (row.serial ?? '').toLowerCase().includes(f) ||
        (row.estado ?? '').toLowerCase().includes(f) ||
        nombre.includes(f)
      );
    };

    this.cargarProductosParaMap();
    this.cargarSeriales();
  }

  cargarSeriales(showLoading = true): void {
    const loadingId = showLoading ? this.alert.loading('Cargando...', 'Listando seriales...') : undefined;

    this.productoSerialService.listarProductosSerial().subscribe({
      next: (data: any[]) => {
        const mapped: ProductoSerial[] = (data ?? []).map(x => ({
          idProductoSerial: x.idProductoSerial,
          idProducto: x.fkProducto?.idProducto,
          serial: x.serial,
          estado: x.estado
        }));

        this.dataSource.data = mapped;

        if (showLoading) this.alert.close(loadingId);
      },
      error: async (err) => {
        if (showLoading) this.alert.close(loadingId);
        this.dataSource.data = [];
        await this.alert.error('Error', this.alert.getErrorMessage(err, 'No se pudieron listar seriales.'));
      }
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.dataSource.filter = value.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  getNombreProducto(idProducto: number): string {
    return this.productosMap.get(idProducto)?.nombre ?? '';
  }

  private cargarProductosParaMap(): void {
    this.productoService.listarProductos().subscribe({
      next: (prods) => {
        this.productosMap = new Map((prods ?? []).map(p => [p.idProducto, p]));
        this.dataSource.data = [...this.dataSource.data];
      },
      error: (err) => console.error('Error cargando productos', err)
    });
  }

  abrirFormulario(): void {
    this.serialSeleccionado = undefined;
    this.modalOpen = true;
  }

  editar(row: ProductoSerial): void {
    this.serialSeleccionado = row;
    this.modalOpen = true;
  }

  async eliminar(row: ProductoSerial): Promise<void> {
    const id = row?.idProductoSerial;
    if (!id) return;

    const ok = await this.alert.confirm(
      'Eliminar serial',
      `¿Eliminar el serial "${row.serial}"?`,
      'Sí, eliminar',
      'Cancelar'
    );
    if (!ok) return;

    const loadingId = this.alert.loading('Eliminando...', 'Por favor espera.');
    this.productoSerialService.eliminarProductoSerial(id).subscribe({
      next: async () => {
        this.alert.close(loadingId);
        await this.alert.toast('success', 'Eliminado');
        this.cargarSeriales();
      },
      error: async (err) => {
        this.alert.close(loadingId);
        await this.alert.error('Error', this.alert.getErrorMessage(err, 'No se pudo eliminar.'));
      }
    });
  }

  cerrarModal(): void {
    this.modalOpen = false;
  }

  onSaved(): void {
    this.cargarSeriales(false); // ✅ no abre loading Swal
    this.cerrarModal();
  }
}
