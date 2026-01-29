import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mds } from 'src/app/demo/models/mds.model';

@Injectable({
  providedIn: 'root'
})
export class mdsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/?';

  listarMds(): Observable<Mds[]> {
    return this.http.get<Mds[]>(this.apiUrl);
  }
  actualizar(id: number, mds: Mds): Observable<any> {
    mds.idMovimientoDetalleSerial = id; 
    return this.http.put(`${this.apiUrl}/${id}`, mds);
  }


  guardar(mds: Mds): Observable<any> {
    mds.idMovimientoDetalleSerial= undefined; 
    return this.http.post(this.apiUrl, mds);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  buscarPorNombre(nombre: string): Observable<Mds[]> {
    return this.http.get<Mds[]>(`${this.apiUrl}/mds/${nombre}`);
  }
}