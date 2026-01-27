import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

const solamenteLetras = '^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]*$';

@Component({
  selector: 'app-ubi-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatOptionModule
  ],
  templateUrl: './ubi-form.component.html',
  styleUrls: ['./ubi-form.component.scss']
})
export class UbiFormComponent implements OnInit {
  ubiForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UbiFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.ubiForm = this.fb.group({
      idUbicacion: [null],
      nombre: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.pattern(solamenteLetras)
        ]
      ],

      descripcion: ['', [Validators.required, Validators.pattern(solamenteLetras)]],
      tipo: ['', [Validators.required, Validators.pattern(solamenteLetras)]]
    });

    if (this.data) {
      this.ubiForm.patchValue(this.data);
    }
  }

  save(): void {
    if (this.ubiForm.invalid) return;
    this.dialogRef.close(this.ubiForm.value);
  }
}
