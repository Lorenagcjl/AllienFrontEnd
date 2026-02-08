import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { AlertService } from 'src/app/@theme/services/alert.service';
import { ClienteService } from 'src/app/@theme/services/cliente.service';
import { Cliente } from 'src/app/demo/models/cliente.model';

@Component({
  selector: 'app-cliente-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './cliente-form-modal.component.html',
  styleUrls: ['./cliente-form-modal.component.scss'],
})
export class ClienteFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clienteService = inject(ClienteService);
  private readonly alertService = inject(AlertService);

  private readonly solamenteLetras = '^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]*$';

  @Input() cliente?: Cliente;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<boolean>();

  cargando = false;

  form: FormGroup = this.fb.group({
    idCliente: [null],
    primerNombre: ['', [Validators.required, Validators.pattern(this.solamenteLetras)]],
    segundoNombre: ['', [Validators.required, Validators.pattern(this.solamenteLetras)]],
    primerApellido: ['', [Validators.required, Validators.pattern(this.solamenteLetras)]],
    segundoApellido: ['', [Validators.required, Validators.pattern(this.solamenteLetras)]],
    documento: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    email: ['', [Validators.required, Validators.email]],
    direccion: ['', [Validators.required]],
  });

  validarEntrada(event: KeyboardEvent, tipo: 'letras' | 'numeros'): void {
    const regex = tipo === 'letras' ? /[a-zA-ZáéíóúÁÉÍÓÚñÑ ]/ : /[0-9]/;
    const key = event.key;

    // Si la tecla presionada no coincide con el regex, cancelamos el evento
    if (key.length === 1 && !regex.test(key)) {
      event.preventDefault();
    }
  }

  get editando(): boolean {
    return !!this.cliente?.idCliente;
  }

  ngOnInit(): void {
    if (this.cliente) {
      this.form.patchValue(this.cliente);
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
    if (event.target === event.currentTarget) this.onClose();
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.alertService.warning('Atención', 'Por favor completa los campos requeridos correctamente.');
      return;
    }

    const confirmado = await this.alertService.confirm(
      this.editando ? '¿Actualizar cliente?' : '¿Guardar nuevo cliente?',
      '¿Estás seguro de realizar esta acción?'
    );
    if (!confirmado) return;

    this.cargando = true;
    const loadingId = this.alertService.loading('Guardando...', 'Procesando datos del cliente');

    const datos = this.form.getRawValue();
    const request = this.editando
      ? this.clienteService.actualizarCliente(datos.idCliente, datos)
      : this.clienteService.crearCliente(datos);

    request.subscribe({
      next: () => {
        this.alertService.close(loadingId);
        this.alertService.toast('success', 'Guardado exitosamente');
        this.saved.emit(true);
      },
      error: (err: Error) => {
        this.cargando = false;
        this.alertService.close(loadingId);
        this.alertService.error('Error', err.message);
      }
    });
  }
}
