import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AlertService } from 'src/app/@theme/services/alert.service';
import { UbicacionService } from 'src/app/@theme/services/ubicacion.service';
import { Ubicacion } from 'src/app/demo/models/ubicacion.model';

@Component({
  selector: 'app-ubicacion-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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

  get editando(): boolean {
    return !!this.ubicacion?.idUbicacion && this.ubicacion.idUbicacion > 0;
  }

  form = this.fb.group({
    nombre: ['', [Validators.required]],
    tipo: ['', [Validators.required]],
    descripcion: ['', [Validators.required]],
  });

  ngOnInit(): void {
    if (this.ubicacion) {
      this.form.patchValue({
        nombre: this.ubicacion.nombre ?? '',
        tipo: this.ubicacion.tipo ?? '',
        descripcion: this.ubicacion.descripcion ?? '',
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
    if (event.target === event.currentTarget) this.onClose();
  }

  onBackdropKeydown(event: KeyboardEvent): void {
    event.preventDefault();
    this.onClose();
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.alert.warning('Formulario incompleto', 'Revisa los campos marcados antes de guardar.');
      return;
    }

    const confirmado = await this.alert.confirm(
      'Confirmar',
      this.editando ? '¿Guardar cambios de la ubicación?' : '¿Crear la ubicación?',
      'Sí, guardar',
      'Cancelar'
    );
    if (!confirmado) return;

    const v = this.form.getRawValue();

    // backend espera: nombre, tipo, descripcion
    const payload = {
      nombre: v.nombre ?? '',
      tipo: v.tipo ?? '',
      descripcion: v.descripcion ?? '',
    };

    this.alert.loading('Guardando...', this.editando ? 'Actualizando ubicación.' : 'Creando ubicación.');

    if (this.editando) {
      const id = this.ubicacion?.idUbicacion;
      if (!id) {
        this.alert.close();
        await this.alert.error('Error', 'No se encontró el ID de la ubicación para actualizar.');
        return;
      }

      this.ubicacionService.actualizarUbicacion(id, payload).subscribe({
        next: () => {
          this.alert.close();
          this.saved.emit(true);
        },
        error: async (err) => {
          console.error(err);
          this.alert.close();
          await this.alert.error('Error al actualizar', this.alert.getErrorMessage(err, 'No se pudo actualizar la ubicación.'));
        },
      });

      return;
    }

    this.ubicacionService.crearUbicacion(payload).subscribe({
      next: () => {
        this.alert.close();
        this.saved.emit(true);
      },
      error: async (err) => {
        console.error(err);
        this.alert.close();
        await this.alert.error('Error al crear', this.alert.getErrorMessage(err, 'No se pudo crear la ubicación.'));
      },
    });
  }
}
