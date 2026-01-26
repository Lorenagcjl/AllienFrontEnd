import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-movimiento-modal',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule],
  template: `
    <h2 mat-dialog-title>Detalle del Movimiento</h2>
    <mat-dialog-content>
      <div><strong>ID:</strong> {{ data.idMovimiento }}</div>
      <div><strong>Tipo:</strong> {{ data.tipo }}</div>
      <div><strong>Fecha:</strong> {{ data.fechaMovimiento | date:'short' }}</div>
      <div><strong>Observaciones:</strong> {{ data.observaciones }}</div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
})
export class MovimientoModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
