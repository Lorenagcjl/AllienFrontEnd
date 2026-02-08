import { AfterViewInit, Component, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AlertService } from 'src/app/@theme/services/alert.service';
import { ClienteService } from 'src/app/@theme/services/cliente.service';
import { Cliente } from 'src/app/demo/models/cliente.model';
import { ClienteFormModalComponent } from '../cliente-form-modal.component/cliente-form-modal.component';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule,
    ClienteFormModalComponent,
  ],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.scss',
})
export default class ClienteComponent implements OnInit, AfterViewInit {
  private readonly clienteService = inject(ClienteService);
  private readonly alertService = inject(AlertService);

  cargando: boolean = false;
  modalOpen = false;
  clienteSeleccionado?: Cliente;

  displayedColumns: string[] = [
    'idCliente',
    'nombres',
    'apellidos',
    'documento',
    'telefono',
    'estado', // Columna de estado agregada
    'acciones'
  ];

  dataSource = new MatTableDataSource<Cliente>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.cargarClientes();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  cargarClientes(): void {
    this.cargando = true;

    this.clienteService.listarClientes().subscribe({
      next: (data) => {
        this.dataSource.data = (data ?? []).filter((c: Cliente) => c.esActivo !== false);
        this.cargando = false;
      },
      error: (err: Error) => {
        this.cargando = false;
        this.dataSource.data = [];
        this.alertService.error('Error', err.message); // ✅ mensaje limpio del backend
        console.error(err);
      },
    });
  }

  async cambiarEstado(cliente: Cliente) {
    const accion = cliente.esActivo ? 'desactivar' : 'activar';

    const confirmado = await this.alertService.confirm(
      `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} cliente?`,
      `¿Estás seguro de que deseas ${accion} al cliente ${cliente.primerNombre} ${cliente.primerApellido}?`,
      `Sí, ${accion}`
    );

    if (!confirmado) return;

    this.cargando = true;
    const loadingId = this.alertService.loading('Procesando...', 'Actualizando estado del cliente');

    this.clienteService.eliminarCliente(cliente.idCliente!).subscribe({
      next: () => {
        this.alertService.close(loadingId);
        this.cargarClientes();
        this.alertService.toast('success', `Cliente ${accion === 'activar' ? 'activado' : 'desactivado'}`);
      },
      error: (err: Error) => {
        this.cargando = false;
        this.alertService.close(loadingId);
        this.alertService.error('Error', err.message); // ✅ ya no uses getErrorMessage
      }
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  abrirFormulario(row?: Cliente): void {
    this.clienteSeleccionado = row;
    this.modalOpen = true;
  }

  cerrarModal(): void {
    this.modalOpen = false;
    this.clienteSeleccionado = undefined;
  }

  onSaved(exito: boolean): void {
    if (exito) {
      this.cerrarModal();
      this.cargarClientes();
    }
  }
}
