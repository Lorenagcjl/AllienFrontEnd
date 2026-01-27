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
  private readonly alert = inject(AlertService);

  @Input() open = false;
  @Input() seleccionado?: CompraProductoDetalle;

  // si viene fijo por el componente (ruta), este id se usa siempre
  @Input() idCompraProductoFijo?: number;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  loading = false;

  compras: CompraProducto[] = [];
  productos: Producto[] = [];

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
      // cargar combos + setear form
      this.cargarCombos();
      this.setForm();
    }

    if (changes['seleccionado'] && this.open) {
      this.setForm();
    }
  }

  private cargarCombos(): void {
    // compras (solo si no viene fija)
    if (!this.idCompraProductoFijo) {
      this.compraService.listar().subscribe({
        next: (data) => this.compras = data ?? [],
        error: (err) => console.error('Error cargando compras', err),
      });
    }

    // productos
    this.productoService.listarProductos().subscribe({
      next: (data) => this.productos = data ?? [],
      error: (err) => console.error('Error cargando productos', err),
    });
  }

  private setForm(): void {
    if (!this.seleccionado) {
      this.form.reset({
        idCompraProducto: this.idCompraProductoFijo ?? 0,
        idProducto: 0,
        idUbicacion: 0,
        cantidad: 1,
        costoUnitario: 0,
      });
      return;
    }

    this.form.reset({
      idCompraProducto: this.idCompraProductoFijo ?? (this.seleccionado.fkCompraProducto?.idCompraProducto ?? 0),
      idProducto: this.seleccionado.fkProducto?.idProducto ?? 0,
      idUbicacion: this.seleccionado.fkUbicacion?.idUbicacion ?? 0,
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

    const v = this.form.getRawValue();
    const idCompra = this.idCompraProductoFijo ?? v.idCompraProducto;

    if (!idCompra || idCompra < 1) {
      this.alert.toast('warning', 'Debes seleccionar una compra válida.');
      return;
    }

    const payload: CompraProductoDetalleRequest = {
      cantidad: v.cantidad,
      costoUnitario: v.costoUnitario,
      fkCompraProducto: { idCompraProducto: idCompra },
      fkProducto: { idProducto: v.idProducto },
      fkUbicacion: { idUbicacion: v.idUbicacion },
    };

    if (this.isEdit) {
      const ok = await this.alert.confirm(
        'Confirmar cambios',
        `¿Deseas actualizar el detalle #${this.seleccionado?.idCompraProductoDetalle}?`,
        'Sí, actualizar',
        'Cancelar'
      );
      if (!ok) return;
    }

    const loadingId = this.alert.loading(
      this.isEdit ? 'Actualizando...' : 'Guardando...',
      'Por favor espera.'
    );
    this.loading = true;

    const req$ = this.isEdit
      ? this.service.actualizar(this.seleccionado!.idCompraProductoDetalle, payload)
      : this.service.crear(payload);

    req$.subscribe({
      next: async () => {
        this.loading = false;
        this.alert.close(loadingId);
        await this.alert.toast('success', this.isEdit ? 'Actualizado' : 'Guardado');
        this.saved.emit();
        this.cerrar();
      },
      error: async (err) => {
        this.loading = false;
        this.alert.close(loadingId);
        await this.alert.error('Error', this.alert.getErrorMessage(err, 'No se pudo guardar.'));
      }
    });
  }
}
