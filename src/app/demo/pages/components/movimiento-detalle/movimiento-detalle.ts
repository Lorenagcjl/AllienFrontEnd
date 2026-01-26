import { Component, ViewChild, inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MovimientoDetalleService } from 'src/app/@theme/services/movimiento-detalle.service';
import { UsuarioService } from 'src/app/@theme/services/user.service';
import { MovimientoDetalleModel } from 'src/app/demo/models/movimiento-detalle.model';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MovimientoModalComponent } from './movimiento-modal.component';

@Component({
  selector: 'app-movimiento-detalle',
  imports: [SharedModule, MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatDialogModule],
  templateUrl: './movimiento-detalle.html',
  styleUrl: './movimiento-detalle.scss',
})
export default class MovimientoDetalle {
  private dialog = inject(MatDialog);

  // Columnas que coinciden con la entidad
  displayedColumns: string[] = ['idMovimientoDetalle', 'cantidad',  'idProducto','idMovimiento'];
  dataSource = new MatTableDataSource<MovimientoDetalleModel>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private usuarioService = inject(UsuarioService);
  private movimientoDetalleService = inject(MovimientoDetalleService);

  ngOnInit() {
    this.cargarMovimientoDetalles();
  }

  verMovimiento(movimiento: any) {
    this.dialog.open(MovimientoModalComponent, {
      data: movimiento,
      width: '400px',
    });
  }

  // cargarUsuarios() {
  //   this.usuarioService.listarUsuarios().subscribe({
  //     next: (data) => {
  //       this.dataSource.data = data;
  //     },
  //     error: (err) => console.error('Error al cargar usuarios', err)
  //   });
  // }

  cargarMovimientoDetalles() {
    
    this.movimientoDetalleService.listarMovimientoDetalles().subscribe({
      next: (data) => {
        console.log(data)
        this.dataSource.data = data;
      },
      error: (err) => console.error('Error al cargar detalles de movimiento', err)
    })
  }

  // cambiarEstado(usuario: any) {
  //   const accion = usuario.esActivo ? 'desactivar' : 'activar';
  //   const colorIcono = usuario.esActivo ? '#f8bb86' : '#a5dc86';

  //   Swal.fire({
  //     title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
  //     text: `¿Estás seguro de que deseas ${accion} al usuario ${usuario.nombreUsuario}?`,
  //     icon: 'question',
  //     iconColor: colorIcono,
  //     showCancelButton: true,
  //     confirmButtonColor: '#3085d6',
  //     cancelButtonColor: '#d33',
  //     confirmButtonText: `Sí, ${accion}`,
  //     cancelButtonText: 'Cancelar',
  //     reverseButtons: true
  //   }).then((result) => {
  //     if (result.isConfirmed) {
  //       // Mantenemos tu lógica original de suscripción
  //       this.usuarioService.eliminar(usuario.idUsuario).subscribe({
  //         next: () => {
  //           this.cargarUsuarios(); // Recarga la lista

  //           // Toast rápido en la esquina superior derecha
  //           Swal.fire({
  //             toast: true,
  //             position: 'top-end',
  //             icon: 'success',
  //             title: `Usuario ${accion === 'activar' ? 'activado' : 'desactivado'}`,
  //             showConfirmButton: false,
  //             timer: 2000,
  //             timerProgressBar: true
  //           });
  //         },
  //         error: (err) => {
  //           Swal.fire({
  //             icon: 'error',
  //             title: 'Error',
  //             text: 'No se pudo cambiar el estado: ' + (err.error?.message || err.message)
  //           });
  //         }
  //       });
  //     }
  //   });
  // }

  // abrirFormulario(usuario?: Usuario) {
  //   const dialogRef = this.dialog.open(UserFormComponent, {
  //     width: '600px',
  //     disableClose: true, // Evita que se cierre al hacer clic fuera
  //     data: usuario || null // Si no hay usuario, pasamos null explícitamente
  //   });

  //   dialogRef.afterClosed().subscribe(result => {
  //     if (result) {
  //       this.cargarUsuarios(); // Refresca la tabla si se guardó con éxito
  //     }
  //   });
  // }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
