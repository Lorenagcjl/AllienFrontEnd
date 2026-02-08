import { Component, EventEmitter, HostListener, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { ProductoPrecioVentaService } from 'src/app/@theme/services/producto-precio-venta.service';
import { SharedModule } from 'src/app/demo/shared/shared.module';

@Component({
  selector: 'app-change-price-modal',
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule],
  templateUrl: './change-price-modal.component.html',
  styleUrl: './change-price-modal.component.scss',
})
export class ChangePriceModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private alert = inject(AlertService);
  private precioService = inject(ProductoPrecioVentaService);

  @Input() idProducto!: number;
  @Input() precioActual: number | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<boolean>();

  cargando = false;

  form = this.fb.group({
    precioVenta: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    // precargar en el input el precio actual (si viene)
    if (this.precioActual !== null && this.precioActual !== undefined) {
      this.form.patchValue({ precioVenta: this.precioActual });
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.onClose();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.onClose();
  }

  onClose(): void {
    this.closed.emit();
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.alert.warning('Atención', 'Ingresa un precio válido.');
      return;
    }

    const nuevoPrecio = Number(this.form.value.precioVenta);

    const precioActualMostrar =
      this.precioActual !== null && this.precioActual !== undefined
        ? Number(this.precioActual).toFixed(2)
        : 'N/A';

    const confirmado = await this.alert.confirm(
      '¿Cambiar precio?',
      `Precio actual: $${precioActualMostrar}\nNuevo precio: $${nuevoPrecio.toFixed(2)}`,
      'Sí, cambiar'
    );
    if (!confirmado) return;

    this.cargando = true;
    const loadingId = this.alert.loading('Procesando...', 'Actualizando precio');

    this.precioService.cambiarPrecio(this.idProducto, nuevoPrecio).subscribe({
      next: () => {
        this.cargando = false;
        this.alert.close(loadingId);
        this.alert.toast('success', 'Precio actualizado');
        this.saved.emit(true);
      },
      error: async (err) => {
        this.cargando = false;
        this.alert.close(loadingId);
        await this.alert.error('Error', this.alert.getErrorMessage(err, 'No se pudo cambiar el precio.'));
      }
    });
  }
}
