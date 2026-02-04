import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DetalleCatalogoRequestDto, DetalleCatalogoResponseDto } from 'src/app/demo/models/detalle-catalogo.model';

@Injectable({
  providedIn: 'root',
})
export class DetalleCatalogoService {
  private readonly apiUrl = 'http://localhost:8080/api/detalleCatalogo';
  private readonly http = inject(HttpClient);

  listar(): Observable<DetalleCatalogoResponseDto[]> {
    return this.http.get<DetalleCatalogoResponseDto[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<DetalleCatalogoResponseDto> {
    return this.http.get<DetalleCatalogoResponseDto>(`${this.apiUrl}/${id}`);
  }

  listarPorNombreCatalogo(nombreCatalogo: string): Observable<DetalleCatalogoResponseDto[]> {
    const encoded = encodeURIComponent(nombreCatalogo);
    return this.http.get<DetalleCatalogoResponseDto[]>(`${this.apiUrl}/por-catalogo/${encoded}`);
  }

  crear(dto: DetalleCatalogoRequestDto): Observable<DetalleCatalogoResponseDto> {
    return this.http.post<DetalleCatalogoResponseDto>(this.apiUrl, dto);
  }

  actualizar(id: number, dto: DetalleCatalogoRequestDto): Observable<DetalleCatalogoResponseDto> {
    return this.http.put<DetalleCatalogoResponseDto>(`${this.apiUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
