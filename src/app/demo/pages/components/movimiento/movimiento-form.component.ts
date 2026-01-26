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
    imports: [SharedModule, MatDialogModule, ReactiveFormsModule, MatSelectModule, MatOptionModule, MatDatepickerModule, MatNativeDateModule],
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
            // MODO EDICIÓN: Asegurarse de que los selects reciban solo el id
            const patch = { ...this.data };
            if (patch.idUbicacionOrigen && typeof patch.idUbicacionOrigen === 'object') {
                patch.idUbicacionOrigen = patch.idUbicacionOrigen.idUbicacion;
            }
            if (patch.idUbicacionDestino && typeof patch.idUbicacionDestino === 'object') {
                patch.idUbicacionDestino = patch.idUbicacionDestino.idUbicacion;
            }
            if (patch.idUsuario && typeof patch.idUsuario === 'object') {
                patch.idUsuario = patch.idUsuario.idUsuario;
            }
            this.movimientoForm.patchValue(patch);
        } else {
            // MODO CREACIÓN
            this.movimientoForm.reset();
        }
    }

    save() {
        if (this.movimientoForm.valid) {
            const movimiento = this.movimientoForm.value;
            const request = movimiento.idMovimiento
                ? this.movimientoService.actualizar(movimiento.idMovimiento, movimiento)
                : this.movimientoService.guardar(movimiento);

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
                        title: movimiento.idMovimiento ? 'Movimiento actualizado' : 'Movimiento guardado'
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
