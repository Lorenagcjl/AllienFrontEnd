import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MovimientoService } from 'src/app/@theme/services/movimiento.service';
import { UbicacionService } from 'src/app/@theme/services/ubicacion.service';
import { UsuarioService } from 'src/app/@theme/services/user.service';
import { Movimiento, MovimientoRequest } from 'src/app/demo/models/movimiento.model';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-movimiento-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, 
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule
  ],
  templateUrl: './movimiento-form.component.html'
})
export class MovimientoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private movimientoService = inject(MovimientoService);
  private ubicacionService = inject(UbicacionService);
  
  form: FormGroup;
  ubicaciones: any[] = [];
  tiposMovimiento = ['TRASLADO', 'COMPRA', 'VENTA', 'AJUSTE'];

  constructor(
    public dialogRef: MatDialogRef<MovimientoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Movimiento | null
  ) {
    this.form = this.fb.group({
      fechaMovimiento: [new Date().toISOString(), Validators.required],
      tipo: ['', Validators.required],
      observaciones: ['', Validators.required],
      idUbicacionOrigen: [null, Validators.required],
      idUbicacionDestino: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.cargarUbicaciones();
    if (this.data) {
      // Si recibimos data, es EDICIÓN: Parchamos el formulario
      this.form.patchValue({
        fechaMovimiento: this.data.fechaMovimiento,
        tipo: this.data.tipo,
        observaciones: this.data.observaciones,
        idUbicacionOrigen: this.data.idUbicacionOrigen,
        idUbicacionDestino: this.data.idUbicacionDestino
      });
    }
  }

  cargarUbicaciones() {
    this.ubicacionService.listarUbicaciones().subscribe(res => this.ubicaciones = res);
  }

  guardar() {
    const { idUbicacionOrigen, idUbicacionDestino } = this.form.value;
    if (this.form.invalid) return;

    if (idUbicacionOrigen === idUbicacionDestino) {
    Swal.fire('Atención', 'La ubicación de origen y destino no pueden ser la misma', 'warning');
    return;
  }

    const payload: MovimientoRequest = {
      ...this.form.value,
      idUsuario: 1 // Por ahora quemado, luego lo sacas de tu AuthService
    };

    if (this.data?.idMovimiento) {
      // EDITAR
      this.movimientoService.actualizar(this.data.idMovimiento, payload).subscribe({
        next: () => this.cerrarConExito('Actualizado'),
        error: () => Swal.fire('Error', 'No se pudo actualizar', 'error')
      });
    } else {
      // CREAR
      this.movimientoService.crear(payload).subscribe({
        next: () => this.cerrarConExito('Creado'),
        error: () => Swal.fire('Error', 'No se pudo crear', 'error')
      });
    }
  }

  cerrarConExito(msg: string) {
    Swal.fire({
      icon: 'success',
      title: msg,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500
    });
    this.dialogRef.close(true);
  }
}