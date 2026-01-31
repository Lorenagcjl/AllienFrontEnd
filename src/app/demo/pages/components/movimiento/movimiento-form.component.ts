import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import { MovimientoService } from 'src/app/@theme/services/movimiento.service';
import { UbicacionesService } from 'src/app/@theme/services/ubicaciones.service';
import { UsuarioService } from 'src/app/@theme/services/user.service';
import { MovimientoRequestDto } from 'src/app/demo/models/movimiento-request.dto';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-movimiento-form',
  standalone: true,
  imports: [
    SharedModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CommonModule
  ],
  templateUrl: './movimiento-form.component.html'
})
export class MovimientoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private movimientoService = inject(MovimientoService);
  private ubicacionService = inject(UbicacionesService);
  private usuarioService = inject(UsuarioService);
  private dialogRef = inject(MatDialogRef<MovimientoFormComponent>);

  ubicaciones: any[] = [];
  usuarios: any[] = [];
  isLoading = false;

  movimientoForm: FormGroup = this.fb.group({
    idMovimiento: [null],
    fechaMovimiento: [new Date(), Validators.required],
    tipo: ['', [Validators.required, Validators.minLength(3)]],
    observaciones: ['', Validators.maxLength(500)],
    idUbicacionOrigen: [null, Validators.required],
    idUbicacionDestino: [null, Validators.required],
    idUsuario: [null, Validators.required]
  }, {
    validators: [this.ubicacionesDiferentesValidator]
  });

  get esNuevo(): boolean {
    // Si no hay datos o no hay idMovimiento, es nuevo
    return !this.data || !this.data.idMovimiento;
  }

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  /**
   * Carga ubicaciones y usuarios en paralelo
   */
  private cargarDatosIniciales(): void {
    this.isLoading = true;

    forkJoin({
      ubicaciones: this.ubicacionService.listarUbicaciones(),
      usuarios: this.usuarioService.listarUsuarios()
    }).subscribe({
      next: ({ ubicaciones, usuarios }) => {
        this.ubicaciones = ubicaciones;
        this.usuarios = usuarios;
        this.isLoading = false;

        // Si hay datos (modo edición), cargarlos
        if (this.data) {
          this.cargarDatosMovimiento();
        } else {
          // Si es nuevo, setea la fecha actual y deshabilita el campo
          this.movimientoForm.get('fechaMovimiento')?.setValue(new Date());
          this.movimientoForm.get('fechaMovimiento')?.disable();
        }
      },
      error: (err) => {
        console.error('Error al cargar datos iniciales', err);
        this.isLoading = false;

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los datos necesarios',
          confirmButtonText: 'Cerrar'
        }).then(() => {
          this.dialogRef.close(false);
        });
      }
    });
  }

  /**
   * Carga los datos del movimiento en modo edición
   */
  private cargarDatosMovimiento(): void {
    console.log('📋 Datos recibidos del backend:', this.data);

    this.movimientoForm.patchValue({
      idMovimiento: this.data.idMovimiento,
      fechaMovimiento: this.data.fechaMovimiento ? new Date(this.data.fechaMovimiento) : null,
      tipo: this.data.tipo,
      observaciones: this.data.observaciones || '',
      idUbicacionOrigen: this.data.idUbicacionOrigen,
      idUbicacionDestino: this.data.idUbicacionDestino,
      idUsuario: this.data.fkUsuario?.idUsuario
    });

    console.log('🔧 Formulario después del patch:', this.movimientoForm.value);
  }

  /**
   * Validador personalizado para evitar ubicaciones iguales
   */
  ubicacionesDiferentesValidator(group: FormGroup) {
    const origen = group.get('idUbicacionOrigen')?.value;
    const destino = group.get('idUbicacionDestino')?.value;

    if (origen && destino && origen === destino) {
      return { ubicacionesIguales: true };
    }
    return null;
  }

  /**
   * Guarda o actualiza el movimiento
   */
  /**
   * Guarda o actualiza el movimiento
   */
  save(): void {
    if (this.movimientoForm.invalid) {
      this.movimientoForm.markAllAsTouched();

      if (this.movimientoForm.errors?.['ubicacionesIguales']) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'warning',
          title: 'Las ubicaciones de origen y destino deben ser diferentes',
          showConfirmButton: false,
          timer: 3000
        });
      }
      return;
    }

    this.isLoading = true;

    // ✅ getRawValue() incluye campos deshabilitados como 'fechaMovimiento'
    const formValue = this.movimientoForm.getRawValue();

    // ✅ Construir el objeto con la estructura correcta
    const movimientoRequest: MovimientoRequestDto = {
      fechaMovimiento: formValue.fechaMovimiento,
      tipo: formValue.tipo.trim(),
      observaciones: formValue.observaciones?.trim() || '',
      idUbicacionOrigen: Number(formValue.idUbicacionOrigen),
      idUbicacionDestino: Number(formValue.idUbicacionDestino),
      idUsuario: Number(formValue.idUsuario)
    };

    // Solo agregar idMovimiento si existe (modo edición)
    if (formValue.idMovimiento && formValue.idMovimiento > 0) {
      movimientoRequest.idMovimiento = Number(formValue.idMovimiento);
    }

    console.log('📤 Request a enviar:', JSON.stringify(movimientoRequest, null, 2));

    const isEditing = !!(formValue.idMovimiento && formValue.idMovimiento > 0);

    const request$ = isEditing
      ? this.movimientoService.actualizar(formValue.idMovimiento, movimientoRequest)
      : this.movimientoService.guardar(movimientoRequest);

    request$.subscribe({
      next: (response) => {
        console.log('✅ Movimiento guardado:', response);

        setTimeout(() => {
          this.isLoading = false;
        });

        this.dialogRef.close(true);

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: isEditing
            ? 'Movimiento actualizado correctamente'
            : 'Movimiento creado correctamente',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      },
      error: (err: any) => {
        console.error('❌ Error completo:', err);

        setTimeout(() => {
          this.isLoading = false;
        });

        let errorMessage = 'Hubo un problema al guardar el movimiento';

        if (err.status === 400) {
          errorMessage = err.error?.message || 'Datos inválidos. Verifica el formulario';
        } else if (err.status === 404) {
          errorMessage = 'Movimiento no encontrado';
        } else if (err.status === 500) {
          errorMessage = 'Error en el servidor. Por favor intenta nuevamente';
        }

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          showConfirmButton: false,
          timer: 5000
        });
      }
    });
  }
  /**
   * Cierra el modal sin guardar
   */
  cancelar(): void {
    this.dialogRef.close(false);
  }

  /**
   * Helpers para validación en el template
   */
  get isTipoInvalid(): boolean {
    const control = this.movimientoForm.get('tipo');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  get isObservacionesInvalid(): boolean {
    const control = this.movimientoForm.get('observaciones');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
