import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject, OnInit, AfterViewInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MovimientoService } from 'src/app/@theme/services/movimiento.service';
import { UbicacionService } from 'src/app/@theme/services/ubicacion.service';
import { Movimiento } from 'src/app/demo/models/movimiento.model';
import { MovimientoFormComponent } from './movimiento-form.component';
import { SharedModule } from 'src/app/demo/shared/shared.module';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-movimiento',
  standalone: true,
  imports: [
    CommonModule, SharedModule, MatFormFieldModule, MatInputModule, 
    MatTableModule, MatSortModule, MatPaginatorModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatTooltipModule
  ],
  templateUrl: './movimiento.html',
  styleUrl: './movimiento.scss',
})
export default class MovimientoComponent implements OnInit, AfterViewInit {
  private dialog = inject(MatDialog);
  private movimientoService = inject(MovimientoService);
  private ubicacionService = inject(UbicacionService);

  // Columnas que coinciden con tu ResponseDTO
  displayedColumns: string[] = ['idMovimiento', 'fechaMovimiento', 'tipo', 'origen', 'destino', 'usuario', 'acciones'];
  dataSource = new MatTableDataSource<Movimiento>([]);
  ubicaciones: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.cargarCatalogosYMovimientos();
  }

  cargarCatalogosYMovimientos() {
    // Primero cargamos ubicaciones, luego movimientos para asegurar que el getNombre funcione
    this.ubicacionService.listarUbicaciones().subscribe({
      next: (ubics) => {
        this.ubicaciones = ubics;
        this.cargarMovimientos();
      }
    });
  }

  cargarMovimientos() {
    this.movimientoService.listar().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: (err) => console.error('Error al cargar movimientos', err)
    });
  }

  getNombreUbicacion(id: number): string {
    const u = this.ubicaciones.find(ub => ub.idUbicacion === id);
    return u ? u.nombre : 'N/A';
  }

  abrirFormulario(movimiento?: Movimiento) {
    const dialogRef = this.dialog.open(MovimientoFormComponent, {
      width: '600px',
      data: movimiento || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.cargarMovimientos();
    });
  }

  eliminar(id: number) {
  Swal.fire({
    title: '¿Estás seguro?',
    text: "Esta acción no se puede deshacer",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => { 
    if (result.isConfirmed) {
      this.movimientoService.eliminar(id).subscribe({
        next: () => {
          this.cargarMovimientos();
          Swal.fire('Eliminado', 'El registro ha sido borrado', 'success');
        },
        error: (err) => Swal.fire('Error', 'No se pudo eliminar el registro', 'error')
      });
    }
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