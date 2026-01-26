import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MovimientoDetalleService } from 'src/app/@theme/services/movimiento-detalle.service';

@Component({
    selector: 'app-movimiento-modal',
    standalone: true,
    imports: [MatDialogModule, MatButtonModule, CommonModule, MatTableModule],
    template: `
    <h2 mat-dialog-title>Detalles del Movimiento #{{ data.idMovimiento }}</h2>

    <mat-dialog-content>
      <div style="margin-bottom: 15px;">
        <div><strong>Tipo:</strong> {{ data.tipo }}</div>
        <div><strong>Fecha:</strong> {{ data.fechaMovimiento | date:'short' }}</div>
        <div><strong>Observaciones:</strong> {{ data.observaciones }}</div>
      </div>

      <hr />
      <h3 style="margin-top: 15px;">Productos vinculados</h3>

      <table mat-table [dataSource]="dataSource" class="mat-elevation-z2" style="width: 100%;">
        <ng-container matColumnDef="cantidad">
          <th mat-header-cell *matHeaderCellDef>Cantidad</th>
          <td mat-cell *matCellDef="let row">{{ row.cantidad }}</td>
        </ng-container>

        <ng-container matColumnDef="idProducto">
          <th mat-header-cell *matHeaderCellDef>Producto</th>
          <td mat-cell *matCellDef="let row">
            <div style="display: flex; align-items: center; gap: 8px">
              <img
                *ngIf="row.fkProducto?.foto"
                [src]="row.fkProducto.foto"
                [alt]="row.fkProducto?.nombre"
                width="40"
                height="40"
                style="object-fit: cover; border-radius: 4px"
              />
              <div>
                <div><strong>{{ row.fkProducto?.nombre }}</strong></div>
                <div>
                 <span *ngIf="row.fkProducto?.precioVenta">
  {{ row.fkProducto.precioVenta | currency:'USD':'symbol':'1.2-2' }}
</span>
                </div>
              </div>
            </div>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>

        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell" colspan="2" style="padding: 15px; text-align: center;">
            No hay productos para este movimiento.
          </td>
        </tr>
      </table>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close color="primary">Cerrar</button>
    </mat-dialog-actions>
  `,
})
export class MovimientoModalComponent implements OnInit {
    // 1. Definir explícitamente las columnas que coinciden con los matColumnDef
    columns: string[] = ['cantidad', 'idProducto'];
    dataSource = new MatTableDataSource<any>([]);

    private detalleService = inject(MovimientoDetalleService);

    constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

    ngOnInit() {
        this.cargarDetalles();
    }

    cargarDetalles() {
        this.detalleService.listarMovimientoDetalles().subscribe({
            next: (res) => {
                // 1. Log para depurar (mira la consola del navegador F12)
                console.log("ID del Movimiento seleccionado:", this.data.idMovimiento);
                console.log("Primer detalle recibido del servidor:", res[0]);

                // 2. Filtrado robusto
                // Usamos Number() para asegurar que ambos sean tratados como números
                // Y verificamos si la propiedad se llama idMovimiento o fkMovimiento.idMovimiento
                this.dataSource.data = res.filter((d: any) => {
                    const idDetalle = d.idMovimiento || (d.fkMovimiento ? d.fkMovimiento.idMovimiento : null);
                    return Number(idDetalle) === Number(this.data.idMovimiento);
                });

                console.log("Datos después del filtro:", this.dataSource.data);
            },
            error: (err) => console.error('Error al cargar detalles', err)
        });
    }
}