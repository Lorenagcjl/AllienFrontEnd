import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

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
    columns: string[] = ['cantidad', 'idProducto'];
    dataSource = new MatTableDataSource<any>([]);

    constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

    ngOnInit() {
        this.cargarDetalles();
    }

    cargarDetalles() {
        // Usar los detalles que ya vienen en data (del movimiento completo)
        console.log('Datos del movimiento:', this.data);
        console.log('Detalles del movimiento:', this.data.detalles);

        if (this.data.detalles && this.data.detalles.length > 0) {
            this.dataSource.data = this.data.detalles;
            console.log('Detalles cargados:', this.dataSource.data);
        } else {
            console.log('No hay detalles para este movimiento');
            this.dataSource.data = [];
        }
    }
}