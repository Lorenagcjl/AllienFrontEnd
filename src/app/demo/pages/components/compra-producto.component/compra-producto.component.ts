import { AfterViewInit, Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Asegúrate de importar
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar'; // Barra azul
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

import { AlertService } from 'src/app/@theme/services/alert.service';
import { CompraProductoService } from 'src/app/@theme/services/compra-producto.service';
import { CompraProducto } from 'src/app/demo/models/compra-producto.model';
import { CompraProductoModal } from '../compra-producto.modal/compra-producto.modal';

@Component({
  selector: 'app-compra-producto',
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
    CompraProductoModal
  ],
  templateUrl: './compra-producto.component.html',
  styleUrls: ['./compra-producto.component.scss'],
})
export default class CompraProductoComponent implements AfterViewInit {
  private readonly service = inject(CompraProductoService);
  private readonly alert = inject(AlertService);

  displayedColumns: string[] = ['idCompraProducto', 'fechaIngreso', 'usuario', 'observaciones', 'acciones'];
  dataSource = new MatTableDataSource<CompraProducto>([]);
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  modalOpen = false;
  seleccionado?: CompraProducto;
  cargando = false; // Control barra azul

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = (row, filter) => {
      const f = filter.trim().toLowerCase();
      return (
        String(row.idCompraProducto ?? '').includes(f) ||
        String(row.fkUsuario?.idUsuario ?? '').toLowerCase().includes(f) ||
        (row.fechaIngreso ?? '').toLowerCase().includes(f) ||
        (row.observaciones ?? '').toLowerCase().includes(f)
      );
    };

    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.service.listar().subscribe({
      next: (data) => {
        // ✅ FILTRO DE ACTIVOS
        this.dataSource.data = (data ?? []).filter((c: any) => c.esActivo !== false);
        this.cargando = false;
      },
      error: async (err) => {
        this.cargando = false;
        this.dataSource.data = [];
        await this.alert.error('Error', 'No se pudieron listar compras.');
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

  editar(row: CompraProducto): void {
    this.seleccionado = row;
    this.modalOpen = true;
  }

  async eliminar(row: CompraProducto): Promise<void> {
    const id = row?.idCompraProducto;
    if (!id) return;

    const ok = await this.alert.confirm(
      'Eliminar compra',
      `¿Eliminar la compra #${id}?`,
      'Sí, eliminar'
    );
    if (!ok) return;

    this.cargando = true;
    this.service.eliminar(id).subscribe({
      next: async () => {
        await this.alert.toast('success', 'Eliminado');
        this.cargar();
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
    this.cargar();
    this.cerrarModal();
  }
}