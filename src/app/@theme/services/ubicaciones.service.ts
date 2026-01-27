import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UbicacionModel } from 'src/app/demo/models/ubicacion.model';

@Injectable({
    providedIn: 'root'
})
export class UbicacionesService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/api/ubicacion';

    listarUbicaciones(): Observable<UbicacionModel[]> {
        return this.http.get<UbicacionModel[]>(this.apiUrl);
    }
}