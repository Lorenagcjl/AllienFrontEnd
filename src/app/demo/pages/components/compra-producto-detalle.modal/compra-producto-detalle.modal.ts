import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AlertService } from 'src/app/@theme/services/alert.service';
import { CompraProductoDetalleRequest, CompraProductoDetalleService } from 'src/app/@theme/services/compra-producto-detalle.service';
import { CompraProductoService } from 'src/app/@theme/services/compra-producto.service';
import { ProductoService } from 'src/app/@theme/services/producto.service';

import { CompraProductoDetalle } from 'src/app/demo/models/compra-producto-detalle.model';
import { CompraProducto } from 'src/app/demo/models/compra-producto.model';
import { Producto } from 'src/app/demo/models/producto.model';

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
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './compra-producto-detalle.modal.html',
  styleUrl: './compra-producto-detalle.modal.scss',
})
export class CompraProductoDetalleModal implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CompraProductoDetalleService);
  private readonly compraService = inject(CompraProductoService);
  private readonly productoService = inject(ProductoService);
  private readonly alert = inject(AlertService);

  @Input() open = false;
  @Input() seleccionado?: CompraProductoDetalle;
  @Input() idCompraProductoFijo?: number;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  loading = false;
  compras: CompraProducto[] = [];
  productos: Producto[] = [];

  form = this.fb.nonNullable.group({
    idCompraProducto: [0, [Validators.required, Validators.min(1)]],
    idProducto: [0, [Validators.required, Validators.min(1)]],
    idUbicacion: [1, [Validators.required, Validators.min(1)]], // Default 1
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
      this.cargarCombos();
      this.setForm();
    }
  }

  private cargarCombos(): void {
    // 1. Cargar Compras (Solo activas)
    if (!this.idCompraProductoFijo) {
      this.compraService.listar().subscribe({
        next: (data) => this.compras = (data ?? []).filter((c: any) => c.esActivo !== false),
      });
    }

    // 2. Cargar Productos (Solo activos)
    this.productoService.listarProductos().subscribe({
      next: (data) => this.productos = (data ?? []).filter((p: any) => p.esActivo !== false),
    });
  }

  private setForm(): void {
    if (!this.seleccionado) {
      this.form.reset({
        idCompraProducto: this.idCompraProductoFijo ?? 0,
        idProducto: 0,
        idUbicacion: 1,
        cantidad: 1,
        costoUnitario: 0,
      });
      return;
    }

    this.form.reset({
      idCompraProducto: this.idCompraProductoFijo ?? (this.seleccionado.fkCompraProducto?.idCompraProducto ?? 0),
      idProducto: this.seleccionado.fkProducto?.idProducto ?? 0,
      idUbicacion: this.seleccionado.fkUbicacion?.idUbicacion ?? 1,
      cantidad: this.seleccionado.cantidad ?? 1,
      costoUnitario: this.seleccionado.costoUnitario ?? 0,
    });
  }

  cerrar(): void {
    this.closed.emit();
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.alert.toast('warning', 'Completa los campos requeridos');
      return;
    }

    const ok = await this.alert.confirm(
      this.isEdit ? 'Actualizar Registro' : 'Confirmar Adición',
      this.isEdit ? '¿Guardar cambios en este item?' : '¿Añadir este producto a la compra?',
      'Confirmar'
    );
    if (!ok) return;

    this.loading = true;
    const v = this.form.getRawValue();
    const idCompra = this.idCompraProductoFijo ?? v.idCompraProducto;

    const payload: CompraProductoDetalleRequest = {
      cantidad: v.cantidad,
      costoUnitario: v.costoUnitario,
      fkCompraProducto: { idCompraProducto: idCompra },
      fkProducto: { idProducto: v.idProducto },
      fkUbicacion: { idUbicacion: v.idUbicacion },
    };

    const req$ = this.isEdit
      ? this.service.actualizar(this.seleccionado!.idCompraProductoDetalle, payload)
      : this.service.crear(payload);

    req$.subscribe({
      next: async () => {
        this.loading = false;
        await this.alert.toast('success', this.isEdit ? 'Actualizado' : 'Guardado');
        this.saved.emit();
      },
      error: async (err) => {
        this.loading = false;
        await this.alert.error('Error', this.alert.getErrorMessage(err));
      }
    });
  }
}