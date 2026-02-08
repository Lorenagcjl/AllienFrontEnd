import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ProductoPrecioVentaService } from 'src/app/@theme/services/producto-precio-venta.service';
import { ProductoService } from 'src/app/@theme/services/producto.service';
import { Producto } from 'src/app/demo/models/producto.model';

type HistorialPrecio = {
  idPrecioVenta: number;
  idProducto: number;
  precioVenta: number;
  desde: string; // viene como ISO string
  hasta: string | null;
};
@Component({
  selector: 'app-historial-precios.component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './historial-precios.component.html',
  styleUrl: './historial-precios.component.scss',
})
export default class HistorialPreciosComponent implements AfterViewInit {
  private readonly productoService = inject(ProductoService);
  private readonly precioService = inject(ProductoPrecioVentaService);

  // Select de productos
  productos: Producto[] = [];
  productoIdSeleccionado?: number;

  // Tabla historial
  displayedColumns: string[] = ['idPrecioVenta', 'precioVenta', 'desde', 'hasta'];
  dataSource = new MatTableDataSource<HistorialPrecio>([]);

  cargandoProductos = false;
  cargandoHistorial = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // filtro sólido
    this.dataSource.filterPredicate = (row, filter) => {
      const f = filter.trim().toLowerCase();
      return (
        String(row.idPrecioVenta).includes(f) ||
        String(row.precioVenta).includes(f) ||
        (row.desde ?? '').toLowerCase().includes(f) ||
        (row.hasta ?? '').toLowerCase().includes(f)
      );
    };

    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargandoProductos = true;
    this.productoService.listarProductos().subscribe({
      next: (prods) => {
        // si manejas esActivo, deja solo activos
        this.productos = (prods ?? []).filter(p => p.esActivo !== false);

        this.cargandoProductos = false;

        // opcional: autoseleccionar el primero
        if (this.productos.length > 0 && !this.productoIdSeleccionado) {
          this.productoIdSeleccionado = this.productos[0].idProducto;
          this.cargarHistorial();
        }
      },
      error: () => {
        this.cargandoProductos = false;
        console.error('No se pudieron cargar productos');
      }
    });
  }

  onProductoChange(): void {
    // cuando cambia el select, trae el historial
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    const id = this.productoIdSeleccionado;
    if (!id) {
      this.dataSource.data = [];
      return;
    }

    this.cargandoHistorial = true;
    this.dataSource.data = []; // limpia mientras carga

    // IMPORTANTE: tu backend real es /api/producto/{id}/historial-precios
    // Si tu servicio aún apunta a /api/productoPrecioVenta/producto/{id}, cámbialo.
    // Ideal: ajusta tu service para pegarle al endpoint real.

    this.precioService.obtenerHistorial(id).subscribe({
      next: (rows: any[]) => {
        const data: HistorialPrecio[] = (rows ?? []).map(r => ({
          idPrecioVenta: Number(r.idPrecioVenta),
          idProducto: Number(r.idProducto),
          precioVenta: Number(r.precioVenta),
          desde: r.desde,
          hasta: r.hasta ?? null,
        }));

        // más nuevo arriba
        data.sort((a, b) => (b.desde ?? '').localeCompare(a.desde ?? ''));

        this.dataSource.data = data;
        this.dataSource.paginator?.firstPage();
        this.cargandoHistorial = false;
      },
      error: () => {
        this.cargandoHistorial = false;
        console.error('No se pudo cargar historial');
      }
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.dataSource.filter = value.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  get cargando(): boolean {
    return this.cargandoProductos || this.cargandoHistorial;
  }
}
