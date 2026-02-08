import { Component, inject } from '@angular/core';
import { FormControl, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from 'src/app/@theme/services/login.service';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { CommonModule } from '@angular/common';
import { ChangePasswordModalComponent } from '../../components/change-password-modal.component/change-password-modal.component';
import { AlertService } from 'src/app/@theme/services/alert.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SharedModule, RouterModule, ReactiveFormsModule, CommonModule, ChangePasswordModalComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss', '../authentication.scss']
})
export default class LoginComponent {
  private router = inject(Router);
  private loginService = inject(LoginService);
  private alertService = inject(AlertService);

  mostrarCambioPassword = false;
  idUsuarioLogin?: number;

  hide = true;

  // Definición del formulario reactivo
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(4)])
  });

  // Getters para que el HTML pueda acceder a los controles fácilmente
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  getErrorMessage() {
    if (this.email?.hasError('required')) return 'Debes ingresar un correo';
    return this.email?.hasError('email') ? 'No es un correo válido' : '';
  }

  login() {
    if (!this.loginForm.valid) return;

    const { email, password } = this.loginForm.value;

    this.loginService.login(email!, password!).subscribe({
      next: (usuario) => {
        localStorage.setItem('usuario', JSON.stringify(usuario));
        localStorage.setItem('role', usuario.rol);
        localStorage.setItem('username', usuario.nombreUsuario);
        localStorage.setItem('idUsuario', String(usuario.idUsuario));

        if (usuario.esNuevo) {
          this.idUsuarioLogin = usuario.idUsuario;
          this.mostrarCambioPassword = true;
          return;
        }

        this.alertService.toast('success', 'Inicio de sesión exitoso');
        this.navegarSegunRol(usuario.rol);
      },
      error: () => {
        alert('Credenciales incorrectas');
      }
    });
  }

  onPasswordChanged() {
    this.mostrarCambioPassword = false;

    this.alertService.toast('success', 'Contraseña actualizada. Inicio de sesión exitoso');

    const role = localStorage.getItem('role') ?? '';
    this.navegarSegunRol(role);
  }

  navegarSegunRol(rol: string) {
    if (rol === 'Administrador') this.router.navigate(['/admin-dashboard']);
    else if (rol === 'Empleado') this.router.navigate(['/empleado-dashboard']);
    else this.router.navigate(['/dashboard']);
  }
}
