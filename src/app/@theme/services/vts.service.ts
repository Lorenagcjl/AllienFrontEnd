import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vts } from 'src/app/demo/models/vts.model';

@Injectable({
  providedIn: 'root'
})
export class vtsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/ventaDetalleSerial';

  listarvtss(): Observable<Vts[]> {
    return this.http.get<Vts[]>(this.apiUrl);
  }
  actualizar(id: number, vts: Vts): Observable<any> {
    vts.idVentaDetalleSerial = id; // ✅ number válido
    return this.http.put(`${this.apiUrl}/${id}`, vts);
  }


  guardar(vts: Vts): Observable<any> {
    vts.idVentaDetalleSerial = undefined; // o undefined
    return this.http.post(this.apiUrl, vts);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  buscarPorNombre(nombre: string): Observable<Vts[]> {
    return this.http.get<Vts[]>(`${this.apiUrl}/vts/${nombre}`);
  }
}