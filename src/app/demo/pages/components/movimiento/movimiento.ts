import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';
import { MovimientoService } from 'src/app/@theme/services/movimiento.service';
import { UbicacionesService } from 'src/app/@theme/services/ubicaciones.service';
import { UsuarioService } from 'src/app/@theme/services/user.service';
import { MovimientoModel } from 'src/app/demo/models/movimiento.model';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MovimientoModalComponent } from '../movimiento-detalle/movimiento-modal.component';
import { MovimientoFormComponent } from './movimiento-form.component';

@Component({
  selector: 'app-movimiento',
  imports: [
    SharedModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatDialogModule,
    CommonModule
  ],
  templateUrl: './movimiento.html',
  styleUrl: './movimiento.scss',
})
export default class Movimiento implements OnInit, AfterViewInit {
  private dialog = inject(MatDialog);
  private movimientoService = inject(MovimientoService);
  private ubicacionService = inject(UbicacionesService);
  private usuarioService = inject(UsuarioService);

  displayedColumns: string[] = [
    'idMovimiento',
    'fechaMovimiento',
    'observaciones',
    'tipo',
    'idUbicacionDestino',
    'idUbicacionOrigen',
    'idUsuario',
    'acciones'
  ];

  dataSource = new MatTableDataSource<MovimientoModel>([]);
  ubicaciones: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.cargarDatosIniciales();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  cargarDatosIniciales() {
    // Cargar ubicaciones y movimientos en paralelo
    forkJoin({
      ubicaciones: this.ubicacionService.listarUbicaciones(),
      movimientos: this.movimientoService.listarMovimientos()
    }).subscribe({
      next: ({ ubicaciones, movimientos }) => {
        this.ubicaciones = ubicaciones;
        this.dataSource.data = movimientos;
        console.log("Datos cargados:", { ubicaciones, movimientos });
      },
      error: (err) => console.error('Error al cargar datos', err)
    });
  }

  getNombreUbicacion(id: number): string {
    if (!id) return 'N/A';
    const ubicacion = this.ubicaciones.find(u => u.idUbicacion === id);
    return ubicacion?.nombre || 'Sin nombre';
  }

  cargarMovimientos() {
    this.movimientoService.listarMovimientos().subscribe({
      next: (data) => {
        console.log("Movimientos cargados:", data);
        this.dataSource.data = data;
      },
      error: (err) => console.error('Error al cargar movimientos', err)
    });
  }

  abrirFormulario(movimiento?: MovimientoModel) {
    const dialogRef = this.dialog.open(MovimientoFormComponent, {
      width: '600px',
      disableClose: true,
      data: movimiento || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarMovimientos();
      }
    });
  }

  verDetalle(movimiento: MovimientoModel) {
    this.dialog.open(MovimientoModalComponent, {
      width: '700px',
      data: movimiento
    });
  }

  eliminarMovimiento(movimiento: MovimientoModel) {
    if (confirm('¿Está seguro de que desea eliminar este movimiento?')) {
      this.movimientoService.eliminar(movimiento.idMovimiento).subscribe({
        next: () => {
          console.log('Movimiento eliminado');
          this.cargarMovimientos();
        },
        error: (err) => console.error('Error al eliminar movimiento', err)
      });
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
