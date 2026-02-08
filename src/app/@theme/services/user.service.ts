import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { CambiarPasswordRequest, Usuario, UsuarioCreateRequest, UsuarioUpdateRequest } from 'src/app/demo/models/user.model';
import { ApiError } from 'src/app/demo/models/api-error.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/usuarios';

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl).pipe(catchError(this.handleError));
  }

  buscarPorNombre(nombre: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuario/${encodeURIComponent(nombre)}`)
      .pipe(catchError(this.handleError));
  }

  crear(payload: UsuarioCreateRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, payload)
      .pipe(catchError(this.handleError));
  }

  actualizar(id: number, payload: UsuarioUpdateRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, payload)
      .pipe(catchError(this.handleError));
  }

  /** En tu backend DELETE alterna estado (no borra). Mejor nombre para que no te confundas. */
  alternarEstado(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /** Endpoint nuevo: PATCH /api/usuarios/{id}/password */
  cambiarPassword(id: number, payload: CambiarPasswordRequest): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/password`, payload)
      .pipe(catchError(this.handleError));
  }

  resetPassword(id: number, claveTemporal: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/reset-password`, { claveTemporal });
  }

  /** Convierte tu ApiError del backend en un Error con message limpio */
  private handleError(err: HttpErrorResponse) {
    // Si backend devolvió tu ApiError
    const api = err.error as Partial<ApiError>;
    if (api && typeof api.message === 'string') {
      return throwError(() => new Error(api.message));
    }

    // Fallback por si viene algo raro
    if (typeof err.error === 'string') {
      return throwError(() => new Error(err.error));
    }

    return throwError(() => new Error('Error inesperado al comunicar con el servidor'));
  }
}
