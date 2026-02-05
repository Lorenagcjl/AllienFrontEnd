import { Component, EventEmitter, Input, Output, inject, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { MovimientoService } from 'src/app/@theme/services/movimiento.service';
import { UbicacionService } from 'src/app/@theme/services/ubicacion.service';
import { Movimiento, MovimientoRequest } from 'src/app/demo/models/movimiento.model';

@Component({
  selector: 'app-movimiento-form',
  standalone: true,
  imports: [CommonModule, SharedModule, ReactiveFormsModule, MatSelectModule, MatOptionModule],
  templateUrl: './movimiento-form.component.html',
  styleUrls: ['./movimiento-form.component.scss'] // Asegúrate de tener los mismos estilos que user-form
})
export class MovimientoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private movimientoService = inject(MovimientoService);
  private ubicacionService = inject(UbicacionService);
  private alertService = inject(AlertService);

  @Input() movimientoSeleccionado?: Movimiento;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<boolean>();

  cargando = false;
  ubicaciones: any[] = [];
  tiposMovimiento = ['TRASLADO', 'COMPRA', 'VENTA', 'AJUSTE'];

  form: FormGroup = this.fb.group({
    idMovimiento: [null],
    fechaMovimiento: [new Date().toISOString().slice(0, 16), Validators.required],
    tipo: ['', Validators.required],
    observaciones: ['', Validators.required],
    idUbicacionOrigen: [null, Validators.required],
    idUbicacionDestino: [null, Validators.required]
  });

  ngOnInit(): void {
    this.cargarUbicaciones();
    if (this.movimientoSeleccionado) {
      // Ajustamos la fecha para que el input datetime-local la entienda
      const fechaFormateada = this.movimientoSeleccionado.fechaMovimiento?.toString().slice(0, 16);
      this.form.patchValue({
        ...this.movimientoSeleccionado,
        fechaMovimiento: fechaFormateada
      });
    }
  }

  cargarUbicaciones() {
  this.ubicacionService.listarUbicaciones().subscribe(res => {
    this.ubicaciones = (res ?? []).filter((u: any) => u.esActivo !== false);
  });
}

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.onClose();
  }

  onClose(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

 async save() {
  // ... validaciones iniciales de formulario y ubicaciones ...

  // 1. Obtener la sesión del usuario del localStorage
  const userSession = localStorage.getItem('usuario');
  if (!userSession) {
    await this.alertService.error('Error de sesión', 'No se pudo identificar al usuario actual. Por favor, reingrese al sistema.');
    return;
  }
  
  // 2. Parsear el usuario para obtener su ID real
  const usuarioActual = JSON.parse(userSession);
  const idUsuarioReal = usuarioActual.idUsuario; // Asegúrate que el campo se llame idUsuario en tu objeto local

  this.cargando = true;
  const loadingId = this.alertService.loading('Guardando...', 'Procesando movimiento');

  // 3. Usar el ID dinámico en el payload
  const payload: MovimientoRequest = {
    tipo: this.form.value.tipo,
    observaciones: this.form.value.observaciones,
    idUsuario: idUsuarioReal, // <--- ¡ID dinámico capturado de la sesión!
    idUbicacionOrigen: this.form.value.idUbicacionOrigen,
    idUbicacionDestino: this.form.value.idUbicacionDestino
  };

  const request = this.movimientoSeleccionado?.idMovimiento 
    ? this.movimientoService.actualizar(this.movimientoSeleccionado.idMovimiento, payload)
    : this.movimientoService.crear(payload);

  request.subscribe({
    next: () => {
      this.alertService.close(loadingId);
      this.alertService.toast('success', 'Movimiento registrado correctamente');
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