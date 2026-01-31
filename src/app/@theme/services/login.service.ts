import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router'; // 1. Importa el Router
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private http = inject(HttpClient);
  private router = inject(Router); // 2. Inyecta el Router

  login(email: string, pass: string): Observable<any> {
    const body = {
      correoElectronico: email,
      clave: pass
    };
    return this.http.post<any>('http://localhost:8080/api/login/login', body);
  }

  logout() {
    localStorage.removeItem('role');
    this.router.navigate(['/auth/login']); // Ahora ya funcionará
  }
}
