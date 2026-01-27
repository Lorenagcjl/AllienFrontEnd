import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ProductoService } from 'src/app/@theme/services/producto.service';
import { ProductoSerialService, ProductoSerialRequest } from 'src/app/@theme/services/producto-serial.service';
import { Producto } from 'src/app/demo/models/producto.model';
import { ProductoSerial } from 'src/app/demo/models/producto-serial.model';

// ✅ AlertService
import { AlertService } from 'src/app/@theme/services/alert.service'; // ajusta ruta si es distinta

@Component({
  selector: 'app-producto-serial-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './producto-serial.modal.html',
  styleUrl: './producto-serial.modal.scss',
})
export class ProductoSerialModal implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly productoService = inject(ProductoService);
  private readonly productoSerialService = inject(ProductoSerialService);
  private readonly alert = inject(AlertService); // ✅

  @Input() open = false;
  @Input() seleccionado?: ProductoSerial;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  productosConSerial: Producto[] = [];
  loading = false;

  readonly estados = ['Disponible', 'Vendido', 'Dañado'] as const;

  form = this.fb.nonNullable.group({
    idProducto: [0, [Validators.required, Validators.min(1)]],
    serial: ['', [Validators.required, Validators.maxLength(80)]],
    estado: ['', [Validators.required]],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.cargarProductosConSerial();
      this.setForm();
    }

    if (changes['seleccionado'] && this.open) {
      this.setForm();
    }
  }

  get isEdit(): boolean {
    return !!this.seleccionado?.idProductoSerial;
  }

  private cargarProductosConSerial(): void {
    const loadingId = this.alert.loading('Cargando productos', 'Obteniendo productos con serial...');
    this.productoService.listarProductos().subscribe({
      next: (prods) => {
        this.productosConSerial = (prods ?? []).filter(p => p.esConSerial === true);
        this.alert.close(loadingId);
      },
      error: async (err) => {
        this.alert.close(loadingId);
        this.productosConSerial = [];
        await this.alert.error('Error', this.alert.getErrorMessage(err, 'No se pudieron cargar productos.'));
      }
    });
  }

  private setForm(): void {
    if (!this.seleccionado) {
      this.form.reset({ idProducto: 0, serial: '', estado: '' });
      return;
    }

    this.form.reset({
      idProducto: this.seleccionado.idProducto ?? 0,
      serial: this.seleccionado.serial ?? '',
      estado: this.seleccionado.estado ?? '',
    });
  }

  cerrar(): void {
    this.closed.emit();
  }

  async guardar(): Promise<void> {
    // 1) Validación
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.alert.toast('warning', 'Completa los campos requeridos');
      return;
    }

    const v = this.form.getRawValue();

    const payload: ProductoSerialRequest = {
      serial: v.serial,
      estado: v.estado,
      fkProducto: { idProducto: v.idProducto },
    };

    // 2) Confirmación SOLO si es edición
    if (this.isEdit) {
      const ok = await this.alert.confirm(
        'Confirmar cambios',
        `¿Deseas actualizar el serial "${this.seleccionado?.serial}"?`,
        'Sí, actualizar',
        'Cancelar'
      );
      if (!ok) return;
    }

    // 3) Loading
    const loadingId = this.alert.loading(
      this.isEdit ? 'Actualizando...' : 'Guardando...',
      'Por favor espera.'
    );
    this.loading = true;

    // 4) Request create/update
    const req$ = this.isEdit
      ? this.productoSerialService.actualizarProductoSerial(
        this.seleccionado!.idProductoSerial,
        payload
      )
      : this.productoSerialService.crearProductoSerial(payload);

    req$.subscribe({
      next: () => {
        this.loading = false;
        this.alert.close(loadingId);

        this.saved.emit();
        this.cerrar();

        this.alert.toast('success', this.isEdit ? 'Actualizado' : 'Guardado');
      },
      error: async (err) => {
        // 8) Error
        this.loading = false;
        this.alert.close(loadingId);

        await this.alert.error(
          'Error',
          this.alert.getErrorMessage(err, 'No se pudo guardar.')
        );
      }
    });
  }


}
