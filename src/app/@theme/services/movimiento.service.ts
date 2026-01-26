import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MovimientoModel } from 'src/app/demo/models/movimiento.model';

@Injectable({
    providedIn: 'root'
})
export class MovimientoService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/api/movimiento';

    listarMovimientos(): Observable<MovimientoModel[]> {
        return this.http.get<MovimientoModel[]>(this.apiUrl);
    }

}