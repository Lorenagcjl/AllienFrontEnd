import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { ReportesService } from 'src/app/@theme/services/reportes.service';
import { ComisionUsuarioDto } from 'src/app/demo/models/reportes-inventario.model';

@Component({
  selector: 'app-comisiones-mi-usuario.component',
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

    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
  ],
  templateUrl: './comisiones-mi-usuario.component.html',
  styleUrl: './comisiones-mi-usuario.component.scss',
})
export default class ComisionesMiUsuarioComponent implements AfterViewInit {
  private readonly reportesService = inject(ReportesService);
  private readonly alert = inject(AlertService);

  // id del usuario logueado
  private readonly idUsuarioLogin: number | null = this.getIdUsuarioLogin();

  // ---- Fechas (solo día) ----
  hoy: Date = this.startOfDay(new Date());
  desdeFecha: Date = this.startOfDay(new Date());
  hastaFecha: Date = this.startOfDay(new Date());

  // ---- Tabla ----
  displayedColumns: string[] = ['idUsuario', 'nombreUsuario', 'totalVendido', 'totalComision'];
  dataSource = new MatTableDataSource<ComisionUsuarioDto>([]);

  cargando = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = (row, filter) => {
      const f = filter.trim().toLowerCase();
      return [
        row.idUsuario,
        row.nombreUsuario,
        row.nombres,
        row.totalVendido,
        row.totalComision,
      ]
        .join(' ')
        .toLowerCase()
        .includes(f);
    };

    // opcional: si quieres que cargue apenas entra (hoy)
    // this.buscar();
  }

  buscar(): void {
    if (!this.idUsuarioLogin) {
      this.alert.error('Sesión no válida', 'No se encontró el id del usuario logueado. Inicia sesión de nuevo.');
      return;
    }

    this.clampFechas();

    const v = this.validarFechas();
    if (!v.ok) {
      this.alert.warning('Fechas inválidas', v.msg);
      return;
    }

    this.cargando = true;
    this.dataSource.data = [];

    const desde = this.toLocalDateTimeIso(this.startOfDay(this.desdeFecha));
    const hasta = this.toLocalDateTimeIso(this.endOfDay(this.hastaFecha));

    this.reportesService.comisionUsuario(this.idUsuarioLogin, desde, hasta).subscribe({
      next: (dto) => {
        // tu endpoint devuelve 1 dto => lo metemos en array
        this.setData(dto ? [dto] : []);
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.alert.error('Error', this.alert.getErrorMessage(err));
      },
    });
  }

  private setData(rows: ComisionUsuarioDto[]): void {
    const data = rows ?? [];

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

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.dataSource.filter = value.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  // ---- Validaciones ----
  fechasValidas(): boolean {
    const v = this.validarFechas();
    return v.ok;
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

  private clampFechas(): void {
    const hoyStart = this.startOfDay(this.hoy).getTime();

    if (this.hastaFecha && this.startOfDay(this.hastaFecha).getTime() > hoyStart) {
      this.hastaFecha = new Date(this.hoy);
    }
    if (this.desdeFecha && this.startOfDay(this.desdeFecha).getTime() > hoyStart) {
      this.desdeFecha = new Date(this.hoy);
    }
  }

  private lastWarnKey = '';
  onFechasChange(): void {
    this.clampFechas();

    const v = this.validarFechas();
    if (v.ok) {
      this.lastWarnKey = '';
      return;
    }

    if (this.lastWarnKey !== v.msg) {
      this.lastWarnKey = v.msg;
      this.alert.toast('warning', v.msg, 2500);
    }
  }

  // ---- Helpers ----
  private getIdUsuarioLogin(): number | null {
    const raw = localStorage.getItem('idUsuario');
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

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
}
