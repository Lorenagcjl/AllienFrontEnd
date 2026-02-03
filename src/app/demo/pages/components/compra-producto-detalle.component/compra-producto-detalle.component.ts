import { AfterViewInit, Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

import { AlertService } from 'src/app/@theme/services/alert.service';
import { CompraProductoDetalleService } from 'src/app/@theme/services/compra-producto-detalle.service';
import { CompraProductoDetalle } from 'src/app/demo/models/compra-producto-detalle.model';
import { CompraProductoDetalleModal } from '../compra-producto-detalle.modal/compra-producto-detalle.modal';

@Component({
  selector: 'app-compra-producto-detalle',
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
    MatTooltipModule,
    MatIconModule,
    CompraProductoDetalleModal
  ],
  templateUrl: './compra-producto-detalle.component.html',
  styleUrls: ['./compra-producto-detalle.component.scss'],
})
export default class CompraProductoDetalleComponent implements AfterViewInit {
  private readonly service = inject(CompraProductoDetalleService);
  private readonly alert = inject(AlertService);
  private readonly route = inject(ActivatedRoute);

  displayedColumns: string[] = [
    'idCompraProductoDetalle',
    'idProducto',
    'idUbicacion',
    'cantidad',
    'costoUnitario',
    'subtotal',
    'acciones'
  ];

  dataSource = new MatTableDataSource<CompraProductoDetalle>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  modalOpen = false;
  seleccionado?: CompraProductoDetalle;
  cargando = false;
  idCompraProductoFijo?: number;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = (row, filter) => {
      const f = filter.trim().toLowerCase();
      return (
        String(row.idCompraProductoDetalle ?? '').includes(f) ||
        String(row.fkProducto?.nombre ?? '').toLowerCase().includes(f) ||
        String(row.fkUbicacion?.nombre ?? '').toLowerCase().includes(f) ||
        String(row.cantidad ?? '').includes(f)
      );
    };

    const param = this.route.snapshot.paramMap.get('idCompraProducto');
    this.idCompraProductoFijo = param ? Number(param) : undefined;

    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.service.listar().subscribe({
      next: (data) => {
        let rows = data ?? [];
        
        // ✅ FILTRO: Solo registros activos y, si aplica, de la compra seleccionada
        rows = rows.filter((x: any) => {
          const esActivo = x.esActivo !== false;
          const perteneceACompra = this.idCompraProductoFijo 
            ? x.fkCompraProducto?.idCompraProducto === this.idCompraProductoFijo 
            : true;
          return esActivo && perteneceACompra;
        });

        this.dataSource.data = rows;
        this.cargando = false;
      },
      error: async (err) => {
        this.cargando = false;
        this.dataSource.data = [];
        await this.alert.error('Error', 'No se pudieron listar los detalles.');
      }
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.dataSource.filter = value.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  abrirFormulario(): void {
    this.seleccionado = undefined;
    this.modalOpen = true;
  }

  editar(row: CompraProductoDetalle): void {
    this.seleccionado = row;
    this.modalOpen = true;
  }

  async eliminar(row: CompraProductoDetalle): Promise<void> {
    const id = row?.idCompraProductoDetalle;
    if (!id) return;

    const ok = await this.alert.confirm('Eliminar detalle', `¿Eliminar este item de la compra?`, 'Sí, eliminar');
    if (!ok) return;

    this.cargando = true;
    this.service.eliminar(id).subscribe({
      next: async () => {
        await this.alert.toast('success', 'Item eliminado');
        this.cargar();
      },
      error: async (err) => {
        this.cargando = false;
        await this.alert.error('Error', 'No se pudo eliminar el detalle.');
      }
    });
  }

  cerrarModal(): void { this.modalOpen = false; }

  onSaved(): void {
    this.cargar();
    this.cerrarModal();
  }
}