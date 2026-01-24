import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { UsuarioService } from 'src/app/@theme/services/user.service';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import Swal from 'sweetalert2';

const solamenteLetras = '^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]*$';
@Component({
  selector: 'app-user-form',
  imports: [SharedModule, MatDialogModule, ReactiveFormsModule, MatSelectModule, MatOptionModule],
  templateUrl: './user-form.component.html'
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private dialogRef = inject(MatDialogRef<UserFormComponent>);
  hidePassword = true;
  
  // Recibimos los datos del usuario si es edición
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  userForm: FormGroup = this.fb.group({
    idUsuario: [null],
    primerNombre: ['', [Validators.required, Validators.pattern(solamenteLetras)]],
    segundoNombre: ['', [Validators.required, Validators.pattern(solamenteLetras)]],
    primerApellido: ['', [Validators.required, Validators.pattern(solamenteLetras)]],
    segundoApellido: ['', [Validators.required, Validators.pattern(solamenteLetras)]],
    nombreUsuario: ['', Validators.required],
    correoElectronico: ['', [Validators.required, Validators.email]],
    cedula: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    clave: ['', Validators.required],
    rol: ['', Validators.required]
  });

  ngOnInit(): void {
  if (this.data) {
    // MODO EDICIÓN
    this.userForm.patchValue(this.data);
    this.userForm.get('clave')?.clearValidators();
  } else {
    // MODO CREACIÓN
    this.userForm.reset();
    this.userForm.get('clave')?.setValidators([Validators.required, Validators.minLength(6)]);
  }
  this.userForm.get('clave')?.updateValueAndValidity();
}

  save() {
    if (this.userForm.valid) {
      const usuario = this.userForm.value;
      const request = usuario.idUsuario 
        ? this.usuarioService.actualizar(usuario.idUsuario, usuario)
        : this.usuarioService.guardar(usuario);

      request.subscribe({
        next: () => {
          
          this.dialogRef.close(true);

          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.addEventListener('mouseenter', Swal.stopTimer)
              toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
          });

          Toast.fire({
            icon: 'success',
            title: usuario.idUsuario ? 'Usuario actualizado' : 'Usuario guardado'
          });
        },
        error: (err) => {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'Hubo un problema',
            showConfirmButton: false,
            timer: 4000
          });
        }
      });
    }
  }
}