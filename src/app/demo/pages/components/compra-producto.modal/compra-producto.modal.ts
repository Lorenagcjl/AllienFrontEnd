import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

import { AlertService } from 'src/app/@theme/services/alert.service';
import { CompraProductoRequest, CompraProductoService } from 'src/app/@theme/services/compra-producto.service';
import { ProductoService } from 'src/app/@theme/services/producto.service';
import { CompraProducto } from 'src/app/demo/models/compra-producto.model';
import { Producto } from 'src/app/demo/models/producto.model';

@Component({
  selector: 'app-compra-producto-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './compra-producto.modal.html',
  styleUrl: './compra-producto.modal.scss',
})
export class CompraProductoModal implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CompraProductoService);
  private readonly productoService = inject(ProductoService); // Inyectado para futuros filtros
  private readonly alert = inject(AlertService);

  @Input() open = false;
  @Input() seleccionado?: CompraProducto;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  loading = false;
  productosActivos: Producto[] = [];

  form = this.fb.nonNullable.group({
    fechaIngreso: ['', [Validators.required]],
    idUsuario: [1, [Validators.required, Validators.min(1)]],
    observaciones: ['', [Validators.maxLength(500)]],
  });

  get isEdit(): boolean {
    return !!this.seleccionado?.idCompraProducto;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.cargarProductosActivos();
      this.setForm();
    }
  }

  private cargarProductosActivos(): void {
    // Aunque este modal es la cabecera, preparamos la lista de productos activos
    this.productoService.listarProductos().subscribe({
      next: (prods) => {
        this.productosActivos = (prods ?? []).filter(p => p.esActivo !== false);
      }
    });
  }

  private setForm(): void {
    if (!this.seleccionado) {
      const now = new Date();
      const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      this.form.reset({ fechaIngreso: local, idUsuario: 1, observaciones: '' });
      return;
    }

    const f = this.seleccionado.fechaIngreso ?? '';
    const dt = f ? new Date(f) : new Date();
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    this.form.reset({
      fechaIngreso: local,
      idUsuario: this.seleccionado.fkUsuario?.idUsuario ?? 1,
      observaciones: this.seleccionado.observaciones ?? '',
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

    // CONFIRMACIÓN SIEMPRE (Nuevo y Editar)
    const tituloConfirm = this.isEdit ? 'Confirmar cambios' : 'Confirmar Registro';
    const msgConfirm = this.isEdit 
      ? `¿Deseas actualizar la compra #${this.seleccionado?.idCompraProducto}?`
      : '¿Deseas registrar esta nueva compra?';

    const ok = await this.alert.confirm(tituloConfirm, msgConfirm, 'Confirmar');
    if (!ok) return;

    const v = this.form.getRawValue();
    const payload: CompraProductoRequest = {
      fechaIngreso: new Date(v.fechaIngreso).toISOString(),
      observaciones: v.observaciones ?? '',
      fkUsuario: { idUsuario: v.idUsuario },
    };

    const loadingId = this.alert.loading('Procesando...', 'Por favor espera.');
    this.loading = true;

    const req$ = this.isEdit
      ? this.service.actualizar(this.seleccionado!.idCompraProducto, payload)
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
        await this.alert.error('Error', this.alert.getErrorMessage(err));
      }
    });
  }
}