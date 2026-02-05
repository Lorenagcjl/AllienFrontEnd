import { Component, EventEmitter, Input, Output, inject, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsuarioService } from 'src/app/@theme/services/user.service';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { Usuario } from 'src/app/demo/models/user.model';


@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule, MatSelectModule, MatOptionModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private alertService = inject(AlertService);
  private solamenteLetras = '^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]*$';
  @Input() usuarioSeleccionado?: Usuario;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<boolean>();

  hidePassword = true;
  cargando = false;

  userForm: FormGroup = this.fb.group({
    idUsuario: [null],
    primerNombre: ['', [Validators.required, Validators.pattern(this.solamenteLetras)]],
    segundoNombre: ['', [Validators.required, Validators.pattern(this.solamenteLetras)]],
    primerApellido: ['', [Validators.required, Validators.pattern(this.solamenteLetras)]],
    segundoApellido: ['', [Validators.required, Validators.pattern(this.solamenteLetras)]],
    nombreUsuario: ['', [Validators.required]],
    correoElectronico: ['', [Validators.required, Validators.email]],
    cedula: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    clave: ['', Validators.required],
    rol: ['', Validators.required]
  });

  validarEntrada(event: KeyboardEvent, tipo: 'letras' | 'numeros'): void {
    const regex = tipo === 'letras' ? /[a-zA-ZáéíóúÁÉÍÓÚñÑ ]/ : /[0-9]/;
    const key = event.key;
    if (key.length === 1 && !regex.test(key)) {
      event.preventDefault();
    }
  }
  ngOnInit(): void {
    if (this.usuarioSeleccionado) {
      this.userForm.patchValue(this.usuarioSeleccionado);
      this.userForm.get('clave')?.clearValidators();
    } else {
      this.userForm.get('clave')?.setValidators([Validators.required, Validators.minLength(6)]);
    }
    this.userForm.get('clave')?.updateValueAndValidity();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.onClose();
  }

  onClose(): void {
    this.closed.emit();
  }
  // Dentro de UserFormComponent
onBackdropClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) {
    this.onClose();
  }
}

  async save() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      await this.alertService.warning('Atención', 'Por favor completa los campos requeridos correctamente.');
      return;
    }

    const confirmado = await this.alertService.confirm(
      this.usuarioSeleccionado ? '¿Actualizar usuario?' : '¿Guardar nuevo usuario?',
      '¿Estás seguro de realizar esta acción?'
    );

    if (!confirmado) return;

    this.cargando = true;
    const loadingId = this.alertService.loading('Guardando...', 'Procesando datos del usuario');

    const datos = this.userForm.value;
    const request = datos.idUsuario 
      ? this.usuarioService.actualizar(datos.idUsuario, datos)
      : this.usuarioService.guardar(datos);

    request.subscribe({
      next: () => {
        this.alertService.close(loadingId);
        this.alertService.toast('success', 'Guardado exitosamente');
        this.saved.emit(true);
      },
      error: (err) => {
        this.cargando = false;
        this.alertService.close(loadingId);
        this.alertService.error('Error', this.alertService.getErrorMessage(err));
      }
    });
  }
}