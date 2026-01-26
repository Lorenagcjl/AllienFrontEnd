import { AfterViewInit, Component, ViewChild, OnInit, inject } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VentaService } from 'src/app/@theme/services/venta.service';
import { CommonModule } from '@angular/common';
import { VentaResponse } from 'src/app/demo/models/venta.model'; // Crea este modelo
//import { VentaFormComponent } from '../venta-form/venta-form.component'; // El que crearemos
import Swal from 'sweetalert2';
import { VentaformComponent } from '../ventaform/ventaform';
import DetalleventaComponent from '../detalleventa/detalleventa';

@Component({
  selector: 'app-venta',
  imports: [CommonModule, SharedModule, MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatDialogModule],
  templateUrl: './venta.html',
  styleUrls: ['./venta.scss'],
})
export default class VentaComponent implements OnInit, AfterViewInit{
private dialog = inject(MatDialog);
  private ventaService = inject(VentaService);
  // Columnas para la tabla de ventas
  displayedColumns: string[] = ['numeroFactura', 'fechaVenta', 'cliente', 'usuario', 'total', 'acciones'];
  dataSource = new MatTableDataSource<VentaResponse>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.cargarVentas();
  }
  cargarVentas() {
  this.ventaService.listarVentas().subscribe({
    next: (data: VentaResponse[]) => {
      this.dataSource.data = data;
    },
    error: (err) => console.error(err)
  });
}

 // Sigue la lógica de tu abrirFormulario de Usuarios
  nuevaVenta() {
    const dialogRef = this.dialog.open(VentaformComponent, {
      width: '700px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarVentas(); // Recarga la tabla si se guardó la venta
      }
    });
  }

  // En venta.ts
verDetalle(venta: VentaResponse) {
  const dialogRef = this.dialog.open(DetalleventaComponent, {
    width: '1000px',
    data: venta,
    disableClose: true
  });

  // ESTO ES LO NUEVO:
  dialogRef.afterClosed().subscribe(() => {
    this.cargarVentas(); // Esto vuelve a traer las ventas del backend con sus totales actualizados
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
