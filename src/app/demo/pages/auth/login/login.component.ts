import { Component, inject } from '@angular/core';
import { FormControl, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from 'src/app/@theme/services/login.service'; 
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SharedModule, RouterModule, ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss', '../authentication.scss']
})
export default class LoginComponent {
  private router = inject(Router);
  private loginService = inject(LoginService);

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
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;

      this.loginService.login(email!, password!).subscribe({
        next: (usuario) => {
          localStorage.setItem('role', usuario.rol);
          localStorage.setItem('username', usuario.nombreUsuario);

          if (usuario.rol === 'Administrador') {
            this.router.navigate(['/admin-dashboard']);
          } else if (usuario.rol === 'Empleado') {
            this.router.navigate(['/empleado-dashboard']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (err) => {
          console.error('Error:', err);
          alert('Credenciales incorrectas');
        }
      });
    }
  }
}