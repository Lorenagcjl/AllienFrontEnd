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
  templateUrl: './vts-form.component.html',
  styleUrls: ['./vts-form.component.scss']
})
export class vtsFormComponent implements OnInit {
  vtsForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<vtsFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.vtsForm = this.fb.group({
      idVentaDetalleSerial: [null],
      idDetalleVenta: [null, Validators.required],
      idProductoSerial: [null, Validators.required]

    });

    if (this.data) {
      this.vtsForm.patchValue(this.data);
    }
  }

  save() {
    if (this.vtsForm.invalid) return;

    const formValue = this.vtsForm.value;

    const payload = {
      idVentaDetalleSerial: formValue.idVentaDetalleSerial ?? undefined,
      fkDetalleVenta: {
        idDetalleVenta: formValue.idDetalleVenta
      },
      fkProductoSerial: {
        idProductoSerial: formValue.idProductoSerial
      }
    };

    this.dialogRef.close(payload);
  }

}
