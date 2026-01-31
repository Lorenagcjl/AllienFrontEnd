import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MovimientoService } from 'src/app/@theme/services/movimiento.service';
import { UsuarioService } from 'src/app/@theme/services/user.service';
import { MovimientoModel } from 'src/app/demo/models/movimiento.model';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MovimientoModalComponent } from '../movimiento-detalle/movimiento-modal.component';
import { MovimientoFormComponent } from './movimiento-form.component';
import { UbicacionService } from 'src/app/@theme/services/ubicacion.service';

@Component({
  selector: 'app-movimiento',
  imports: [SharedModule, MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatDialogModule, CommonModule],
  templateUrl: './movimiento.html',
  styleUrl: './movimiento.scss',
})

export default class Movimiento {
  private dialog = inject(MatDialog);

  displayedColumns: string[] = ['idMovimiento', 'fechaMovimiento', 'observaciones', 'tipo', 'idUbicacionDestino', 'idUbicacionOrigen', 'idUsuario', 'acciones'];
  dataSource = new MatTableDataSource<MovimientoModel>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private usuarioService = inject(UsuarioService);
  private movimientoService = inject(MovimientoService);
  private ubicacionService = inject(UbicacionService);
  ubicaciones: any[] = [];

  ngOnInit() {
    this.cargarMovimientos();
    this.ubicacionService.listarUbicaciones().subscribe({
      next: (data) => {
        this.ubicaciones = data;
        console.log("Ubicaciones cargadas:", data);
      },
      error: (err) => console.error('Error al cargar ubicaciones', err)
    });
  }

  getNombreUbicacion(id: number): string {
    return this.ubicaciones.find(u => u.idUbicacion === id)?.nombre || '';
  }



  cargarMovimientos() {

    this.movimientoService.listarMovimientos().subscribe({
      next: (data) => {
        console.log("Movimientos cargados:", data);
        this.dataSource.data = data;
      },
      error: (err) => console.error('Error al cargar detalles de movimiento', err)
    })
  }


  abrirFormulario(movimiento?: MovimientoModel) {
    const dialogRef = this.dialog.open(MovimientoFormComponent, {
      width: '600px',
      disableClose: true, // Evita que se cierre al hacer clic fuera
      data: movimiento || null // Si no hay movimiento, pasamos null explícitamente
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarMovimientos(); // Refresca la tabla si se guardó con éxito
      }
    });
  }
  verDetalle(movimiento: MovimientoModel) {
    this.dialog.open(MovimientoModalComponent, {
      width: '700px',
      data: movimiento // Aquí pasas el objeto de la fila
    });
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
