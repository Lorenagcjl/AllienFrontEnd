import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { VentaService } from 'src/app/@theme/services/venta.service';
import Swal from 'sweetalert2';
import { ClienteService } from 'src/app/@theme/services/cliente.service';

@Component({
  selector: 'app-ventaform',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule,MatSelectModule],
  templateUrl: './ventaform.html',
  styleUrls: ['./ventaform.scss'],
})
export class VentaformComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ventaService = inject(VentaService);
  private clienteService = inject(ClienteService);
  public dialogRef = inject(MatDialogRef<VentaformComponent>);

  clientes: any[] = [];
  ventaForm: FormGroup;

  constructor() {
    this.ventaForm = this.fb.group({
      observaciones: ['', [Validators.required, Validators.maxLength(255)]],
      idCliente: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
    this.clienteService.listarClientes().subscribe({
      next: (res) => this.clientes = res,
      error: (err) => console.error('Error al cargar clientes', err)
    });
  }

  guardar() {
  if (this.ventaForm.invalid) return;

  const userSession = localStorage.getItem('usuario');
  if (!userSession) return;
  
  const usuario = JSON.parse(userSession);
  const idUsuarioLogueado = usuario.idUsuario;

  const payload = {
    total: 0, // Enviamos 0 porque se calculará con los detalles después
    observaciones: this.ventaForm.value.observaciones,
    fkCliente: { idCliente: this.ventaForm.value.idCliente }
  };

  this.ventaService.guardarVenta(payload, idUsuarioLogueado).subscribe({
    next: (res) => {
      Swal.fire({
        icon: 'success',
        title: 'Factura Generada',
        text: `Número: ${res.numeroFactura}. Ahora agrega los productos.`,
        timer: 2500
      });
      this.dialogRef.close(true); 
    },
    error: (err) => Swal.fire('Error', 'No se pudo crear la cabecera', 'error')
  });
}
}