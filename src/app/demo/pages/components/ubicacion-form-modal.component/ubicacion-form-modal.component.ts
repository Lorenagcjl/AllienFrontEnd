import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SharedModule } from 'src/app/demo/shared/shared.module'; // Importante para mat-form-field
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

import { AlertService } from 'src/app/@theme/services/alert.service';
import { UbicacionService } from 'src/app/@theme/services/ubicacion.service';
import { Ubicacion } from 'src/app/demo/models/ubicacion.model';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-ubicacion-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule
  ],
  templateUrl: './ubicacion-form-modal.component.html',
  styleUrls: ['./ubicacion-form-modal.component.scss'],
})
export class UbicacionFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ubicacionService = inject(UbicacionService);
  private readonly alert = inject(AlertService);

  @Input() ubicacion?: Ubicacion;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<boolean>();

  cargando = false;

  form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    tipo: ['', [Validators.required]],
    descripcion: ['', [Validators.required]],
    esPuntoVenta: [false],
  });

  ngOnInit(): void {
    if (this.ubicacion) {
      this.form.patchValue({
        nombre: this.ubicacion.nombre ?? '',
        tipo: this.ubicacion.tipo ?? '',
        descripcion: this.ubicacion.descripcion ?? '',
        esPuntoVenta: this.ubicacion.esPuntoVenta ?? false,
      });
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.onClose();
  }

  onClose(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.alert.warning('Atención', 'Por favor completa los campos requeridos.');
      return;
    }

    const confirmado = await this.alert.confirm(
      'Confirmar',
      this.ubicacion?.idUbicacion ? '¿Actualizar ubicación?' : '¿Guardar nueva ubicación?'
    );

    if (!confirmado) return;

    this.cargando = true;
    const loadingId = this.alert.loading('Guardando...', 'Procesando datos');
    const payload = {
      ...this.form.value,
      esPuntoVenta: !!this.form.value.esPuntoVenta,
    };

    const request = this.ubicacion?.idUbicacion
      ? this.ubicacionService.actualizarUbicacion(this.ubicacion.idUbicacion, payload)
      : this.ubicacionService.crearUbicacion(payload);

    request.subscribe({
      next: () => {
        this.alert.close(loadingId);
        this.alert.toast('success', 'Guardado exitosamente');
        this.saved.emit(true);
      },
      error: (err) => {
        this.cargando = false;
        this.alert.close(loadingId);
        this.alert.error('Error', this.alert.getErrorMessage(err));
      }
    });
  }
}
