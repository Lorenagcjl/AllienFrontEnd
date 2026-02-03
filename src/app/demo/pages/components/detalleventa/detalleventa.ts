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
import { VentaDetalleSerialService } from 'src/app/@theme/services/venta-detalle-serial.service';
import { ProductoSerialService } from 'src/app/@theme/services/producto-serial.service';

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
  private productoSerialService = inject(ProductoSerialService);
  private ventaDetalleSerialService = inject(VentaDetalleSerialService);

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

    this.form.get('idProducto')?.valueChanges.subscribe(idSel => {
      const productoEncontrado = this.productos.find(p => p.idProducto === idSel);
      if (productoEncontrado) {
        // Si el producto requiere serial, forzamos cantidad a 1
        if (productoEncontrado.manejaSerial) { // Asumiendo que tu modelo tiene este campo
            this.form.get('cantidad')?.setValue(1);
            this.form.get('cantidad')?.disable();
        } else {
            this.form.get('cantidad')?.enable();
        }

        this.form.patchValue({
          precioUnitario: productoEncontrado.precioVenta,
          porcentajeComision: productoEncontrado.porcentajeComision
        });
      }
      this.verificarStock();
    });

    this.form.get('cantidad')?.valueChanges.subscribe(valor => {
      if (this.stockDisponible !== null && valor > this.stockDisponible) {
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

  this.ubicacionService.listarUbicaciones().subscribe({
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

  async agregarItem() {
    const val = this.form.getRawValue();
    if (this.form.invalid && !val.idUbicacion) return;

    const productoElegido = this.productos.find(p => p.idProducto === val.idProducto);
    let idSerialSeleccionado: number | null = null;

    // 1. Lógica para productos con SERIAL
    if (productoElegido?.manejaSerial) {
      const respuesta = await this.productoSerialService.listarProductosSerial().toPromise() ?? [];
      const disponibles = respuesta.filter((s: any) => {
        const idProdSerial = s.fkProducto?.idProducto || s.idProducto;
        return idProdSerial === val.idProducto && s.estado === 'Disponible';
      });

      if (disponibles.length === 0) {
        Swal.fire('Sin Stock', 'No hay seriales disponibles para este producto', 'error');
        return;
      }

      const { value: serialId } = await Swal.fire({
        title: 'Seleccione el Serial',
        input: 'select',
        inputOptions: disponibles.reduce((acc: any, curr: any) => ({
          ...acc, 
          [curr.idProductoSerial]: curr.serial
        }), {}),
        inputPlaceholder: 'Seleccione un serial...',
        showCancelButton: true
      });

      if (!serialId) return; 
      idSerialSeleccionado = Number(serialId);
    }

    const payloadDetalle = {
      cantidad: val.cantidad,
      precioUnitario: val.precioUnitario,
      porcentajeComision: val.porcentajeComision,
      subtotal: (val.cantidad * val.precioUnitario),
      fkVenta: { idVenta: this.data.idVenta },
      fkProducto: { idProducto: val.idProducto },
      fkUbicacion: { idUbicacion: val.idUbicacion }
    };

    // 2. GUARDAR DETALLE (Paso 1 del flujo)
    this.detalleService.guardar(payloadDetalle).subscribe({
      next: (detalleGuardado) => {
        console.log('Detalle Guardado con éxito:', detalleGuardado);

        if (idSerialSeleccionado) {
          // ESTA ES LA PARTE DE POSTMAN (Paso 2 del flujo)
          // Verifica que detalleGuardado.idVentaDetalle sea el nombre correcto que devuelve tu API
          const payloadVinculo = {
            fkDetalleVenta: { idDetalleVenta: detalleGuardado.idVentaDetalle }, 
            fkProductoSerial: { idProductoSerial: idSerialSeleccionado }
          };

          console.log('Intentando vincular serial (POSTMAN PAYLOAD):', payloadVinculo);

          this.ventaDetalleSerialService.vincularSerialAVenta(payloadVinculo).subscribe({
              next: (resVinculo) => {
                  console.log('Vinculación exitosa en BD:', resVinculo);
                  this.registrarMovimiento(val, detalleGuardado.idVentaDetalle, idSerialSeleccionado);
              },
              error: (err) => {
                  console.error('ERROR AL VINCULAR SERIAL:', err);
                  Swal.fire('Error de Vinculación', 'El detalle se creó pero no se pudo asociar el serial.', 'warning');
              }
          });
        } else {
          // Si no tiene serial, solo registra el movimiento normal
          this.registrarMovimiento(val, detalleGuardado.idVentaDetalle, null);
        }
      },
      error: (err) => {
          console.error('ERROR AL GUARDAR DETALLE:', err);
          Swal.fire('Error', 'No se pudo agregar el producto', 'error');
      }
    });
  }

  private registrarMovimiento(val: any, idDetalle: number, idSerial: number | null) {
    const movimiento: InventarioMovimiento = {
      tipo: 'Venta',
      cantidadEntrada: 0,
      cantidadSalida: val.cantidad,
      referenciaTipo: 'VentaDetalle',
      referenciaId: idDetalle,
      fkProducto: { idProducto: val.idProducto },
      fkUbicacion: { idUbicacion: val.idUbicacion },
      fkProductoSerial: idSerial ? { idProductoSerial: idSerial } : null as any
    };

    console.log('Registrando movimiento de inventario:', movimiento);

    this.movimientoService.guardar(movimiento).subscribe({
      next: () => {
        this.listarDetalles();
        this.resetearFormulario();
        Swal.fire({
          icon: 'success',
          title: 'Agregado correctamente',
          toast: true,
          position: 'top-end',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (err) => console.error('Error en movimiento:', err)
    });
  }
  private resetearFormulario() {
    const idUbiActual = this.form.get('idUbicacion')?.value;
    this.form.reset({
      idUbicacion: idUbiActual,
      cantidad: 1,
      precioUnitario: 0,
      porcentajeComision: 0
    });
    // Si la ubicación debe seguir deshabilitada:
    this.form.get('idUbicacion')?.disable();
    this.stockDisponible = null;
  }
}
