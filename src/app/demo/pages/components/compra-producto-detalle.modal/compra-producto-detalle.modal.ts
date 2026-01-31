import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { AlertService } from 'src/app/@theme/services/alert.service';
import { CompraProductoDetalleRequest, CompraProductoDetalleService } from 'src/app/@theme/services/compra-producto-detalle.service';
import { CompraProductoService } from 'src/app/@theme/services/compra-producto.service';
import { ProductoService } from 'src/app/@theme/services/producto.service';
import { CompraProductoDetalle } from 'src/app/demo/models/compra-producto-detalle.model';
import { CompraProducto } from 'src/app/demo/models/compra-producto.model';
import { Producto } from 'src/app/demo/models/producto.model';
import { UbicacionService } from 'src/app/@theme/services/ubicacion.service';
import { InventarioMovimientoService } from 'src/app/@theme/services/inventariomovimiento.service';
import { InventarioMovimiento } from 'src/app/demo/models/inventariomovimiento.model';

@Component({
  selector: 'app-compra-producto-detalle-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './compra-producto-detalle.modal.html',
  styleUrl: './compra-producto-detalle.modal.scss',
})
export class CompraProductoDetalleModal implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CompraProductoDetalleService);
  private readonly compraService = inject(CompraProductoService);
  private readonly productoService = inject(ProductoService);
  private readonly ubicacionService = inject(UbicacionService);
  private readonly movimientoService = inject(InventarioMovimientoService);
  private readonly alert = inject(AlertService);

 @Input() open = false;
  @Input() seleccionado?: any;
  @Input() idCompraProductoFijo?: number;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  loading = false;
  compras: any[] = [];
  productos: any[] = [];
  ubicaciones: any[] = [];

  form = this.fb.nonNullable.group({
    idCompraProducto: [0, [Validators.required, Validators.min(1)]],
    idProducto: [0, [Validators.required, Validators.min(1)]],
    idUbicacion: [0, [Validators.required, Validators.min(1)]],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    costoUnitario: [0, [Validators.required, Validators.min(0)]],
  });

  get isEdit(): boolean {
    return !!this.seleccionado?.idCompraProductoDetalle;
  }

  get subtotal(): number {
    const v = this.form.getRawValue();
    return (v.cantidad ?? 0) * (v.costoUnitario ?? 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.cargarCatalogos();
      this.setForm();
    }
  }

  private cargarCatalogos(): void {
    if (!this.idCompraProductoFijo) {
      this.compraService.listar().subscribe(data => this.compras = data ?? []);
    }
    this.productoService.listarProductos().subscribe(data => this.productos = data ?? []);
    this.ubicacionService.listarUbicacions().subscribe(data => {
      this.ubicaciones = data ?? [];
      // Opcional: Auto-seleccionar 'Bodega' o 'Local' si existe
      const uBodega = this.ubicaciones.find(u => u.nombre.toLowerCase().includes('bodega'));
      if (uBodega && !this.seleccionado) {
        this.form.patchValue({ idUbicacion: uBodega.idUbicacion });
      }
    });
  }

  private setForm(): void {
    const idCompra = this.idCompraProductoFijo ?? (this.seleccionado?.fkCompraProducto?.idCompraProducto ?? 0);
    this.form.reset({
      idCompraProducto: idCompra,
      idProducto: this.seleccionado?.fkProducto?.idProducto ?? 0,
      idUbicacion: this.seleccionado?.fkUbicacion?.idUbicacion ?? 0,
      cantidad: this.seleccionado?.cantidad ?? 1,
      costoUnitario: this.seleccionado?.costoUnitario ?? 0,
    });
  }

  cerrar(): void { this.closed.emit(); }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const payload: CompraProductoDetalleRequest = {
      cantidad: v.cantidad,
      costoUnitario: v.costoUnitario,
      fkCompraProducto: { idCompraProducto: v.idCompraProducto },
      fkProducto: { idProducto: v.idProducto },
      fkUbicacion: { idUbicacion: v.idUbicacion },
    };

    this.loading = true;
    const loadingId = this.alert.loading('Guardando...', 'Registrando entrada de stock');

    this.service.crear(payload).subscribe({
      next: (detalleGuardado) => {
        // REGISTRO EN INVENTARIO (ENTRADA)
        const movimiento: InventarioMovimiento = {
          tipo: 'Compra',
          cantidadEntrada: v.cantidad,
          cantidadSalida: 0,
          referenciaTipo: 'CompraDetalle',
          referenciaId: detalleGuardado.idCompraProductoDetalle,
          fkProducto: { idProducto: v.idProducto },
          fkUbicacion: { idUbicacion: v.idUbicacion },
          fkProductoSerial: null
        };

        this.movimientoService.guardar(movimiento).subscribe({
          next: () => {
            this.alert.close(loadingId);
            this.alert.toast('success', 'Compra e Inventario actualizados');
            this.saved.emit();
            this.cerrar();
          },
          error: (err) => {
            this.alert.close(loadingId);
            this.alert.error('Error Inventario', 'Detalle guardado, pero no se registró el movimiento de stock.');
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.alert.close(loadingId);
        this.alert.error('Error', this.alert.getErrorMessage(err));
      }
    });
  }
}
