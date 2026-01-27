import { AfterViewInit, Component, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { ClienteService } from 'src/app/@theme/services/cliente.service';
import { Cliente } from 'src/app/demo/models/cliente.model';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ClienteFormComponent } from '../cliform/cliente-form.component';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressBarModule,
    ClienteFormComponent // El formulario manual
  ],
  templateUrl: './color.component.html',
  styleUrls: ['./color.component.scss']
})
export default class ClienteComponent implements OnInit, AfterViewInit {
  private clienteService = inject(ClienteService);
  private alertService = inject(AlertService);

  // Propiedades de estado idénticas a Usuarios
  modalOpen = false;
  clienteParaEditar?: Cliente;
  cargando: boolean = false;

  displayedColumns: string[] = [
    'idCliente',
    'nombreCompleto', // Sugerencia: combinar nombres en el HTML
    'documento',
    'telefono',
    'email',
    'acciones'
  ];

  dataSource = new MatTableDataSource<Cliente>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
    this.cargando = true;
    this.clienteService.listarClientes().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.alertService.error('Error', 'No se pudieron cargar los clientes');
      }
    });
  }

  // Abrir formulario manual (igual que Usuarios)
  abrirFormulario(cliente?: Cliente) {
    this.clienteParaEditar = cliente;
    this.modalOpen = true;
  }

  cerrarModal() {
    this.modalOpen = false;
    this.clienteParaEditar = undefined;
  }

  onSaved(exito: boolean) {
    if (exito) {
      this.cerrarModal();
      this.cargarClientes();
    }
  }

  async eliminar(cliente: Cliente) {
    if (!cliente?.idCliente) return;

    const confirmado = await this.alertService.confirm(
      '¿Eliminar cliente?',
      `¿Estás seguro de eliminar a ${cliente.primerNombre} ${cliente.primerApellido}?`,
      'Sí, eliminar'
    );

    if (confirmado) {
      this.cargando = true;
      const loadingId = this.alertService.loading('Eliminando...', 'Procesando solicitud');

      this.clienteService.eliminar(cliente.idCliente).subscribe({
        next: () => {
          this.alertService.close(loadingId);
          this.alertService.toast('success', 'Cliente eliminado correctamente');
          this.cargarClientes();
        },
        error: (err) => {
          this.cargando = false;
          this.alertService.close(loadingId);
          this.alertService.error('Error', this.alertService.getErrorMessage(err));
        }
      });
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}