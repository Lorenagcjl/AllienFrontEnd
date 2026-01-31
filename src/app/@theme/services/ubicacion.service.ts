import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ubicacion } from 'src/app/demo/models/ubicacion.model';

@Injectable({
  providedIn: 'root'
})
export class UbicacionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/ubicacion';

  listarUbicaciones(): Observable<Ubicacion[]> {
    return this.http.get<Ubicacion[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<Ubicacion> {
    return this.http.get<Ubicacion>(`${this.apiUrl}/${id}`);
  }

  crearUbicacion(payload: Partial<Ubicacion>): Observable<Ubicacion> {
    return this.http.post<Ubicacion>(this.apiUrl, payload);
  }

  actualizarUbicacion(id: number, payload: Partial<Ubicacion>): Observable<Ubicacion> {
    return this.http.put<Ubicacion>(`${this.apiUrl}/${id}`, payload);
  }

  eliminarUbicacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
