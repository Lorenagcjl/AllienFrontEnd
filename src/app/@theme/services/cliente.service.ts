import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from 'src/app/demo/models/cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/cliente'; 

  listarClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }
actualizar(id: number, cliente: Cliente): Observable<any> {
  cliente.idCliente = id; // ✅ number válido
  return this.http.put(`${this.apiUrl}/${id}`, cliente);
}


guardar(cliente: Cliente): Observable<any> {
  cliente.idCliente = undefined; // o undefined
  return this.http.post(this.apiUrl, cliente);
}

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  buscarPorNombre(nombre: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/cliente/${nombre}`);
  }
}