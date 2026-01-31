import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AlertService } from 'src/app/@theme/services/alert.service';
import { ClienteService } from 'src/app/@theme/services/cliente.service';
import { Cliente } from 'src/app/demo/models/cliente.model';

@Component({
  selector: 'app-cliente-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cliente-form-modal.component.html',
  styleUrls: ['./cliente-form-modal.component.scss'],
})
export class ClienteFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clienteService = inject(ClienteService);
  private readonly alert = inject(AlertService);

  @Input() cliente?: Cliente;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<boolean>();

  get editando(): boolean {
    return !!this.cliente?.idCliente && this.cliente.idCliente > 0;
  }

  form = this.fb.group({
    primerNombre: ['', [Validators.required]],
    segundoNombre: ['', [Validators.required]],
    primerApellido: ['', [Validators.required]],
    segundoApellido: ['', [Validators.required]],
    documento: ['', [Validators.required]],
    telefono: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    direccion: ['', [Validators.required]],
  });

  ngOnInit(): void {
    if (this.cliente) {
      this.form.patchValue({
        primerNombre: this.cliente.primerNombre ?? '',
        segundoNombre: this.cliente.segundoNombre ?? '',
        primerApellido: this.cliente.primerApellido ?? '',
        segundoApellido: this.cliente.segundoApellido ?? '',
        documento: this.cliente.documento ?? '',
        telefono: this.cliente.telefono ?? '',
        email: this.cliente.email ?? '',
        direccion: this.cliente.direccion ?? '',
      });
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

  onBackdropKeydown(event: KeyboardEvent): void {
    event.preventDefault();
    this.onClose();
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.alert.warning('Formulario incompleto', 'Revisa los campos marcados antes de guardar.');
      return;
    }

    const confirmado = await this.alert.confirm(
      'Confirmar',
      this.editando ? '¿Guardar cambios del cliente?' : '¿Crear el cliente?',
      'Sí, guardar',
      'Cancelar'
    );
    if (!confirmado) return;

    const v = this.form.getRawValue();

    const payload = {
      primerNombre: v.primerNombre ?? '',
      segundoNombre: v.segundoNombre ?? '',
      primerApellido: v.primerApellido ?? '',
      segundoApellido: v.segundoApellido ?? '',
      documento: v.documento ?? '',
      telefono: v.telefono ?? '',
      email: v.email ?? '',
      direccion: v.direccion ?? '',
    };

    this.alert.loading('Guardando...', this.editando ? 'Actualizando cliente.' : 'Creando cliente.');

    if (this.editando) {
      const id = this.cliente?.idCliente;
      if (!id) {
        this.alert.close();
        await this.alert.error('Error', 'No se encontró el ID del cliente para actualizar.');
        return;
      }

      this.clienteService.actualizarCliente(id, payload).subscribe({
        next: () => {
          this.alert.close();
          this.saved.emit(true);
        },
        error: async (err) => {
          console.error(err);
          this.alert.close();
          await this.alert.error('Error al actualizar', this.alert.getErrorMessage(err, 'No se pudo actualizar el cliente.'));
        },
      });

      return;
    }

    this.clienteService.crearCliente(payload).subscribe({
      next: () => {
        this.alert.close();
        this.saved.emit(true);
      },
      error: async (err) => {
        console.error(err);
        this.alert.close();
        await this.alert.error('Error al crear', this.alert.getErrorMessage(err, 'No se pudo crear el cliente.'));
      },
    });
  }
}
