import { AfterViewInit, Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Asegúrate de tenerlo
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ProductoSerialService } from 'src/app/@theme/services/producto-serial.service';
import { ProductoService } from 'src/app/@theme/services/producto.service';
import { ProductoSerial } from 'src/app/demo/models/producto-serial.model';
import { Producto } from 'src/app/demo/models/producto.model';
import { ProductoSerialModal } from '../producto-serial.modal/producto-serial.modal';
import { AlertService } from 'src/app/@theme/services/alert.service';

@Component({
  selector: 'app-producto-serial',
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
    ProductoSerialModal,
  ],
  templateUrl: './producto-serial.component.html',
  styleUrls: ['./producto-serial.component.scss'],
})
export default class ProductoSerialComponent implements AfterViewInit {
  private readonly productoSerialService = inject(ProductoSerialService);
  private readonly productoService = inject(ProductoService);
  private readonly alert = inject(AlertService);

  displayedColumns: string[] = ['idProducto', 'producto', 'serial', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<ProductoSerial>([]);
  productosMap = new Map<number, Producto>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  modalOpen = false;
  serialSeleccionado?: ProductoSerial;
  cargando = false; // Control de barra azul

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

  cargarSeriales(): void {
    this.cargando = true; // Activa barra azul
    this.productoSerialService.listarProductosSerial().subscribe({
      next: (data: any[]) => {
        const mapped: ProductoSerial[] = (data ?? []).map(x => ({
          idProductoSerial: x.idProductoSerial,
          idProducto: x.fkProducto?.idProducto,
          serial: x.serial,
          estado: x.estado
        }));
        this.dataSource.data = mapped;
        this.cargando = false; // Desactiva barra
      },
      error: async (err) => {
        this.cargando = false;
        this.dataSource.data = [];
        await this.alert.error('Error', this.alert.getErrorMessage(err, 'No se pudieron listar seriales.'));
      }
    });
  }

  private cargarProductosParaMap(): void {
    this.productoService.listarProductos().subscribe({
      next: (prods) => {
        // FILTRADO DE PRODUCTOS ACTIVOS PARA EL MAPA
        const activos = (prods ?? []).filter((p: any) => p.esActivo !== false);
        this.productosMap = new Map(activos.map(p => [p.idProducto, p]));
        this.dataSource.data = [...this.dataSource.data];
      },
      error: (err) => console.error('Error cargando productos', err)
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.dataSource.filter = value.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  getNombreProducto(idProducto: number): string {
    return this.productosMap.get(idProducto)?.nombre ?? 'Producto no encontrado/inactivo';
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
    const ok = await this.alert.confirm('Eliminar', `¿Eliminar serial "${row.serial}"?`, 'Sí, eliminar');
    if (!ok) return;

    this.cargando = true;
    this.productoSerialService.eliminarProductoSerial(id).subscribe({
      next: async () => {
        await this.alert.toast('success', 'Eliminado');
        this.cargarSeriales();
      },
      error: async (err) => {
        this.cargando = false;
        await this.alert.error('Error', this.alert.getErrorMessage(err));
      }
    });
  }

  cerrarModal(): void {
    this.modalOpen = false;
  }

  onSaved(): void {
    this.cargarSeriales();
    this.cerrarModal();
  }
}