import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ReportesService } from 'src/app/@theme/services/reportes.service';
import { UsuarioService } from 'src/app/@theme/services/user.service';
import { ComisionUsuarioDto } from 'src/app/demo/models/reportes-inventario.model';
import { Usuario } from 'src/app/demo/models/user.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { AlertService } from 'src/app/@theme/services/alert.service';

@Component({
  selector: 'app-comisiones-usuarios.component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatIconModule,
    MatSelectModule,

    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
  ],
  templateUrl: './comisiones-usuarios.component.html',
  styleUrl: './comisiones-usuarios.component.scss',
})
export default class ComisionesUsuariosComponent implements AfterViewInit {
  private readonly reportesService = inject(ReportesService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly alert = inject(AlertService);

  // ---- Select usuarios ----
  usuarios: Usuario[] = [];
  idUsuarioSeleccionado: number | null = null; // null = Todos

  // ---- Fechas (solo día) ----
  hoy: Date = this.startOfDay(new Date());

  // defaults: hoy y hoy (puedes poner desde = startOfDay(hoy) y hasta = hoy)
  desdeFecha: Date = this.startOfDay(new Date());
  hastaFecha: Date = this.startOfDay(new Date());

  // ---- Tabla ----
  displayedColumns: string[] = ['idUsuario', 'nombreUsuario', 'totalVendido', 'totalComision'];
  dataSource = new MatTableDataSource<ComisionUsuarioDto>([]);

  cargandoUsuarios = false;
  cargando = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // filtro local sobre resultados
    this.dataSource.filterPredicate = (row, filter) => {
      const f = filter.trim().toLowerCase();
      const haystack = [
        row.idUsuario,
        row.nombreUsuario,
        row.nombres,
        row.totalVendido,
        row.totalComision,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(f);
    };

    this.cargarUsuarios();
  }

  // ----------------- Usuarios -----------------
  cargarUsuarios(): void {
    this.cargandoUsuarios = true;
    this.usuarioService.listar().subscribe({
      next: (rows) => {
        this.usuarios = (rows ?? []).filter((u) => u.esActivo !== false);
        this.cargandoUsuarios = false;
      },
      error: () => {
        this.cargandoUsuarios = false;
        console.error('No se pudieron cargar usuarios');
      },
    });
  }

  // ----------------- Buscar -----------------
  buscar(): void {
    // (opcional) clamp para corregir valores escritos a mano
    this.clampFechas();

    const v = this.validarFechas();
    if (!v.ok) {
      this.alert.warning('Fechas inválidas', v.msg);
      return;
    }

    this.cargando = true;
    this.dataSource.data = [];

    const desde = this.toLocalDateTimeIso(this.startOfDay(this.desdeFecha)); // 00:00:00
    const hasta = this.toLocalDateTimeIso(this.endOfDay(this.hastaFecha));   // 23:59:59

    const id = this.idUsuarioSeleccionado;

    if (id == null) {
      this.reportesService.comisionesUsuarios(desde, hasta).subscribe({
        next: (rows) => {
          this.setData(rows ?? []);
          this.cargando = false;
        },
        error: (err) => {
          this.cargando = false;
          this.alert.error('Error', this.alert.getErrorMessage(err));
        }
      });
    } else {
      this.reportesService.comisionUsuario(id, desde, hasta).subscribe({
        next: (dto) => {
          this.setData(dto ? [dto] : []);
          this.cargando = false;
        },
        error: (err) => {
          this.cargando = false;
          this.alert.error('Error', this.alert.getErrorMessage(err));
        }
      });
    }
  }

  private setData(rows: ComisionUsuarioDto[]): void {
    const data = rows ?? [];

    // Si no hay data: aviso + deja tabla vacía
    if (data.length === 0) {
      this.dataSource.data = [];
      this.dataSource.paginator?.firstPage();
      this.alert.toast('info', 'No hay información para el rango de fechas seleccionado.', 2500);
      return;
    }

    data.sort((a, b) => (b.totalComision ?? 0) - (a.totalComision ?? 0));
    this.dataSource.data = data;
    this.dataSource.paginator?.firstPage();
  }

  // ----------------- Filtro local tabla -----------------
  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.dataSource.filter = value.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  // ----------------- Validaciones -----------------
  fechasValidas(): boolean {
    if (!this.desdeFecha || !this.hastaFecha) return false;

    const desdeMs = this.startOfDay(this.desdeFecha).getTime();
    const hastaMs = this.endOfDay(this.hastaFecha).getTime();
    const hoyMs = this.endOfDay(this.hoy).getTime();

    return (
      !isNaN(desdeMs) &&
      !isNaN(hastaMs) &&
      desdeMs <= hastaMs &&   // ✅ desde nunca > hasta
      hastaMs <= hoyMs        // ✅ hasta no futura
    );
  }

  private clampFechas(): void {
    const hoyStart = this.startOfDay(this.hoy).getTime();

    // No permitir futuros (si escriben a mano)
    if (this.hastaFecha && this.startOfDay(this.hastaFecha).getTime() > hoyStart) {
      this.hastaFecha = new Date(this.hoy);
    }
    if (this.desdeFecha && this.startOfDay(this.desdeFecha).getTime() > hoyStart) {
      this.desdeFecha = new Date(this.hoy);
    }

    // IMPORTANTE: ya NO autocorregimos desde > hasta
    // Eso se maneja con validarFechas() + alert
  }

  // ----------------- Helpers fecha -> ISO LocalDateTime -----------------
  private startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private endOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(23, 59, 59, 0);
    return x;
  }

  // "YYYY-MM-DDTHH:mm:ss" sin Z (para Spring LocalDateTime)
  private toLocalDateTimeIso(v: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = v.getFullYear();
    const mm = pad(v.getMonth() + 1);
    const dd = pad(v.getDate());
    const hh = pad(v.getHours());
    const mi = pad(v.getMinutes());
    const ss = pad(v.getSeconds());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
  }

  private validarFechas(): { ok: true } | { ok: false; msg: string } {
    if (!this.desdeFecha || !this.hastaFecha) {
      return { ok: false, msg: 'Debes seleccionar las fechas "Desde" y "Hasta".' };
    }

    const desdeMs = this.startOfDay(this.desdeFecha).getTime();
    const hastaMs = this.endOfDay(this.hastaFecha).getTime();
    const hoyMs = this.endOfDay(this.hoy).getTime();

    if (isNaN(desdeMs) || isNaN(hastaMs)) {
      return { ok: false, msg: 'Las fechas seleccionadas no son válidas.' };
    }

    if (hastaMs > hoyMs) {
      return { ok: false, msg: 'La fecha "Hasta" no puede ser futura.' };
    }

    if (desdeMs > hastaMs) {
      return { ok: false, msg: 'La fecha "Desde" no puede ser mayor que la fecha "Hasta".' };
    }

    return { ok: true };
  }

  private lastWarnKey = '';

  onFechasChange(): void {
    // corrige futuros y corrige si desde > hasta (tu clamp ya lo hace)
    this.clampFechas();

    const v = this.validarFechas();
    if (v.ok) {
      this.lastWarnKey = '';
      return;
    }

    // Evita que salga el mismo aviso repetido cada click
    if (this.lastWarnKey !== v.msg) {
      this.lastWarnKey = v.msg;
      this.alert.toast('warning', v.msg, 2500); // o this.alert.warning('Fechas inválidas', v.msg)
    }
  }

}
