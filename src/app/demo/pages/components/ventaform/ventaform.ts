import { Component, EventEmitter, Input, Output, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { VentaService } from 'src/app/@theme/services/venta.service';
import { ClienteService } from 'src/app/@theme/services/cliente.service';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { VentaResponse } from 'src/app/demo/models/venta.model';

@Component({
  selector: 'app-ventaform',
  standalone: true,
  imports: [
    CommonModule, 
    SharedModule,
    ReactiveFormsModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule
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
    if (this.ventaSeleccionada) {
      this.ventaForm.patchValue(this.ventaSeleccionada);
    }
  }

  cargarClientes() {
    this.clienteService.listarClientes().subscribe({
      next: (res) => this.clientes = res,
      error: (err) => this.alertService.error('Error', 'No se pudo cargar la lista de clientes')
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

  async guardar() {
    if (this.ventaForm.invalid) {
      this.ventaForm.markAllAsTouched();
      await this.alertService.warning('Atención', 'Por favor completa los campos requeridos.');
      return;
    }

    const confirmado = await this.alertService.confirm(
      '¿Generar factura?',
      '¿Estás seguro de iniciar este proceso de venta?'
    );

    if (!confirmado) return;

    const userSession = localStorage.getItem('usuario');
    if (!userSession) {
      this.alertService.error('Error de sesión', 'No se encontró el usuario actual.');
      return;
    }
    
    const usuario = JSON.parse(userSession);
    this.cargando = true;
    const loadingId = this.alertService.loading('Guardando...', 'Generando factura');

    const payload = {
      total: 0,
      observaciones: this.ventaForm.value.observaciones,
      fkCliente: { idCliente: this.ventaForm.value.idCliente }
    };

    this.ventaService.guardarVenta(payload, usuario.idUsuario).subscribe({
      next: (res) => {
        this.alertService.close(loadingId);
        this.alertService.toast('success', `Factura ${res.numeroFactura} generada`);
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