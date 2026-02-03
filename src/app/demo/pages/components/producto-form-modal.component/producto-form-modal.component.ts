import { Component, EventEmitter, Input, Output, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { ProductoService } from 'src/app/@theme/services/producto.service';
import { Producto } from 'src/app/demo/models/producto.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

function nowLocalDateTimeString(): string {
  return new Date().toISOString().slice(0, 19);
}

@Component({
  selector: 'app-producto-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
  MatFormFieldModule, // Importar de @angular/material/form-field
  MatInputModule,     // Importar de @angular/material/input
  MatButtonModule,    // Importar de @angular/material/button
  MatSelectModule,    // Importar de @angular/material/select
  MatIconModule],
  templateUrl: './producto-form-modal.component.html',
  styleUrls: ['./producto-form-modal.component.scss'],
})
export class ProductoFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productoService = inject(ProductoService);
  private readonly alert = inject(AlertService);

  @Input() producto?: Producto;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<boolean>();

  get editando(): boolean {
    return !!this.producto?.idProducto && this.producto.idProducto > 0;
  }

  productoForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    marca: ['', [Validators.required, Validators.minLength(2)]],
    tipo: ['', [Validators.required, Validators.minLength(2)]],
    foto: ['', [Validators.required]],
    descripcion: ['', [Validators.required, Validators.minLength(3)]],
    precioVenta: [null as number | null, [Validators.required, Validators.min(0)]],
    esConSerial: [null as boolean | null, [Validators.required]],
    porcentajeComision: [null as number | null, [Validators.required, Validators.min(0), Validators.max(100)]],
    fechaCreacion: [nowLocalDateTimeString(), [Validators.required]],
  });

  ngOnInit(): void {
    if (this.producto) {
      this.productoForm.patchValue({
        nombre: this.producto.nombre ?? '',
        marca: this.producto.marca ?? '',
        tipo: this.producto.tipo ?? '',
        foto: this.producto.foto ?? '',
        descripcion: this.producto.descripcion ?? '',
        precioVenta: this.producto.precioVenta ?? null,
        esConSerial: this.producto.esConSerial ?? null,
        porcentajeComision: this.producto.porcentajeComision ?? null,
        fechaCreacion: this.producto.fechaCreacion ?? nowLocalDateTimeString(),
      });
    } else {
      // Si es "Nuevo", aseguras defaults limpios
      this.productoForm.patchValue({
        fechaCreacion: nowLocalDateTimeString(),
      });
    }
  }

  // Cerrar con ESC (opcional, recomendado)
  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.onClose();
  }

  onClose(): void {
    this.closed.emit();
  }

  // ✅ Cierra SOLO si el click fue en el backdrop (afuera)
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  // ✅ Enter / Space en el backdrop
  onBackdropKeydown(event: KeyboardEvent): void {
    event.preventDefault();
    this.onClose();
  }

  async save(): Promise<void> {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      await this.alert.warning('Formulario incompleto', 'Revisa los campos marcados antes de guardar.');
      return;
    }

    // Confirmación al dar Guardar
    const confirmado = await this.alert.confirm(
      'Confirmar',
      this.editando ? '¿Guardar cambios del producto?' : '¿Crear el producto?',
      'Sí, guardar',
      'Cancelar'
    );
    if (!confirmado) return;

    const v = this.productoForm.getRawValue();

    const payload = {
      nombre: v.nombre ?? '',
      marca: v.marca ?? '',
      tipo: v.tipo ?? '',
      foto: v.foto ?? '',
      descripcion: v.descripcion ?? '',
      precioVenta: Number(v.precioVenta),
      esConSerial: !!v.esConSerial,
      porcentajeComision: Number(v.porcentajeComision),
      fechaCreacion: v.fechaCreacion ?? nowLocalDateTimeString(),
    };

    this.alert.loading('Guardando...', this.editando ? 'Actualizando producto.' : 'Creando producto.');

    if (this.editando) {
      const id = this.producto?.idProducto;
      if (!id) {
        this.alert.close();
        await this.alert.error('Error', 'No se encontró el ID del producto para actualizar.');
        return;
      }

      this.productoService.actualizarProducto(id, payload).subscribe({
        next: () => {
          this.alert.close();
          this.saved.emit(true);
        },
        error: async (err) => {
          console.error(err);
          this.alert.close();
          await this.alert.error(
            'Error al actualizar',
            this.alert.getErrorMessage(err, 'No se pudo actualizar el producto.')
          );
        }
      });

      return;
    }

    this.productoService.crearProducto(payload).subscribe({
      next: () => {
        this.alert.close();
        this.saved.emit(true);
      },
      error: async (err) => {
        console.error(err);
        this.alert.close();
        await this.alert.error(
          'Error al crear',
          this.alert.getErrorMessage(err, 'No se pudo crear el producto.')
        );
      }
    });
  }
}
