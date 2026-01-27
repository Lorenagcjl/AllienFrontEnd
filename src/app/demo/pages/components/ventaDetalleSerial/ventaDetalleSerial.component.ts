import { AfterViewInit, Component, ViewChild, OnInit, inject } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { vtsService } from 'src/app/@theme/services/vts.service';
import { Vts } from 'src/app/demo/models/vts.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { vtsFormComponent } from '../vtsform/vts-form.component';
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
  templateUrl: './ventaDetalleSerial.component.html',
  styleUrls: ['./ventaDetalleSerial.component.scss']
})
export default class vtsComponent implements OnInit, AfterViewInit {
  private dialog = inject(MatDialog);

  // Columnas que coinciden con la entidad vts
  displayedColumns: string[] = [
    'idVentaDetalleSerial',
    'idDetalleVenta',
    'idProductoSerial'
  ];

  dataSource = new MatTableDataSource<Vts>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private vtsService = inject(vtsService);

  ngOnInit() {
    this.cargarvtss();
  }

  cargarvtss() {
    this.vtsService.listarvtss().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: (err) => console.error('Error al cargar Venta', err)
    });
  }

  abrirFormulario(vts?: Vts) {
    const dialogRef = this.dialog.open(vtsFormComponent, {
      width: '600px',
      disableClose: true,
      data: vts || null
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {

        const payload = {
          idVentaDetalleSerial: result.idVentaDetalleSerial ?? null,
          fkDetalleVenta: {
            idDetalleVenta: result.idDetalleVenta
          },
          fkProductoSerial: {
            idProductoSerial: result.idProductoSerial
          }
        };

        const observable = payload.idVentaDetalleSerial
          ? this.vtsService.actualizar(payload.idVentaDetalleSerial, payload)
          : this.vtsService.guardar(payload);

        observable.subscribe({
          next: () => {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: `Serial ${payload.idVentaDetalleSerial ? 'actualizado' : 'guardado'}`,
              showConfirmButton: false,
              timer: 2000
            });
            this.cargarvtss();
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

  eliminar(vts: Vts) {
    if (!vts?.idVentaDetalleSerial) {
      console.error('ID de vts inválido', vts);
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
        this.vtsService.eliminar(vts.idVentaDetalleSerial!).subscribe(() => {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'vts eliminado',
            showConfirmButton: false,
            timer: 3000
          });

          this.cargarvtss();
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
