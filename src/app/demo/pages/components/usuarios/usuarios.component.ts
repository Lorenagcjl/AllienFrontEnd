import { AfterViewInit, Component, ViewChild, OnInit, inject } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { UsuarioService } from 'src/app/@theme/services/user.service';
import { Usuario } from 'src/app/demo/models/user.model';
import { UserFormComponent } from '../userform/user-form.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { ResetPasswordModalComponent } from '../reset-password-modal.component/reset-password-modal.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    SharedModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressBarModule,
    UserFormComponent,
    ResetPasswordModalComponent
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss'
})
export default class UsuariosComponent implements OnInit, AfterViewInit {
  // private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  modalOpen = false;
  usuarioParaEditar?: Usuario;
  cargando: boolean = false;
  resetModalOpen = false;
  usuarioParaReset?: Usuario;


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
    this.usuarioService.listar().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.cargando = false;
      },
      error: (err: Error) => {
        this.cargando = false;
        this.alertService.error('Error', err.message);
      }
    });
  }

  async cambiarEstado(usuario: Usuario) {
    const accion = usuario.esActivo ? 'desactivar' : 'activar';

    const confirmado = await this.alertService.confirm(
      `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
      `¿Estás seguro de que deseas ${accion} al usuario ${usuario.nombreUsuario}?`,
      `Sí, ${accion}`
    );

    if (!confirmado) return;

    this.cargando = true;
    const loadingId = this.alertService.loading('Procesando...', 'Actualizando estado del usuario');

    this.usuarioService.alternarEstado(usuario.idUsuario).subscribe({
      next: () => {
        this.alertService.close(loadingId);
        this.cargarUsuarios();
        this.alertService.toast('success', `Usuario ${accion === 'activar' ? 'activado' : 'desactivado'}`);
      },
      error: (err: Error) => {
        this.cargando = false;
        this.alertService.close(loadingId);
        this.alertService.error('Error', err.message);
      }
    });
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

  abrirResetPassword(usuario: Usuario) {
    this.usuarioParaReset = usuario;
    this.resetModalOpen = true;
  }

  cerrarResetModal() {
    this.resetModalOpen = false;
    this.usuarioParaReset = undefined;
  }

  onResetSaved(ok: boolean) {
    if (ok) {
      this.cerrarResetModal();
      this.cargarUsuarios(); // ✅
      this.alertService.toast('success', 'Listo: clave temporal asignada y esNuevo activado');
    }
  }

}
