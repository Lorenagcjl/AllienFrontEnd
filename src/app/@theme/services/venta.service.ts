// src/app/demo/pages/components/usuarios/venta.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VentaRequest, VentaResponse } from 'src/app/demo/models/venta.model';

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  private apiUrl = 'http://localhost:8080/api/venta';

  constructor(private http: HttpClient) {}

  listarVentas(): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(this.apiUrl);
  }
  
  guardarVenta(venta: VentaRequest, idUsuario: number): Observable<VentaResponse> {
    // Enviamos el idUsuario como Query Parameter (?idUsuario=X)
    return this.http.post<VentaResponse>(`${this.apiUrl}?idUsuario=${idUsuario}`, venta);
  }
}