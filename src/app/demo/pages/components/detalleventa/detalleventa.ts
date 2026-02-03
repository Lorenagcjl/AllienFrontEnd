import { AfterViewInit, Component, ViewChild, OnInit, inject, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { DetalleVentaService } from 'src/app/@theme/services/detalleventa.service';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { DetalleventaForm } from '../detalleventa-form/detalleventa-form';

@Component({
  selector: 'app-detalleventa',
  standalone: true,
  imports: [
    CommonModule, MatFormFieldModule, MatInputModule, MatTableModule, 
    MatSortModule, MatPaginatorModule, MatProgressBarModule, MatIconModule, 
    MatButtonModule, MatTooltipModule, DetalleventaForm
  ],
  templateUrl: './detalleventa.html'
})
export default class DetalleventaComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() idVenta!: number | string; 
  
  private alertService = inject(AlertService);
  private detalleService = inject(DetalleVentaService);
  private cd = inject(ChangeDetectorRef); // Para solucionar el error de NG0100

  modalOpen = false;
  detalleParaEditar?: any;
  cargando: boolean = false;
  totalFactura: number = 0;

  displayedColumns: string[] = ['idDetalle', 'producto', 'cantidad', 'precioUnitario', 'subtotal', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    // Si ya tenemos el ID al iniciar, cargamos
    if (this.idVenta) {
      this.cargarDetalles();
    }
  }

  // ESTO ES CLAVE: Si el ID viene de una ruta o de un clic en otra tabla, 
  // este método detecta el cambio y recarga los datos automáticamente.
  ngOnChanges(changes: SimpleChanges) {
    if (changes['idVenta'] && !changes['idVenta'].firstChange) {
      this.cargarDetalles();
    }
  }

  cargarDetalles() {
    if (!this.idVenta) return;
    
    this.cargando = true;
    // Forzamos un ciclo para evitar el error de "ExpressionChanged..."
    this.cd.detectChanges();

    this.detalleService.listar().subscribe({
      next: (data: any[]) => {
        // Filtro ultra-flexible: usamos == para comparar string vs number sin líos
        const filtrados = data.filter(d => d.fkVenta?.idVenta == this.idVenta);
        
        this.dataSource.data = filtrados;
        
        this.totalFactura = filtrados
          .filter(d => d.esActivo !== false)
          .reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);
          
        this.cargando = false;
        this.cd.detectChanges(); // Asegura que la tabla se pinte
      },
      error: (err) => {
        this.cargando = false;
        console.error("Error cargando detalles:", err);
        this.alertService.error('Error', 'No se pudieron cargar los productos');
      }
    });
  }

  async cambiarEstado(detalle: any) {
    const accion = detalle.esActivo ? 'eliminar' : 'restaurar';
    const confirmado = await this.alertService.confirm(
      `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} producto?`,
      `¿Deseas ${accion} ${detalle.fkProducto?.nombre} de esta factura?`,
      `Sí, ${accion}`
    );

    if (confirmado) {
      this.cargando = true;
      const loadingId = this.alertService.loading('Procesando...', 'Actualizando detalle');
      
      const id = detalle.idDetalleVenta || detalle.idVentaDetalle;
      this.detalleService.eliminar(id).subscribe({
        next: () => {
          this.alertService.close(loadingId);
          this.cargarDetalles();
          this.alertService.toast('success', `Producto actualizado`);
        },
        error: () => {
          this.cargando = false;
          this.alertService.close(loadingId);
        }
      });
    }
  }

  abrirFormulario(detalle?: any) {
    this.detalleParaEditar = detalle;
    this.modalOpen = true;
  }

  cerrarModal() {
    this.modalOpen = false;
    this.detalleParaEditar = undefined;
  }

  onSaved(exito: boolean) {
    if (exito) {
      this.cerrarModal();
      this.cargarDetalles();
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