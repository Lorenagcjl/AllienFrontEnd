import { Component, EventEmitter, Input, Output, inject, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { MovimientoDetalleService } from 'src/app/@theme/services/movimiento-detalle.service';
import { ProductoService } from 'src/app/@theme/services/producto.service';
import { MovimientoService } from 'src/app/@theme/services/movimiento.service';

@Component({
  selector: 'app-movimiento-detalle-form',
  standalone: true,
  imports: [CommonModule, SharedModule, ReactiveFormsModule, MatSelectModule, MatOptionModule],
  templateUrl: './movimiento-detalle-form.html',
  styleUrls: ['./movimiento-detalle-form.scss']
})
export class MovimientoDetalleForm implements OnInit {
  private fb = inject(FormBuilder);
  private detalleService = inject(MovimientoDetalleService);
  private productoService = inject(ProductoService);
  private movimientoService = inject(MovimientoService);
  private alertService = inject(AlertService);

  @Input() detalleSeleccionado?: any;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<boolean>();

  cargando = false;
  productos: any[] = [];
  movimientos: any[] = [];

  form: FormGroup = this.fb.group({
    idMovimientoDetalle: [null],
    idMovimiento: [null, Validators.required],
    idProducto: [null, Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    this.cargarCombos();
    if (this.detalleSeleccionado) {
      // Mapeo manual para asegurar que tome los IDs de los objetos fk si es necesario
      this.form.patchValue({
        idMovimientoDetalle: this.detalleSeleccionado.idMovimientoDetalle,
        idMovimiento: this.detalleSeleccionado.idMovimiento || this.detalleSeleccionado.fkMovimiento?.idMovimiento,
        idProducto: this.detalleSeleccionado.idProducto || this.detalleSeleccionado.fkProducto?.idProducto,
        cantidad: this.detalleSeleccionado.cantidad
      });
    }
  }

  cargarCombos() {
  // Productos activos para el combo
  this.productoService.listarProductos().subscribe(res => {
    this.productos = (res ?? []).filter((p: any) => p.esActivo !== false);
  });

  // Movimientos activos para el combo
  this.movimientoService.listar().subscribe(res => {
    this.movimientos = (res ?? []).filter((m: any) => m.esActivo !== false);
  });
}

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.onClose();
  }

  onClose(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.alertService.warning('Atención', 'Completa los campos requeridos.');
      return;
    }

    const confirmado = await this.alertService.confirm(
      this.detalleSeleccionado ? '¿Actualizar detalle?' : '¿Guardar nuevo detalle?',
      '¿Estás seguro de realizar esta acción?'
    );

    if (!confirmado) return;

    this.cargando = true;
    const loadingId = this.alertService.loading('Guardando...', 'Procesando detalle de movimiento');

    const datos = this.form.value;
    
    // Payload compatible con tu interfaz rígida y con los objetos fk de Ventas
    const payload: any = {
      ...datos,
      fkMovimiento: { idMovimiento: datos.idMovimiento },
      fkProducto: { idProducto: datos.idProducto }
    };

    const request = datos.idMovimientoDetalle 
      ? this.detalleService.actualizar(datos.idMovimientoDetalle, payload)
      : this.detalleService.crear(payload);

    request.subscribe({
      next: () => {
        this.alertService.close(loadingId);
        this.alertService.toast('success', 'Guardado exitosamente');
        this.saved.emit(true);
      },
      error: (err) => {
        this.cargando = false;
        this.alertService.close(loadingId);
        this.alertService.error('Error', this.alertService.getErrorMessage(err));
      }
    });
  }
}