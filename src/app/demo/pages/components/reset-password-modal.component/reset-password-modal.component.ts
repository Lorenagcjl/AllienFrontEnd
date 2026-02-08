import { Component, EventEmitter, HostListener, inject, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { UsuarioService } from 'src/app/@theme/services/user.service';
import { SharedModule } from 'src/app/demo/shared/shared.module';

@Component({
  selector: 'app-reset-password-modal',
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule],
  templateUrl: './reset-password-modal.component.html',
  styleUrl: './reset-password-modal.component.scss',
})
export class ResetPasswordModalComponent {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private alertService = inject(AlertService);

  @Input() idUsuario!: number;
  @Input() nombreUsuario = '';

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<boolean>();

  cargando = false;
  hide = true;

  form: FormGroup = this.fb.group({
    claveTemporal: ['', [Validators.required, Validators.minLength(6)]],
  });

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

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.alertService.warning('Atención', 'Ingresa una clave temporal válida.');
      return;
    }

    const confirmado = await this.alertService.confirm(
      '¿Resetear contraseña?',
      `Se asignará una contraseña temporal y se obligará al cambio en el próximo login.`,
      'Sí, asignar'
    );

    if (!confirmado) return;

    this.cargando = true;
    const loadingId = this.alertService.loading('Procesando...', 'Asignando contraseña temporal');

    const claveTemporal = this.form.value.claveTemporal;

    this.usuarioService.resetPassword(this.idUsuario, claveTemporal).subscribe({
      next: () => {
        this.alertService.close(loadingId);
        this.alertService.toast('success', 'Contraseña temporal asignada');
        this.saved.emit(true);
      },
      error: (err: any) => {
        this.cargando = false;
        this.alertService.close(loadingId);
        const msg = err?.message ?? 'Error al resetear contraseña';
        this.alertService.error('Error', msg);
      }
    });
  }
}
