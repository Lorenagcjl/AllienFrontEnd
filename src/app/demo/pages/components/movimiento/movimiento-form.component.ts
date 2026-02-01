import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import { MovimientoService } from 'src/app/@theme/services/movimiento.service';
import { ProductosService } from 'src/app/@theme/services/productos.service';
import { UbicacionesService } from 'src/app/@theme/services/ubicaciones.service';
import { UsuarioService } from 'src/app/@theme/services/user.service';
import { MovimientoDetalleRequestDto } from 'src/app/demo/models/movimiento-detalle-request.dto';
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
  private productoService = inject(ProductosService);

  productos: any[] = []; // Para el select de productos
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
    idUsuario: [null, Validators.required],
    detalles: this.fb.array([], Validators.required)
  }, {
    validators: [this.ubicacionesDiferentesValidator]
  });
  get detalles() {
    return this.movimientoForm.get('detalles') as FormArray;
  }
  addProducto(idProducto: any = null, cantidad: number = 1) {
    console.log('➕ Agregando producto:', { idProducto, cantidad });

    const detalleForm = this.fb.group({
      idProducto: [idProducto, Validators.required],
      cantidad: [cantidad, [Validators.required, Validators.min(1)]]
    });

    this.detalles.push(detalleForm);

    console.log('📦 FormArray después de agregar:', {
      length: this.detalles.length,
      valid: this.detalles.valid,
      value: this.detalles.value
    });
  }
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
      usuarios: this.usuarioService.listarUsuarios(),
      productos: this.productoService.listarProductos()
    }).subscribe({
      next: ({ ubicaciones, usuarios, productos }) => {
        this.ubicaciones = ubicaciones;
        this.usuarios = usuarios;
        this.isLoading = false;
        this.productos = productos;
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

  removeProducto(index: number) {
    this.detalles.removeAt(index);
  }
  /**
   * Carga los datos del movimiento en modo edición
   */
  private cargarDatosMovimiento(): void {
    console.log('📋 Datos recibidos del backend:', this.data);
    console.log('📋 === CARGANDO DATOS DEL MOVIMIENTO ===');
    console.log('📋 Data completa:', this.data);
    console.log('📋 Detalles en data:', this.data.detalles);
    console.log('📋 Cantidad de detalles:', this.data.detalles?.length || 0);
    this.movimientoForm.patchValue({
      idMovimiento: this.data.idMovimiento,
      fechaMovimiento: this.data.fechaMovimiento ? new Date(this.data.fechaMovimiento) : null,
      tipo: this.data.tipo,
      observaciones: this.data.observaciones || '',
      idUbicacionOrigen: this.data.idUbicacionOrigen,
      idUbicacionDestino: this.data.idUbicacionDestino,
      idUsuario: this.data.fkUsuario?.idUsuario
    });

    // ✅ Cargar los detalles si existen
    if (this.data.detalles && this.data.detalles.length > 0) {
      console.log('📦 Cargando detalles:', this.data.detalles);

      // Limpiar el FormArray primero
      this.detalles.clear();

      // Agregar cada detalle al FormArray
      this.data.detalles.forEach((detalle: any) => {
        console.log('📦 Agregando detalle:', detalle);

        const idProducto = detalle.fkProducto?.idProducto || detalle.idProducto;
        const cantidad = detalle.cantidad;

        this.addProducto(idProducto, cantidad);
      });

      console.log('📦 Detalles cargados. Total:', this.detalles.length);
    } else {
      console.log('⚠️ No hay detalles para cargar');
    }

    console.log('🔧 Formulario después del patch:', this.movimientoForm.value);
    console.log('🔧 Detalles en el FormArray:', this.detalles.value);
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

  save(): void {
    console.log('🔍 === INICIO DEL PROCESO DE GUARDADO ===');

    if (this.movimientoForm.invalid) {
      console.log('⚠️ Formulario inválido');
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
        return;
      }

      if (this.detalles.length === 0) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'warning',
          title: 'Debes agregar al menos un producto al movimiento',
          showConfirmButton: false,
          timer: 3000
        });
        return;
      }

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Por favor completa todos los campos requeridos',
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    this.isLoading = true;
    const formValue = this.movimientoForm.getRawValue();

    console.log('📋 Valores del formulario:', formValue);
    console.log('📦 Detalles en formulario:', formValue.detalles);

    // ✅ Mapear detalles al formato que espera el backend
    const detallesMapeados: MovimientoDetalleRequestDto[] = formValue.detalles.map((d: any) => ({
      idProducto: Number(d.idProducto),
      cantidad: Number(d.cantidad)
    }));

    console.log('📦 Detalles mapeados:', detallesMapeados);

    // ✅ Construir el request exactamente como lo espera el backend
    const movimientoRequest: MovimientoRequestDto = {
      fechaMovimiento: formValue.fechaMovimiento,
      tipo: formValue.tipo.trim(),
      observaciones: formValue.observaciones?.trim() || '',
      idUbicacionOrigen: Number(formValue.idUbicacionOrigen),
      idUbicacionDestino: Number(formValue.idUbicacionDestino),
      idUsuario: Number(formValue.idUsuario),
      detalles: detallesMapeados
    };

    // Solo agregar idMovimiento si existe (modo edición)
    if (formValue.idMovimiento && formValue.idMovimiento > 0) {
      movimientoRequest.idMovimiento = Number(formValue.idMovimiento);
    }

    console.log('📤 Request COMPLETO a enviar:', JSON.stringify(movimientoRequest, null, 2));

    const isEditing = !!(formValue.idMovimiento && formValue.idMovimiento > 0);
    console.log('🔄 Tipo de operación:', isEditing ? 'ACTUALIZAR' : 'CREAR');

    const request$ = isEditing
      ? this.movimientoService.actualizar(formValue.idMovimiento, movimientoRequest)
      : this.movimientoService.guardar(movimientoRequest);

    console.log('🚀 Enviando request al backend...');

    request$.subscribe({
      next: (response) => {
        console.log('✅ ========== RESPUESTA EXITOSA ==========');
        console.log('✅ Movimiento guardado:', response);
        console.log('✅ ========================================');

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
        console.error('❌ ========== ERROR AL GUARDAR ==========');
        console.error('❌ Error completo:', err);
        console.error('❌ Status:', err.status);
        console.error('❌ Error body:', err.error);
        console.error('❌ =======================================');

        setTimeout(() => {
          this.isLoading = false;
        });

        let errorMessage = 'Hubo un problema al guardar el movimiento';

        if (err.status === 400) {
          errorMessage = err.error?.message || 'Datos inválidos. Verifica el formulario';
        } else if (err.status === 404) {
          errorMessage = 'Recurso no encontrado';
        } else if (err.status === 500) {
          errorMessage = err.error?.message || 'Error en el servidor. Por favor intenta nuevamente';
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
