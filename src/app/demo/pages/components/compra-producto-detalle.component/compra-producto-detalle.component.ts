import { AfterViewInit, Component, ViewChild, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { AlertService } from 'src/app/@theme/services/alert.service';
import { CompraProductoDetalleService } from 'src/app/@theme/services/compra-producto-detalle.service';

import { CompraProductoDetalle } from 'src/app/demo/models/compra-producto-detalle.model';
import { CompraProductoDetalleModal } from '../compra-producto-detalle.modal/compra-producto-detalle.modal';


@Component({
  selector: 'app-compra-producto-detalle',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
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
    'idCompraProducto',
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

  // si viene por ruta /compra-producto-detalle/:idCompraProducto
  idCompraProductoFijo?: number;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = (row, filter) => {
      const f = filter.trim().toLowerCase();
      return (
        String(row.idCompraProductoDetalle ?? '').includes(f) ||
        String(row.fkCompraProducto?.idCompraProducto ?? '').includes(f) ||
        String(row.fkProducto?.idProducto ?? '').includes(f) ||
        String(row.fkUbicacion?.idUbicacion ?? '').includes(f) ||
        String(row.cantidad ?? '').includes(f) ||
        String(row.costoUnitario ?? '').includes(f)
      );
    };

    // leer param opcional
    const param = this.route.snapshot.paramMap.get('idCompraProducto');
    this.idCompraProductoFijo = param ? Number(param) : undefined;

    this.cargar(true);
  }

  cargar(showLoading = true): void {
    const loadingId = showLoading ? this.alert.loading('Cargando...', 'Listando detalles...') : undefined;

    this.service.listar().subscribe({
      next: (data) => {
        let rows = data ?? [];

        // si hay compra fija, filtra en frontend
        if (this.idCompraProductoFijo && this.idCompraProductoFijo > 0) {
          rows = rows.filter(x => x.fkCompraProducto?.idCompraProducto === this.idCompraProductoFijo);
        }

        this.dataSource.data = rows;
        if (showLoading) this.alert.close(loadingId);
      },
      error: async (err) => {
        if (showLoading) this.alert.close(loadingId);
        this.dataSource.data = [];
        await this.alert.error('Error', this.alert.getErrorMessage(err, 'No se pudieron listar detalles.'));
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

    const ok = await this.alert.confirm(
      'Eliminar detalle',
      `¿Eliminar el detalle #${id}?`,
      'Sí, eliminar',
      'Cancelar'
    );
    if (!ok) return;

    const loadingId = this.alert.loading('Eliminando...', 'Por favor espera.');
    this.service.eliminar(id).subscribe({
      next: async () => {
        this.alert.close(loadingId);
        await this.alert.toast('success', 'Eliminado');
        this.cargar(false);
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
    this.cargar(false);
    this.cerrarModal();
  }
}
