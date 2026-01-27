import { AfterViewInit, Component, ViewChild, OnInit, inject } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { ClienteService } from 'src/app/@theme/services/cliente.service';
import { Cliente } from 'src/app/demo/models/cliente.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ClienteFormComponent } from '../cliform/cliente-form.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cliente',
  imports: [
    SharedModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatDialogModule
  ],
  templateUrl: './color.component.html',
  styleUrls: ['./color.component.scss']
})
export default class ClienteComponent implements OnInit, AfterViewInit {
  private dialog = inject(MatDialog);

  // Columnas que coinciden con la entidad Cliente
  displayedColumns: string[] = [
    'idCliente',
    'primerNombre',
    'segundoNombre',
    'primerApellido',
    'segundoApellido',
    'documento',
    'telefono',
    'email',
    'direccion',
    'acciones'
  ];

  dataSource = new MatTableDataSource<Cliente>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private clienteService = inject(ClienteService);

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
    this.clienteService.listarClientes().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: (err) => console.error('Error al cargar clientes', err)
    });
  }

  abrirFormulario(cliente?: Cliente) {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      width: '600px',
      disableClose: true,
      data: cliente || null
    });

    dialogRef.afterClosed().subscribe(result => {
  if (result) {
    const observable = result.idCliente
      ? this.clienteService.actualizar(result.idCliente, result)
      : this.clienteService.guardar(result);

    observable.subscribe({
      next: () => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Cliente ${result.idCliente ? 'actualizado' : 'guardado'}`,
          showConfirmButton: false,
          timer: 2000
        });
        this.cargarClientes();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar el cliente: ' + (err.error?.message || err.message)
        });
      }
    });
  }
});

  }

  eliminar(cliente: Cliente) {
    if (!cliente?.idCliente) {
      console.error('ID de cliente inválido', cliente);
      return;
    }

    Swal.fire({
      title: '¿Eliminar cliente?',
      text: `Se eliminará "${cliente.primerNombre} ${cliente.primerApellido}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clienteService.eliminar(cliente.idCliente!).subscribe(() => {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Cliente eliminado',
            showConfirmButton: false,
            timer: 3000
          });

          this.cargarClientes();
        });

      }
    });
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
