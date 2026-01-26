import { AfterViewInit, Component, ViewChild, OnInit, inject } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { UsuarioService } from 'src/app/@theme/services/user.service';
import { Usuario } from 'src/app/demo/models/user.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserFormComponent } from '../userform/user-form.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AlertService } from 'src/app/@theme/services/alert.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [SharedModule, MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatDialogModule, MatProgressBarModule, UserFormComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss'
})
export default class UsuariosComponent implements OnInit, AfterViewInit {
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  modalOpen = false;
  usuarioParaEditar?: Usuario;
  cargando: boolean = false;
  
  
  displayedColumns: string[] = ['idUsuario', 'nombreCompleto', 'nombreUsuario', 'correoElectronico', 'cedula', 'rol', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Usuario>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private usuarioService = inject(UsuarioService);

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.cargando = true;
    this.usuarioService.listarUsuarios().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.alertService.error('Error', 'No se pudieron cargar los usuarios');
      }
    });
  }

async cambiarEstado(usuario: Usuario) {
    const accion = usuario.esActivo ? 'desactivar' : 'activar';
    
    // Usamos el confirm de tu servicio
    const confirmado = await this.alertService.confirm(
      `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
      `¿Estás seguro de que deseas ${accion} al usuario ${usuario.nombreUsuario}?`,
      `Sí, ${accion}`
    );

    if (confirmado) {
      this.cargando = true;
      // Mostramos un loading overlay opcional (usando tu método loading)
      const loadingId = this.alertService.loading('Procesando...', 'Actualizando estado del usuario');

      this.usuarioService.eliminar(usuario.idUsuario).subscribe({
        next: () => {
          this.alertService.close(loadingId);
          this.cargarUsuarios();
          this.alertService.toast('success', `Usuario ${accion === 'activar' ? 'activado' : 'desactivado'}`);
        },
        error: (err) => {
          this.cargando = false;
          this.alertService.close(loadingId);
          const msg = this.alertService.getErrorMessage(err);
          this.alertService.error('Error', msg);
        }
      });
    }
  }

  abrirFormulario(usuario?: Usuario) {
  this.usuarioParaEditar = usuario;
  this.modalOpen = true;
}

cerrarModal() {
  this.modalOpen = false;
  this.usuarioParaEditar = undefined;
}

onSaved(exito: boolean) {
  if (exito) {
    this.cerrarModal();
    this.cargarUsuarios();
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