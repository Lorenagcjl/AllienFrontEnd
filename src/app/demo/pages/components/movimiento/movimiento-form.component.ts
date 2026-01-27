import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MovimientoService } from 'src/app/@theme/services/movimiento.service';
import { UbicacionesService } from 'src/app/@theme/services/ubicaciones.service';
import { UsuarioService } from 'src/app/@theme/services/user.service';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-movimiento-form',
    standalone: true,
    imports: [SharedModule, MatDialogModule, ReactiveFormsModule, MatSelectModule, MatOptionModule, MatDatepickerModule, MatNativeDateModule, CommonModule],
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

    movimientoForm: FormGroup = this.fb.group({
        idMovimiento: [null],
        fechaMovimiento: ['', Validators.required],
        tipo: ['', Validators.required],
        observaciones: [''],
        idUbicacionOrigen: [null, Validators.required],
        idUbicacionDestino: [null, Validators.required],
        idUsuario: [null, Validators.required]
    });

    constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

    ngOnInit(): void {
        this.ubicacionService.listarUbicaciones().subscribe({
            next: (data) => this.ubicaciones = data,
            error: (err) => console.error('Error al cargar ubicaciones', err)
        });

        this.usuarioService.listarUsuarios().subscribe({
            next: (data) => this.usuarios = data,
            error: (err) => console.error('Error al cargar usuarios', err)
        });

        if (this.data) {
            // MODO EDICIÓN
            console.log('📋 Datos recibidos del backend:', this.data); // 🔍 DEBUG

            const patch: any = {
                idMovimiento: this.data.idMovimiento,
                fechaMovimiento: this.data.fechaMovimiento ? new Date(this.data.fechaMovimiento) : null,
                tipo: this.data.tipo,
                observaciones: this.data.observaciones,
                idUbicacionOrigen: null,
                idUbicacionDestino: null,
                idUsuario: null
            };

            // Extraer ID del Usuario
            if (this.data.fkUsuario?.idUsuario) {
                patch.idUsuario = this.data.fkUsuario.idUsuario;
            }

            // Extraer IDs de Ubicaciones
            // El backend puede enviar solo el ID (Long) o un objeto completo
            patch.idUbicacionOrigen = this.data.idUbicacionOrigen;
            patch.idUbicacionDestino = this.data.idUbicacionDestino;

            console.log('🔧 Patch aplicado al formulario:', patch); // 🔍 DEBUG

            this.movimientoForm.patchValue(patch);
        }
    }

    save() {
        if (this.movimientoForm.valid) {
            const formValue = this.movimientoForm.value;

            // Construir el objeto que espera el backend
            const movimientoRequest: {
                idMovimiento: number | null;
                fechaMovimiento: Date;
                tipo: string;
                observaciones: string;
                idUbicacionOrigen: number;
                idUbicacionDestino: number;
                fkUsuario: { idUsuario: number };
            } = {
                idMovimiento: formValue.idMovimiento,
                fechaMovimiento: formValue.fechaMovimiento,
                tipo: formValue.tipo,
                observaciones: formValue.observaciones,
                idUbicacionOrigen: formValue.idUbicacionOrigen,
                idUbicacionDestino: formValue.idUbicacionDestino,
                fkUsuario: {
                    idUsuario: formValue.idUsuario
                }
            };

            const request = movimientoRequest.idMovimiento
                ? this.movimientoService.actualizar(movimientoRequest.idMovimiento, movimientoRequest)
                : this.movimientoService.guardar(movimientoRequest);

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
                        title: movimientoRequest.idMovimiento ? 'Movimiento actualizado' : 'Movimiento guardado'
                    });
                },
                error: (err: any) => {
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
