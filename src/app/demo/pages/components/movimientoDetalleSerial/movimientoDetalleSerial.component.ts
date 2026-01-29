import { AfterViewInit, Component, ViewChild, OnInit, inject } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { mdsService } from 'src/app/@theme/services/mds.service';
import { Mds } from 'src/app/demo/models/mds.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { mdsFormComponent } from '../mdsform/mds-form.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-vts',
  imports: [
    SharedModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatDialogModule
  ],
  templateUrl: './movimientoDetalleSerial.component.html',
  styleUrls: ['./movimientoDetalleSerial.component.scss']
})
export default class vtsComponent implements OnInit, AfterViewInit {
  private dialog = inject(MatDialog);

  // Columnas que coinciden con la entidad vts
  displayedColumns: string[] = [
    'idMovimientoDetalleSerial',
    'idMovimientoDetalle',
    'idProductoSerial'
  ];

  dataSource = new MatTableDataSource<Mds>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private mdsService = inject(mdsService);

  ngOnInit() {
    this.cargarMds();
  }

  cargarMds() {
    this.mdsService.listarMds().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: (err) => console.error('Error al cargar Movimiento', err)
    });
  }

  abrirFormulario(vts?: Mds) {
    const dialogRef = this.dialog.open(mdsFormComponent, {
      width: '600px',
      disableClose: true,
      data: vts || null
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {

        const payload = {
          idMovimientoDetalleSerial: result.idMovimientoDetalleSerial ?? null,
          fkMovimientoDetalle: {
            idDetalleVenta: result.idDetalleVenta
          },
          fkProductoSerial: {
            idProductoSerial: result.idProductoSerial
          }
        };

        const observable = payload.idMovimientoDetalleSerial
          ? this.mdsService.actualizar(payload.idMovimientoDetalleSerial, payload)
          : this.mdsService.guardar(payload);

        observable.subscribe({
          next: () => {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: `Serial ${payload.idMovimientoDetalleSerial ? 'actualizado' : 'guardado'}`,
              showConfirmButton: false,
              timer: 2000
            });
            this.cargarMds();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo guardar: ' + (err.error?.message || err.message)
            });
          }
        });
      }
    });


  }

  eliminar(mds: Mds) {
    if (!mds?.idMovimientoDetalleSerial) {
      console.error('ID de vts inválido', mds);
      return;
    }

    Swal.fire({
      title: '¿Eliminar vts?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mdsService.eliminar(mds.idMovimientoDetalleSerial!).subscribe(() => {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'vts eliminado',
            showConfirmButton: false,
            timer: 3000
          });

          this.cargarMds();
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
