import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movimiento, MovimientoRequest } from 'src/app/demo/models/movimiento.model';

@Injectable({
    providedIn: 'root'
})
export class MovimientoService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/api/movimiento';

    listar(): Observable<Movimiento[]> {
    return this.http.get<Movimiento[]>(this.apiUrl);
  }

  crear(mov: MovimientoRequest): Observable<Movimiento> {
    return this.http.post<Movimiento>(this.apiUrl, mov);
  }
  actualizar(id: number, mov: MovimientoRequest): Observable<Movimiento> {
  return this.http.put<Movimiento>(`${this.apiUrl}/${id}`, mov);
}

  buscarPorId(id: number): Observable<Movimiento> {
    return this.http.get<Movimiento>(`${this.apiUrl}/${id}`);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
