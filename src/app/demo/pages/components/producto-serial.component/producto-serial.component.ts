import { AfterViewInit, Component, ViewChild, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { ProductoSerialService } from 'src/app/@theme/services/producto-serial.service';
import { ProductoSerial } from 'src/app/demo/models/producto-serial.model';
import { ProductoSerialFormDialog } from '../producto-serial-form.dialog/producto-serial-form.dialog';
import { ProductoService } from 'src/app/@theme/services/producto.service';
import { Producto } from 'src/app/demo/models/producto.model';

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
    MatDialogModule
  ],
  templateUrl: './producto-serial.component.html',
  styleUrls: ['./producto-serial.component.scss'],
})
export default class ProductoSerialComponent implements AfterViewInit {
  private readonly productoSerialService = inject(ProductoSerialService);
  private readonly dialog = inject(MatDialog);
  private readonly productoService = inject(ProductoService);

  displayedColumns: string[] = ['idProducto', 'producto', 'serial', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<ProductoSerial>([]);
  productosMap = new Map<number, Producto>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // filtro: por serial/estado/idProducto
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
    this.productoSerialService.listarProductosSerial().subscribe({
      next: (data: any[]) => {
        console.log('listarProductosSerial() raw =>', data);

        const mapped: ProductoSerial[] = (data ?? []).map(x => ({
          idProductoSerial: x.idProductoSerial,
          idProducto: x.fkProducto?.idProducto,   // <- AQUÍ está el id
          serial: x.serial,
          estado: x.estado
        }));

        console.table(mapped);
        this.dataSource.data = mapped;
      },
      error: (err) => {
        console.error('Error listando producto-serial', err);
        console.error('Detalle backend:', err?.error);
        this.dataSource.data = [];
      }
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.dataSource.filter = value.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  abrirFormulario(row?: ProductoSerial): void {
    const ref = this.dialog.open(ProductoSerialFormDialog, {
      width: '800px',
      data: { productoSerial: row }
    });

    ref.afterClosed().subscribe((ok) => {
      if (ok) this.cargarSeriales();
    });
  }



  getNombreProducto(idProducto: number): string {
    return this.productosMap.get(idProducto)?.nombre ?? '';
  }

  private cargarProductosParaMap(): void {
    this.productoService.listarProductos().subscribe({
      next: (prods) => {
        console.log('listarProductos() =>', prods);
        console.table(prods);

        this.productosMap = new Map((prods ?? []).map(p => [p.idProducto, p]));
        console.log('productosMap keys =>', Array.from(this.productosMap.keys()));

        // refresco visual
        this.dataSource.data = [...this.dataSource.data];
      },
      error: (err) => console.error('Error cargando productos', err)
    });
  }

  editar(row: ProductoSerial): void {
    const id = row?.idProductoSerial;
    if (!id) return;

    // 1) Consultar por id para traer los datos reales
    this.productoSerialService.obtenerPorId(id).subscribe({
      next: (full: any) => {
        // 2) Mapear (porque el backend trae fkProducto.idProducto)
        const mapped: ProductoSerial = {
          idProductoSerial: full.idProductoSerial,
          idProducto: full.fkProducto?.idProducto,
          serial: full.serial,
          estado: full.estado
        };

        // 3) Abrir modal con datos
        const ref = this.dialog.open(ProductoSerialFormDialog, {
          width: '800px',
          data: { productoSerial: mapped }
        });

        ref.afterClosed().subscribe((ok) => {
          if (ok) this.cargarSeriales();
        });
      },
      error: (err) => {
        console.error('Error consultando producto-serial por id', err);
        console.error('Detalle backend:', err?.error);
      }
    });
  }

  eliminar(row: ProductoSerial): void {
    const id = row?.idProductoSerial;
    if (!id) return;

    const ok = confirm(`¿Eliminar el serial "${row.serial}"?`);
    if (!ok) return;

    this.productoSerialService.eliminarProductoSerial(id).subscribe({
      next: () => this.cargarSeriales(),
      error: (err) => {
        console.error('Error eliminando producto-serial', err);
        console.error('Detalle backend:', err?.error);
      }
    });
  }

}
