import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { UbicacionService } from 'src/app/@theme/services/ubicacion.service';
import { Ubicacion } from 'src/app/demo/models/ubicacion.model';
import { UbicacionFormModalComponent } from '../ubicacion-form-modal.component/ubicacion-form-modal.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ubicacion',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    UbicacionFormModalComponent,
    MatProgressBarModule
  ],
  templateUrl: './ubicacion.component.html',
  styleUrl: './ubicacion.component.scss',
})
export default class UbicacionComponent {
  private readonly ubicacionService = inject(UbicacionService);
  private readonly alert = inject(AlertService);

  displayedColumns: string[] = ['idUbicacion', 'nombre', 'tipo', 'esPuntoVenta', 'descripcion', 'acciones'];
  dataSource = new MatTableDataSource<Ubicacion>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  modalOpen = false;
  ubicacionSeleccionada?: Ubicacion;
  isEditing = false;
  cargando = false;
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = (row: Ubicacion, filter: string) => {
      const f = filter.trim().toLowerCase();

      return (
        (row.nombre ?? '').toLowerCase().includes(f) ||
        (row.tipo ?? '').toLowerCase().includes(f) ||
        (row.descripcion ?? '').toLowerCase().includes(f) ||
        (row.esPuntoVenta && ['punto', 'venta', 'punto de venta', 'si', 'true'].some(k => k.includes(f))) ||
        (!row.esPuntoVenta && ['no', 'false'].some(k => k.includes(f)))
      );
    };

    this.cargar();
  }

  cargar(): void {
    this.cargando = true; // Inicia la barra azul

    this.ubicacionService.listarUbicaciones().subscribe({
      next: (data) => {
        // Filtramos para mostrar solo los que tienen esActivo: true (o distinto de false)
        this.dataSource.data = (data ?? []).filter((u: any) => u.esActivo !== false);
        this.cargando = false; // Apaga la barra azul
      },
      error: (err) => {
        console.error(err);
        this.dataSource.data = [];
        this.cargando = false;
        this.alert.error('Error', this.alert.getErrorMessage(err, 'No se pudo cargar la lista.'));
      },
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.dataSource.filter = value.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  abrirFormulario(row?: Ubicacion): void {
    this.ubicacionSeleccionada = row;
    this.modalOpen = true;
  }

  editar(row: Ubicacion): void {
    this.abrirFormulario(row);
  }

  cerrarModal(): void {
    this.modalOpen = false;
    this.ubicacionSeleccionada = undefined;
  }

  async onSaved(ok: boolean): Promise<void> {
    if (!ok) return;

    this.cerrarModal();
    await this.alert.success('Confirmado', 'Guardado correctamente.');
    this.cargar();
  }

  async eliminar(row: Ubicacion): Promise<void> {
    const id = row?.idUbicacion;
    if (!id) return;

    const confirmado = await this.alert.confirm(
      'Confirmar eliminación',
      `¿Eliminar la ubicación "${row.nombre}"?`,
      'Sí, eliminar',
      'Cancelar'
    );
    if (!confirmado) return;

    this.alert.loading('Eliminando...', 'Procesando la eliminación de la ubicación.');

    this.ubicacionService.eliminarUbicacion(id).subscribe({
      next: async () => {
        this.alert.close();
        await this.alert.success('Eliminado', 'La ubicación fue eliminada correctamente.');
        this.cargar();
      },
      error: async (err) => {
        console.error(err);
        this.alert.close();
        await this.alert.error('Error al eliminar', this.alert.getErrorMessage(err, 'No se pudo eliminar la ubicación.'));
      },
    });
  }
}
