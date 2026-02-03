// src/app/pages/venta/venta.component.ts

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
import { VentaResponse } from 'src/app/demo/models/venta.model';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { VentaformComponent } from '../ventaform/ventaform';
import DetalleventaComponent from '../detalleventa/detalleventa';

@Component({
  selector: 'app-venta',
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
    VentaformComponent 
  ],
  templateUrl: './venta.html',
  styleUrls: ['./venta.scss'],
})
export default class VentaComponent implements OnInit, AfterViewInit {
  private dialog = inject(MatDialog);
  private ventaService = inject(VentaService);
  private alertService = inject(AlertService);

  // ESTADO IDÉNTICO A USUARIOS
  modalOpen = false;
  ventaParaEditar?: VentaResponse;
  cargando: boolean = false;

  displayedColumns: string[] = ['numeroFactura', 'fechaVenta', 'cliente', 'usuario', 'total', 'acciones'];
  dataSource = new MatTableDataSource<VentaResponse>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.cargarVentas();
  }

  cargarVentas() {
    this.cargando = true;
    this.ventaService.listarVentas().subscribe({
      next: (data: VentaResponse[]) => {
        // ✅ Filtramos por activos igual que en la lógica de negocio de usuarios
        this.dataSource.data = (data ?? []).filter((v: any) => v.esActivo === true);
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.alertService.error('Error', 'No se pudieron cargar las ventas');
      }
    });
  }

  // ✅ IGUAL QUE abrirFormulario(usuario)
  abrirFormulario(venta?: VentaResponse) {
    this.ventaParaEditar = venta;
    this.modalOpen = true;
  }

  cerrarModal() {
    this.modalOpen = false;
    this.ventaParaEditar = undefined;
  }

  onSaved(exito: boolean) {
    if (exito) {
      this.cerrarModal();
      this.cargarVentas();
    }
  }

  verDetalle(venta: VentaResponse) {
    const dialogRef = this.dialog.open(DetalleventaComponent, {
      width: '1000px',
      data: venta,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(() => this.cargarVentas());
  }

  async anularVenta(venta: VentaResponse) {
    const confirmado = await this.alertService.confirm(
      '¿Anular Factura?',
      `¿Estás seguro de anular la factura ${venta.numeroFactura}? Esta acción devolverá el stock.`,
      'Sí, anular'
    );

    if (confirmado) {
      this.cargando = true;
      const loadingId = this.alertService.loading('Anulando...', 'Procesando devolución de inventario');
      
      this.ventaService.eliminarVenta(venta.idVenta).subscribe({
        next: () => {
          this.alertService.close(loadingId);
          this.alertService.toast('success', 'Venta anulada correctamente');
          this.cargarVentas();
        },
        error: (err) => {
          this.cargando = false;
          this.alertService.close(loadingId);
          this.alertService.error('Error', 'No se pudo anular la venta');
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