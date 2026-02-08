import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { Cliente } from 'src/app/demo/models/cliente.model';

interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/cliente';

  listarClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl).pipe(catchError(this.handleError));
  }

  obtenerPorId(idCliente: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${idCliente}`).pipe(catchError(this.handleError));
  }

  crearCliente(payload: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, payload).pipe(catchError(this.handleError));
  }

  actualizarCliente(idCliente: number, payload: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${idCliente}`, payload).pipe(catchError(this.handleError));
  }

  eliminarCliente(idCliente: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idCliente}`).pipe(catchError(this.handleError));
  }

  private handleError(err: HttpErrorResponse) {
    const api = err.error as Partial<ApiError>;

    // tu GlobalExceptionHandler devuelve message => úsalo
    if (api && typeof api.message === 'string') {
      return throwError(() => new Error(api.message));
    }

    // fallback
    if (typeof err.error === 'string') {
      return throwError(() => new Error(err.error));
    }

    return throwError(() => new Error('Error inesperado al comunicar con el servidor'));
  }
}
