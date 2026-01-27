import { Component, EventEmitter, Input, Output, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { ClienteService } from 'src/app/@theme/services/cliente.service';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { Cliente } from 'src/app/demo/models/cliente.model';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    CommonModule, 
    SharedModule,
    ReactiveFormsModule,   
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './cliente-form.component.html',
  styleUrls: ['./cliente-form.component.scss']
})
export class ClienteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);
  private alertService = inject(AlertService);

  @Input() clienteSeleccionado?: Cliente;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<boolean>();

  cargando = false;
  clienteForm: FormGroup = this.fb.group({
    idCliente: [null],
    primerNombre: ['', [Validators.required]],
    segundoNombre: [''],
    primerApellido: ['', [Validators.required]],
    segundoApellido: [''],
    documento: ['', [Validators.required]],
    telefono: [''],
    email: ['', [Validators.required, Validators.email]],
    direccion: ['']
  });

  ngOnInit(): void {
    if (this.clienteSeleccionado) {
      this.clienteForm.patchValue(this.clienteSeleccionado);
    }
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
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      await this.alertService.warning('Atención', 'Por favor completa los campos requeridos correctamente.');
      return;
    }

    const confirmado = await this.alertService.confirm(
      this.clienteSeleccionado ? '¿Actualizar cliente?' : '¿Guardar nuevo cliente?',
      '¿Estás seguro de realizar esta acción?'
    );

    if (!confirmado) return;

    this.cargando = true;
    const loadingId = this.alertService.loading('Guardando...', 'Procesando datos del cliente');

    const datos = this.clienteForm.value;
    const request = datos.idCliente 
      ? this.clienteService.actualizar(datos.idCliente, datos)
      : this.clienteService.guardar(datos);

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