import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

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
    ClienteFormModalComponent,
  ],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.scss',
})
export default class ClienteComponent {
  private readonly clienteService = inject(ClienteService);
  private readonly alert = inject(AlertService);

  displayedColumns: string[] = [
    'idCliente',
    'nombres',
    'apellidos',
    'documento',
    'telefono',
    'email',
    'direccion',
    'acciones'
  ];

  dataSource = new MatTableDataSource<Cliente>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  modalOpen = false;
  clienteSeleccionado?: Cliente;
  isEditing = false;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = (row: Cliente, filter: string) => {
      const f = filter.trim().toLowerCase();
      const fullName = `${row.primerNombre ?? ''} ${row.segundoNombre ?? ''} ${row.primerApellido ?? ''} ${row.segundoApellido ?? ''}`.toLowerCase();

      return (
        fullName.includes(f) ||
        (row.documento ?? '').toLowerCase().includes(f) ||
        (row.telefono ?? '').toLowerCase().includes(f) ||
        (row.email ?? '').toLowerCase().includes(f) ||
        (row.direccion ?? '').toLowerCase().includes(f)
      );
    };

    this.cargar();
  }

  cargar(): void {
    this.alert.loading('Cargando clientes...', 'Consultando lista de clientes.');

    this.clienteService.listarClientes().subscribe({
      next: (data) => {
        this.dataSource.data = data ?? [];
        this.alert.close();
      },
      error: (err) => {
        console.error(err);
        this.dataSource.data = [];
        this.alert.close();
        this.alert.error('Error', this.alert.getErrorMessage(err, 'No se pudo cargar la lista de clientes.'));
      },
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.dataSource.filter = value.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  abrirFormulario(row?: Cliente): void {
    this.clienteSeleccionado = row;
    this.modalOpen = true;
  }

  editar(row: Cliente): void {
    this.abrirFormulario(row);
  }

  cerrarModal(): void {
    this.modalOpen = false;
    this.clienteSeleccionado = undefined;
  }

  async onSaved(ok: boolean): Promise<void> {
    if (!ok) return;

    this.cerrarModal();
    await this.alert.success('Confirmado', 'Guardado correctamente.');
    this.cargar();
  }

  async eliminar(row: Cliente): Promise<void> {
    const id = row?.idCliente;
    if (!id) return;

    const fullName = `${row.primerNombre} ${row.segundoNombre} ${row.primerApellido} ${row.segundoApellido}`.trim();

    const confirmado = await this.alert.confirm(
      'Confirmar eliminación',
      `¿Eliminar el cliente "${fullName}"?`,
      'Sí, eliminar',
      'Cancelar'
    );
    if (!confirmado) return;

    this.alert.loading('Eliminando...', 'Procesando la eliminación del cliente.');

    this.clienteService.eliminarCliente(id).subscribe({
      next: async () => {
        this.alert.close();
        await this.alert.success('Eliminado', 'El cliente fue eliminado correctamente.');
        this.cargar();
      },
      error: async (err) => {
        console.error(err);
        this.alert.close();
        await this.alert.error('Error al eliminar', this.alert.getErrorMessage(err, 'No se pudo eliminar el cliente.'));
      },
    });
  }
}
