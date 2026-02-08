import { Component, EventEmitter, HostListener, inject, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { UsuarioService } from 'src/app/@theme/services/user.service';
import { SharedModule } from 'src/app/demo/shared/shared.module';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule],
  templateUrl: './change-password-modal.component.html',
  styleUrl: './change-password-modal.component.scss',
})
export class ChangePasswordModalComponent {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private alertService = inject(AlertService);

  @Input() idUsuario!: number;

  /** si es true: no puede cerrar sin cambiar (modo esNuevo) */
  @Input() obligatorio = true;

  @Output() closed = new EventEmitter<void>();
  @Output() changed = new EventEmitter<boolean>();

  cargando = false;
  hideActual = true;
  hideNueva = true;

  form: FormGroup = this.fb.group({
    claveActual: ['', Validators.required],
    claveNueva: ['', [Validators.required, Validators.minLength(6)]],
  });

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (!this.obligatorio) this.onClose();
  }

  onBackdropClick(event: MouseEvent): void {
    if (!this.obligatorio && event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onClose(): void {
    this.closed.emit();
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.alertService.warning('Atención', 'Completa los campos correctamente.');
      return;
    }

    const confirmado = await this.alertService.confirm(
      '¿Cambiar contraseña?',
      'Se actualizará tu contraseña para continuar.',
      'Sí, cambiar'
    );

    if (!confirmado) return;

    this.cargando = true;
    const loadingId = this.alertService.loading('Procesando...', 'Actualizando contraseña');

    const payload = this.form.value;

    this.usuarioService.cambiarPassword(this.idUsuario, payload).subscribe({
      next: () => {
        this.alertService.close(loadingId);
        this.alertService.toast('success', 'Contraseña actualizada');
        this.changed.emit(true);
      },
      error: (err: any) => {
        this.cargando = false;
        this.alertService.close(loadingId);
        const msg = err?.message ?? 'Error al cambiar contraseña';
        this.alertService.error('Error', msg);
      }
    });
  }

}
