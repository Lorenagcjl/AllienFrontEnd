import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MovimientoRequestDto } from 'src/app/demo/models/movimiento-request.dto';
import { MovimientoModel } from 'src/app/demo/models/movimiento.model';

@Injectable({
    providedIn: 'root'
})
export class MovimientoService {
    private http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8080/api/movimiento';

    listarMovimientos(): Observable<MovimientoModel[]> {
        return this.http.get<MovimientoModel[]>(this.apiUrl);
    }

    guardar(movimiento: MovimientoRequestDto): Observable<MovimientoModel> {
        return this.http.post<MovimientoModel>(this.apiUrl, movimiento);
    }

    actualizar(id: number, movimiento: MovimientoRequestDto): Observable<MovimientoModel> {
        return this.http.put<MovimientoModel>(`${this.apiUrl}/${id}`, movimiento);
    }

    eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    buscarPorId(id: number): Observable<MovimientoModel> {
        return this.http.get<MovimientoModel>(`${this.apiUrl}/${id}`);
    }
}
