import { Component, EventEmitter, Input, Output, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { VentaService } from 'src/app/@theme/services/venta.service';
import { ClienteService } from 'src/app/@theme/services/cliente.service';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { VentaResponse } from 'src/app/demo/models/venta.model';

@Component({
  selector: 'app-ventaform',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './ventaform.html',
  styleUrls: ['./ventaform.scss'],
})
export class VentaformComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ventaService = inject(VentaService);
  private clienteService = inject(ClienteService);
  private alertService = inject(AlertService);

  @Input() ventaSeleccionada?: VentaResponse;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<boolean>();

  cargando = false;
  clientes: any[] = [];
  
  ventaForm: FormGroup = this.fb.group({
    idVenta: [null],
    observaciones: ['', [Validators.required, Validators.maxLength(255)]],
    idCliente: [null, Validators.required]
  });

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
  this.clienteService.listarClientes().subscribe({
    next: (res) => {
      // Filtrado inteligente:
      if (this.ventaSeleccionada) {
        // En edición: Traer activos O el cliente que ya está asignado a la venta
        this.clientes = res.filter(c => 
          c.esActivo || c.idCliente === this.ventaSeleccionada?.fkCliente?.idCliente
        );
      } else {
        // En nueva venta: Solo clientes activos
        this.clientes = res.filter(c => c.esActivo);
      }

      // Llenar el formulario después de filtrar
      if (this.ventaSeleccionada) {
        this.ventaForm.patchValue({
          idVenta: this.ventaSeleccionada.idVenta,
          observaciones: this.ventaSeleccionada.observaciones,
          idCliente: this.ventaSeleccionada.fkCliente?.idCliente
        });
      }
    },
    error: () => this.alertService.error('Error', 'No se cargaron los clientes')
  });
}

  async guardar() {
    if (this.ventaForm.invalid) {
      this.ventaForm.markAllAsTouched();
      return;
    }

    const esEdicion = !!this.ventaSeleccionada; 
    const confirmado = await this.alertService.confirm(
      esEdicion ? '¿Actualizar Venta?' : '¿Generar Factura?',
      '¿Estás seguro de continuar?'
    );

    if (!confirmado) return;

    this.cargando = true;
    const loadingId = this.alertService.loading('Procesando...', 'Guardando datos');

    const payload = {
      idVenta: this.ventaForm.value.idVenta,
      observaciones: this.ventaForm.value.observaciones,
      total: this.ventaSeleccionada?.total || 0,
      fkCliente: { idCliente: this.ventaForm.value.idCliente }
    };

    const userSession = JSON.parse(localStorage.getItem('usuario') || '{}');

    const request = esEdicion 
      ? this.ventaService.actualizarVenta(payload.idVenta, payload)
      : this.ventaService.guardarVenta(payload, userSession.idUsuario);

    request.subscribe({
      next: (res) => {
        this.alertService.close(loadingId);
        this.alertService.toast('success', 'Guardado correctamente');
        this.saved.emit(true); 
      },
      error: (err) => {
        this.cargando = false;
        this.alertService.close(loadingId);
        this.alertService.error('Error', 'No se pudo guardar');
      }
    });
  }

  @HostListener('document:keydown.escape') onEsc() { this.onClose(); }
  onClose() { this.closed.emit(); }
  onBackdropClick(e: MouseEvent) { if (e.target === e.currentTarget) this.onClose(); }
}