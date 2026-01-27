import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ubicacion } from 'src/app/demo/models/ubi.model';

@Injectable({
  providedIn: 'root'
})
export class UbicacionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/ubicacion'; 

  listarUbicacions(): Observable<Ubicacion[]> {
    return this.http.get<Ubicacion[]>(this.apiUrl);
  }
actualizar(id: number, ubicacion: Ubicacion): Observable<any> {
  ubicacion.idUbicacion = id; // ✅ number válido
  return this.http.put(`${this.apiUrl}/${id}`, ubicacion);
}


guardar(ubicacion: Ubicacion): Observable<any> {
  ubicacion.idUbicacion = undefined; // o undefined
  return this.http.post(this.apiUrl, ubicacion);
}

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  buscarPorNombre(nombre: string): Observable<Ubicacion[]> {
    return this.http.get<Ubicacion[]>(`${this.apiUrl}/ubicacion/${nombre}`);
  }
}