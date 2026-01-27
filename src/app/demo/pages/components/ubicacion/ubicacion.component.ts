import { AfterViewInit, Component, ViewChild, OnInit, inject } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { UbicacionService } from 'src/app/@theme/services/ubicacion.service';
import { Ubicacion } from 'src/app/demo/models/ubi.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UbiFormComponent } from '../ubiform/ubi-form.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ubicacion',
  imports: [SharedModule, MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatDialogModule],
  templateUrl: './ubicacion.component.html',
  styleUrls: ['./ubicacion.component.scss']
})
export default class UbicacionComponent implements OnInit, AfterViewInit {
  private dialog = inject(MatDialog);

  // Columnas que coinciden con la entidad
  displayedColumns: string[] = ['idUbicacion', 'descripcion', 'nombre', 'tipo', 'acciones'];
  dataSource = new MatTableDataSource<Ubicacion>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private ubicacionService = inject(UbicacionService);

  ngOnInit() {
    this.cargarUbicaciones();
  }

  cargarUbicaciones() {
    this.ubicacionService.listarUbicacions().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: (err) => console.error('Error al cargar ubicaciones', err)
    });
  }
  abrirFormulario(ubicacion?: Ubicacion) {
    const dialogRef = this.dialog.open(UbiFormComponent, {
      width: '600px',
      disableClose: true,
      data: ubicacion || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      if (result.idUbicacion !== null) {
        this.ubicacionService
          .actualizar(result.idUbicacion, result)
          .subscribe(() => {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Ubicación actualizada',
              showConfirmButton: false,
              timer: 3000
            });
            this.cargarUbicaciones();
          });

      } else {
        this.ubicacionService
          .guardar(result)
          .subscribe(() => {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Ubicación creada',
              showConfirmButton: false,
              timer: 3000
            });
            this.cargarUbicaciones();
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
  eliminar(ubicacion: any) {
    if (!ubicacion?.idUbicacion) {
      console.error('ID inválido', ubicacion);
      return;
    }

    Swal.fire({
      title: '¿Eliminar ubicación?',
      text: `Se eliminará "${ubicacion.nombre}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ubicacionService.eliminar(ubicacion.idUbicacion).subscribe(() => {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Ubicación eliminada',
            showConfirmButton: false,
            timer: 3000
          });

          this.cargarUbicaciones();
        });
      }
    });
  }


}