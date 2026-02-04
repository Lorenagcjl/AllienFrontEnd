import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogoRequestDto, CatalogoResponseDto } from 'src/app/demo/models/catalogo.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogoService {
  private readonly apiUrl = 'http://localhost:8080/api/catalogo';
  private readonly http = inject(HttpClient);

  listar(): Observable<CatalogoResponseDto[]> {
    return this.http.get<CatalogoResponseDto[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<CatalogoResponseDto> {
    return this.http.get<CatalogoResponseDto>(`${this.apiUrl}/${id}`);
  }

  crear(dto: CatalogoRequestDto): Observable<CatalogoResponseDto> {
    return this.http.post<CatalogoResponseDto>(this.apiUrl, dto);
  }

  actualizar(id: number, dto: CatalogoRequestDto): Observable<CatalogoResponseDto> {
    return this.http.put<CatalogoResponseDto>(`${this.apiUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
