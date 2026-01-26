import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

import { ProductoSerialService } from 'src/app/@theme/services/producto-serial.service';
import { ProductoService } from 'src/app/@theme/services/producto.service';
import { Producto } from 'src/app/demo/models/producto.model';
import { ProductoSerial } from 'src/app/demo/models/producto-serial.model';

export type ProductoSerialDialogData = {
  productoSerial?: ProductoSerial;
};

@Component({
  selector: 'app-producto-serial-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './producto-serial-form.dialog.html',
  styleUrls: ['./producto-serial-form.dialog.scss'],
})
export class ProductoSerialFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ProductoSerialFormDialog>);
  private readonly productoSerialService = inject(ProductoSerialService);
  private readonly productoService = inject(ProductoService);
  readonly data = inject<ProductoSerialDialogData>(MAT_DIALOG_DATA);

  productos: Producto[] = [];

  readonly editando = !!this.data?.productoSerial?.idProductoSerial && this.data.productoSerial.idProductoSerial > 0;

  form = this.fb.group({
    // Ojo: si tu backend usa @Null para id en create, NO lo mandes.
    idProductoSerial: [this.data?.productoSerial?.idProductoSerial ?? 0],
    idProducto: [this.data?.productoSerial?.idProducto ?? null, [Validators.required]],
    serial: [this.data?.productoSerial?.serial ?? '', [Validators.required, Validators.minLength(3)]],
    estado: [this.data?.productoSerial?.estado ?? 'ACTIVO', [Validators.required]],
  });

  constructor() {
    this.cargarProductos();
  }

  private cargarProductos(): void {
    this.productoService.listarProductos().subscribe({
      next: (data) => {
        this.productos = (data ?? []).filter(p => p.esConSerial === true);
      },
      error: (err) => {
        console.error('Error cargando productos para select', err);
        this.productos = [];
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    const payload = {
      serial: (v.serial ?? '').trim(),
      estado: v.estado ?? '',
      fkProducto: { idProducto: Number(v.idProducto) }
    };

    if (this.editando) {
      const id = Number(v.idProductoSerial);

      this.productoSerialService.actualizarProductoSerial(id, payload).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          console.error('Error actualizando producto-serial', err);
          console.error('Detalle backend:', err?.error);
        }
      });
      return;
    }

    this.productoSerialService.crearProductoSerial(payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        console.error('Error creando producto-serial', err);
        console.error('Detalle backend:', err?.error);
      }
    });
  }


}
