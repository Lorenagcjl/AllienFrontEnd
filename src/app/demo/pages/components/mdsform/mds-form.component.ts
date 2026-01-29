import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    CommonModule,          // <- importante para *ngIf, *ngFor
    ReactiveFormsModule,   // <- para formularios reactivos
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './mds-form.component.html',
  styleUrls: ['./mds-form.component.scss']
})
export class mdsFormComponent implements OnInit {
  mdsForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<mdsFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.mdsForm = this.fb.group({
      idMovimientoDetalleSerial: [null],
      idDetalleVenta: [null, Validators.required],
      idProductoSerial: [null, Validators.required]

    });

    if (this.data) {
      this.mdsForm.patchValue(this.data);
    }
  }

  save() {
    if (this.mdsForm.invalid) return;

    const formValue = this.mdsForm.value;

    const payload = {
      idMovimientoDetalleSerial: formValue.idMovimientoDetalleSerial ?? undefined,
      fkMovimientoDetalle: {
        idDetalleVenta: formValue.idDetalleVenta
      },
      fkProductoSerial: {
        idProductoSerial: formValue.idProductoSerial
      }
    };

    this.dialogRef.close(payload);
  }

}
