import { Component, OnInit, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DetalleVentaService } from 'src/app/@theme/services/detalleventa.service';
import { ProductoService } from 'src/app/@theme/services/producto.service';
import { UbicacionService } from 'src/app/@theme/services/ubicacion.service';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { InventarioMovimiento } from 'src/app/demo/models/inventariomovimiento.model';
import { InventarioMovimientoService } from 'src/app/@theme/services/inventariomovimiento.service';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-detalleventa',
  standalone: true,
  imports: [
    CommonModule, 
    SharedModule, 
    ReactiveFormsModule, 
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule, 
    MatSelectModule, 
    MatTableModule 
  ],
  templateUrl: './detalleventa.html',
  styleUrls: ['./detalleventa.scss']
})
export default class DetalleventaComponent implements OnInit {
  private movimientoService = inject(InventarioMovimientoService);
  private fb = inject(FormBuilder);
  private detalleService = inject(DetalleVentaService);
  private productoService = inject(ProductoService);
  private ubicacionService = inject(UbicacionService);

  detalles: any[] = [];
  productos: any[] = [];
  ubicaciones: any[] = [];
  form: FormGroup;
  totalFactura: number = 0;
  
  // Nueva variable para controlar el stock en la UI
  stockDisponible: number | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<DetalleventaComponent>
  ) {
    this.form = this.fb.group({
      idProducto: [null, Validators.required],
      idUbicacion: [null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [0, [Validators.required, Validators.min(0.01)]],
      porcentajeComision: [0]
    });
  }

  ngOnInit() {
  this.cargarCatalogos();
  this.listarDetalles();

  // Lógica de Producto (Precio y Comisión)
  this.form.get('idProducto')?.valueChanges.subscribe(idSel => {
    const productoEncontrado = this.productos.find(p => p.idProducto === idSel);
    if (productoEncontrado) {
      this.form.patchValue({
        precioUnitario: productoEncontrado.precioVenta,
        porcentajeComision: productoEncontrado.porcentajeComision
      });
    }
    this.verificarStock();
  });

  // --- NUEVA LÓGICA: Autocorrección de Cantidad ---
  this.form.get('cantidad')?.valueChanges.subscribe(valor => {
    if (this.stockDisponible !== null && valor > this.stockDisponible) {
      // Si pone 5 y hay 3, le seteamos 3 automáticamente
      this.form.get('cantidad')?.patchValue(this.stockDisponible, { emitEvent: false });
      
      // Opcional: un pequeño toast para avisar por qué cambió
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      Toast.fire({
        icon: 'warning',
        title: `Ajustado al stock disponible: ${this.stockDisponible}`
      });
    }
  });
}
private verificarStock() {
  const idProd = this.form.get('idProducto')?.value;
  const idUbi = this.form.get('idUbicacion')?.getRawValue(); // Usar getRawValue si está deshabilitado

  if (idProd && idUbi) {
    this.movimientoService.obtenerStock(idProd, idUbi).subscribe({
      next: (stock) => {
        this.stockDisponible = stock;
        // Si el stock es 0, bloqueamos la cantidad en 0
        if (stock === 0) {
          this.form.get('cantidad')?.setValue(0);
        }
      },
      error: () => this.stockDisponible = 0
    });
  }
}
  cargarCatalogos() {
  this.productoService.listarProductos().subscribe({
    next: (res) => this.productos = res
  });

  this.ubicacionService.listar().subscribe({
    next: (res) => {
      this.ubicaciones = res;
      const uLocal = res.find(u => u.nombre.toLowerCase() === 'local');
      
      if (uLocal) {
        this.form.get('idUbicacion')?.setValue(uLocal.idUbicacion);
        this.form.get('idUbicacion')?.disable(); 
        this.verificarStock();
      }
    }
  });
}

  listarDetalles() {
    this.detalleService.listar().subscribe(res => {
      this.detalles = res.filter(d => d.fkVenta?.idVenta === this.data.idVenta);
      this.totalFactura = this.detalles.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    });
  }

  agregarItem() {
  // 1. Usamos getRawValue() para incluir el idUbicacion deshabilitado
  const val = this.form.getRawValue();

  if (this.form.invalid && !val.idUbicacion) return;

  // 2. Validación de stock
  if (this.stockDisponible !== null && val.cantidad > this.stockDisponible) {
    Swal.fire('Atención', `No hay stock suficiente en Local (${this.stockDisponible})`, 'warning');
    return;
  }

  const payloadDetalle = {
    cantidad: val.cantidad,
    precioUnitario: val.precioUnitario,
    porcentajeComision: val.porcentajeComision,
    subtotal: (val.cantidad * val.precioUnitario),
    fkVenta: { idVenta: this.data.idVenta },
    fkProducto: { idProducto: val.idProducto },
    fkUbicacion: { idUbicacion: val.idUbicacion } // Ahora sí tendrá el valor
  };

  this.detalleService.guardar(payloadDetalle).subscribe({
    next: (detalleGuardado) => {
      const movimiento: InventarioMovimiento = {
        tipo: 'Venta',
        cantidadEntrada: 0,
        cantidadSalida: val.cantidad,
        referenciaTipo: 'VentaDetalle',
        referenciaId: detalleGuardado.idVentaDetalle, 
        fkProducto: { idProducto: val.idProducto },
        fkUbicacion: { idUbicacion: val.idUbicacion },
        fkProductoSerial: null 
      };

      this.movimientoService.guardar(movimiento).subscribe({
        next: () => {
          this.listarDetalles(); 
          // Resetamos pero manteniendo el ID de ubicación
          const idUbiActual = this.form.get('idUbicacion')?.value;
          this.form.reset({ 
            idUbicacion: idUbiActual, 
            cantidad: 1, 
            precioUnitario: 0, 
            porcentajeComision: 0 
          });
          // Importante: volver a deshabilitar tras el reset si es necesario
          this.form.get('idUbicacion')?.disable();
          
          this.stockDisponible = null; 
          
          Swal.fire({
            icon: 'success',
            title: 'Agregado a la venta',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500
          });
        },
        error: (err) => Swal.fire('Error de Inventario', 'No se pudo descontar el stock', 'error')
      });
    },
    error: (err) => Swal.fire('Error', 'No se pudo agregar el producto', 'error')
  });
}
}