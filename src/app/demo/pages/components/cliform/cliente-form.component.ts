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
  templateUrl: './cliente-form.component.html',
  styleUrls: ['./cliente-form.component.scss']
})
export class ClienteFormComponent implements OnInit {
  clienteForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ClienteFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.clienteForm = this.fb.group({
      idCliente: [null],
      primerNombre: ['', Validators.required],
      segundoNombre: [''],
      primerApellido: ['', Validators.required],
      segundoApellido: [''],
      documento: ['', Validators.required],
      telefono: [''],
      email: ['', [Validators.required, Validators.email]],
      direccion: ['']
    });

    if (this.data) {
      this.clienteForm.patchValue(this.data);
    }
  }

  save() {
    if (this.clienteForm.invalid) return;
    this.dialogRef.close(this.clienteForm.value);
  }
}
