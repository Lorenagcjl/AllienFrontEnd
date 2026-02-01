import { Component, OnInit, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MovimientoDetalleService } from 'src/app/@theme/services/movimiento-detalle.service';
import { ProductoService } from 'src/app/@theme/services/producto.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-movimiento-detalle',
  standalone: true,
  imports: [
    CommonModule, SharedModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, 
    MatTableModule, MatTooltipModule
  ],
  templateUrl: './movimiento-detalle.html'
})
export default class MovimientoDetalleComponent implements OnInit {
  private fb = inject(FormBuilder);
  private detalleService = inject(MovimientoDetalleService);
  private productoService = inject(ProductoService);

  detalles: any[] = [];
  productos: any[] = [];
  form: FormGroup;
  cargando = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, 
    public dialogRef: MatDialogRef<MovimientoDetalleComponent>
  ) {
    this.form = this.fb.group({
      idProducto: [null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit() {
    this.cargarProductos();
    this.listarDetalles();
  }

  cargarProductos() {
    this.productoService.listarProductos().subscribe(res => this.productos = res);
  }

  listarDetalles() {
    this.cargando = true;
    this.detalleService.listarMovimientoDetalles().subscribe({
      next: (res: any[]) => {
        // Filtro que busca el ID tanto en formato plano como en objeto fk
        this.detalles = res.filter(d => {
          const idMov = d.idMovimiento || d.fkMovimiento?.idMovimiento;
          return idMov === this.data.idMovimiento;
        });
        this.cargando = false;
      },
      error: () => this.cargando = false
    });
  }

  agregarItem() {
    if (this.form.invalid) return;
    const val = this.form.value;

    // ESTA ES LA ESTRUCTURA QUE DIJISTE QUE SÍ VALÍA
    const payload: any = {
      cantidad: val.cantidad,
      fkMovimiento: { 
        idMovimiento: this.data.idMovimiento 
      },
      fkProducto: { 
        idProducto: val.idProducto 
      }
    };

    this.detalleService.crear(payload).subscribe({
      next: () => {
        this.listarDetalles();
        this.form.reset({ cantidad: 1 });
        Swal.fire({ 
          icon: 'success', 
          title: 'Agregado', 
          toast: true, 
          position: 'top-end', 
          timer: 1500, 
          showConfirmButton: false 
        });
      },
      error: (err) => {
        console.error('ERROR AL GUARDAR:', err);
        Swal.fire('Error', 'No se pudo guardar el detalle', 'error');
      }
    });
  }

  getNombreProducto(id: number): string {
    const p = this.productos.find(prod => prod.idProducto === id);
    return p ? p.nombre : 'Cargando...';
  }
}