import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ComisionUsuarioDto } from 'src/app/demo/models/reportes-inventario.model';

@Injectable({
  providedIn: 'root',
})
export class ReportesService {
  private readonly baseUrl = 'http://localhost:8080/api/reportes';
  private readonly http = inject(HttpClient);

  comisionUsuario(idUsuario: number, desde: string | Date, hasta: string | Date): Observable<ComisionUsuarioDto> {
    const params = this.buildDateRangeParams(desde, hasta);
    return this.http.get<ComisionUsuarioDto>(`${this.baseUrl}/comisiones/usuarios/${idUsuario}`, { params });
  }

  // ✅ Todos (admin):
  // GET /api/reportes/comisiones/usuarios?desde=...&hasta=...
  comisionesUsuarios(desde: string | Date, hasta: string | Date): Observable<ComisionUsuarioDto[]> {
    const params = this.buildDateRangeParams(desde, hasta);
    return this.http.get<ComisionUsuarioDto[]>(`${this.baseUrl}/comisiones/usuarios`, { params });
  }

  // ---------- helpers ----------
  private buildDateRangeParams(desde: string | Date, hasta: string | Date): HttpParams {
    return new HttpParams()
      .set('desde', this.toLocalDateTimeIso(desde))
      .set('hasta', this.toLocalDateTimeIso(hasta));
  }

  /**
   * Spring @DateTimeFormat(ISO.DATE_TIME) con LocalDateTime
   * suele ir bien con: "YYYY-MM-DDTHH:mm:ss" (sin Z).
   */
  private toLocalDateTimeIso(v: string | Date): string {
    if (typeof v === 'string') return v;

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
