import { AfterViewInit, Component, ViewChild, OnInit, inject } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { DatePipe, CommonModule } from '@angular/common';

// Importaciones de Movimiento
import { MovimientoService } from 'src/app/@theme/services/movimiento.service';
import { UbicacionService } from 'src/app/@theme/services/ubicacion.service';
import { Movimiento } from 'src/app/demo/models/movimiento.model';
import { MovimientoFormComponent } from './movimiento-form.component';
import MovimientoDetalleComponent from '../movimiento-detalle/movimiento-detalle';

@Component({
  selector: 'app-movimiento',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatTableModule, 
    MatSortModule, 
    MatPaginatorModule, 
    MatDialogModule, 
    MatProgressBarModule, 
    MovimientoFormComponent,
    DatePipe
  ],
  templateUrl: './movimiento.html',
  styleUrl: './movimiento.scss'
})
export default class MovimientoComponent implements OnInit, AfterViewInit {
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private movimientoService = inject(MovimientoService);
  private ubicacionService = inject(UbicacionService);

  modalOpen = false;
  movimientoParaEditar?: Movimiento;
  cargando: boolean = false;
  
  // Añadimos 'estado' a las columnas
  displayedColumns: string[] = ['idMovimiento', 'fechaMovimiento', 'tipo', 'origen', 'destino', 'usuario', 'acciones'];
  dataSource = new MatTableDataSource<Movimiento>([]);
  ubicaciones: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.cargarCatalogosYMovimientos();
  }

  cargarCatalogosYMovimientos() {
    this.cargando = true;
    this.ubicacionService.listarUbicaciones().subscribe({
      next: (ubics) => {
        this.ubicaciones = ubics;
        this.cargarMovimientos();
      },
      error: () => {
        this.cargando = false;
        this.alertService.error('Error', 'No se pudieron cargar las ubicaciones');
      }
    });
  }

 cargarMovimientos() {
    this.cargando = true;
    this.movimientoService.listar().subscribe({
      next: (data) => {
        // Filtramos para dejar solo los registros donde esActivo sea true
        // Si tu backend usa 'estado' o 'activo', ajusta el nombre de la propiedad
        this.dataSource.data = data.filter((m: any) => m.esActivo === true);
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.alertService.error('Error', 'No se pudieron cargar los movimientos');
      }
    });
  }

  getNombreUbicacion(id: number): string {
    const u = this.ubicaciones.find(ub => ub.idUbicacion === id);
    return u ? u.nombre : 'N/A';
  }

  // --- Lógica de Formulario (Modal) ---
  abrirFormulario(movimiento?: Movimiento) {
    this.movimientoParaEditar = movimiento;
    this.modalOpen = true;
  }

  cerrarModal() {
    this.modalOpen = false;
    this.movimientoParaEditar = undefined;
  }

  onSaved(exito: boolean) {
    if (exito) {
      this.cerrarModal();
      this.cargarMovimientos();
    }
  }

  verDetalle(movimiento: Movimiento) {
    this.dialog.open(MovimientoDetalleComponent, {
      width: '1000px',
      data: movimiento,
      disableClose: true
    });
  }

  async eliminar(id: number) {
    const confirmado = await this.alertService.confirm(
      '¿Eliminar movimiento?',
      '¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.',
      'Sí, eliminar'
    );

    if (confirmado) {
      this.cargando = true;
      const loadingId = this.alertService.loading('Eliminando...', 'Procesando solicitud');

      this.movimientoService.eliminar(id).subscribe({
        next: () => {
          this.alertService.close(loadingId);
          this.cargarMovimientos();
          this.alertService.toast('success', 'Movimiento eliminado correctamente');
        },
        error: (err) => {
          this.cargando = false;
          this.alertService.close(loadingId);
          const msg = this.alertService.getErrorMessage(err);
          this.alertService.error('Error', msg);
        }
      });
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}