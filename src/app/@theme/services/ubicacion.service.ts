import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UbicacionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/ubicacion';

  listar(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
  buscarPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}