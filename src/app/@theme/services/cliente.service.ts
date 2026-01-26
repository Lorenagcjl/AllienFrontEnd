import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/cliente'; // Ajusta a tu URL

  listarClientes(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}