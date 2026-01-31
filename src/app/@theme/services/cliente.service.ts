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

  obtenerPorId(idCliente: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${idCliente}`);
  }

  crearCliente(payload: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, payload);
  }

  actualizarCliente(idCliente: number, payload: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${idCliente}`, payload);
  }

  eliminarCliente(idCliente: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idCliente}`);
  }
}
