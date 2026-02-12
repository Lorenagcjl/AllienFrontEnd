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
import { MatTooltipModule } from '@angular/material/tooltip';
import { DetalleCatalogoService } from 'src/app/@theme/services/detalle-catalogo.service';
import { DetalleCatalogoResponseDto } from 'src/app/demo/models/detalle-catalogo.model';
import { forkJoin } from 'rxjs';

function nowLocalDateTimeString(): string {
  return new Date().toISOString().slice(0, 19);
}

@Component({
  selector: 'app-producto-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './producto-form-modal.component.html',
  styleUrls: ['./producto-form-modal.component.scss'],
})
export class ProductoFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productoService = inject(ProductoService);
  private readonly alert = inject(AlertService);
  private readonly detalleCatalogoService = inject(DetalleCatalogoService);

  private _producto?: Producto;

  @Input() set producto(value: Producto | undefined) {
    this._producto = value;
    // ✅ si ya cargaron catálogos, refresca el form
    this.rellenarFormularioSiAplica();
  }
  get producto(): Producto | undefined {
    return this._producto;
  }


  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<boolean>();

  previewUrl: string | null = null;

  private setPreviewFromBase64(base64: string): void {
    this.previewUrl = base64 ? `data:image/*;base64,${base64}` : null;
  }

  get editando(): boolean {
    return !!this.producto?.idProducto && this.producto.idProducto > 0;
  }

  tipos: DetalleCatalogoResponseDto[] = [];
  marcas: DetalleCatalogoResponseDto[] = [];

  productoForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    marca: ['', [Validators.required, Validators.minLength(2)]],
    tipo: ['', [Validators.required, Validators.minLength(2)]],
    foto: ['', [Validators.required]],
    descripcion: ['', [Validators.required, Validators.minLength(3)]],
    precioVenta: [{ value: null as number | null, disabled: false }, [Validators.required, Validators.min(0)]],
    esConSerial: [null as boolean | null, [Validators.required]],
    porcentajeComision: [null as number | null, [Validators.required, Validators.min(0), Validators.max(100)]],
    fechaCreacion: [nowLocalDateTimeString(), [Validators.required]],
  });

  // ngOnInit(): void {
  //   this.cargarCatalogos();
  //   if (this.producto) {
  //     this.productoForm.patchValue({
  //       nombre: this.producto.nombre ?? '',
  //       marca: this.producto.marca ?? '',
  //       tipo: this.producto.tipo ?? '',
  //       foto: this.producto.foto ?? '',
  //       descripcion: this.producto.descripcion ?? '',
  //       precioVenta: this.producto.precioVenta ?? null,
  //       esConSerial: this.producto.esConSerial ?? null,
  //       porcentajeComision: this.producto.porcentajeComision ?? null,
  //       fechaCreacion: this.producto.fechaCreacion ?? nowLocalDateTimeString(),
  //     });

  //     this.productoForm.get('precioVenta')?.disable({ emitEvent: false });
  //   } else {
  //     this.productoForm.patchValue({ fechaCreacion: nowLocalDateTimeString() });
  //     this.productoForm.get('precioVenta')?.enable({ emitEvent: false });
  //   }
  // }

  // private cargarCatalogos(): void {
  //   forkJoin({
  //     tipos: this.detalleCatalogoService.listarPorNombreCatalogo('TIPOPRODUCTOS'),
  //     marcas: this.detalleCatalogoService.listarPorNombreCatalogo('MARCAPRODUCTO'),
  //   }).subscribe({
  //     next: ({ tipos, marcas }) => {
  //       this.tipos = (tipos ?? []).filter(x => x.esActivo).sort((a, b) => a.orden - b.orden);
  //       this.marcas = (marcas ?? []).filter(x => x.esActivo).sort((a, b) => a.orden - b.orden);
  //     },
  //     error: (err) => {
  //       this.alert.error('Error', this.alert.getErrorMessage(err, 'No se pudieron cargar catálogos.'));
  //     }
  //   });
  // }
  ngOnInit(): void {
    this.cargarCatalogos();
  }

  private cargarCatalogos(): void {
    forkJoin({
      tipos: this.detalleCatalogoService.listarPorNombreCatalogo('TIPOPRODUCTOS'),
      marcas: this.detalleCatalogoService.listarPorNombreCatalogo('MARCAPRODUCTO'),
    }).subscribe({
      next: ({ tipos, marcas }) => {
        this.tipos = (tipos ?? []).filter(x => x.esActivo).sort((a, b) => a.orden - b.orden);
        this.marcas = (marcas ?? []).filter(x => x.esActivo).sort((a, b) => a.orden - b.orden);

        // ✅ ahora sí puede pintar marca/tipo si venía editando
        this.rellenarFormularioSiAplica();
      },
      error: (err) => {
        this.alert.error('Error', this.alert.getErrorMessage(err, 'No se pudieron cargar catálogos.'));
        // aún así intenta rellenar (aunque select puede no pintar)
        this.rellenarFormularioSiAplica(true);
      }
    });
  }

  private rellenarFormularioSiAplica(ignorarCatalogos: boolean = false): void {
    // Si estás editando y aún NO hay catálogos, espera (evita el bug del mat-select)
    if (!ignorarCatalogos) {
      if (this.tipos.length === 0 || this.marcas.length === 0) return;
    }

    if (this.producto) {
      const marca = (this.producto.marca ?? '').trim();
      const tipo = (this.producto.tipo ?? '').trim();
      const foto = this.producto.foto ?? '';

      this.productoForm.patchValue({
        nombre: this.producto.nombre ?? '',
        marca,
        tipo,
        foto,
        descripcion: this.producto.descripcion ?? '',
        precioVenta: this.producto.precioVenta ?? null,
        esConSerial: this.producto.esConSerial ?? null,
        porcentajeComision: this.producto.porcentajeComision ?? null,
        fechaCreacion: this.producto.fechaCreacion ?? nowLocalDateTimeString(),
      });

      // ✅ repinta selects
      this.productoForm.get('marca')?.setValue(marca, { emitEvent: false });
      this.productoForm.get('tipo')?.setValue(tipo, { emitEvent: false });

      // ✅ repinta preview sin recomputar en template
      this.setPreviewFromBase64(foto);

      // ✅ precio bloqueado en editar
      this.productoForm.get('precioVenta')?.disable({ emitEvent: false });
    } else {
      // modo nuevo
      this.productoForm.reset({
        nombre: '',
        marca: '',
        tipo: '',
        foto: '',
        descripcion: '',
        precioVenta: null,
        esConSerial: null,
        porcentajeComision: null,
        fechaCreacion: nowLocalDateTimeString(),
      });

      this.previewUrl = null;
      this.productoForm.get('precioVenta')?.enable({ emitEvent: false });
    }
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

    const confirmado = await this.alert.confirm(
      'Confirmar',
      this.editando ? '¿Guardar cambios del producto?' : '¿Crear el producto?',
      'Sí, guardar',
      'Cancelar'
    );
    if (!confirmado) return;

    const v = this.productoForm.getRawValue();

    const payloadBase = {
      nombre: v.nombre ?? '',
      marca: v.marca ?? '',
      tipo: v.tipo ?? '',
      foto: v.foto ?? '',
      descripcion: v.descripcion ?? '',
      esConSerial: !!v.esConSerial,
      porcentajeComision: Number(v.porcentajeComision),
      fechaCreacion: v.fechaCreacion ?? nowLocalDateTimeString(),
    };

    const payload = this.editando
      ? payloadBase
      : { ...payloadBase, precioVenta: Number(v.precioVenta) };

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
          this.alert.close();
          await this.alert.error('Error al actualizar', this.alert.getErrorMessage(err, 'No se pudo actualizar el producto.'));
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
        this.alert.close();
        await this.alert.error('Error al crear', this.alert.getErrorMessage(err, 'No se pudo crear el producto.'));
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.alert.warning('Formato no válido', 'Solo se permiten JPG, PNG, GIF o WEBP.');
      input.value = '';
      this.productoForm.get('foto')?.markAsTouched();
      return;
    }

    const maxSize = 25 * 1024; // ✅ 25KB
    if (file.size > maxSize) {
      this.alert.warning('Archivo muy grande', 'La imagen no debe superar 25 KB.');
      input.value = '';
      this.productoForm.get('foto')?.markAsTouched();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? '';

      this.productoForm.patchValue({ foto: base64 });
      this.productoForm.get('foto')?.markAsDirty();
      this.productoForm.get('foto')?.markAsTouched();

      this.setPreviewFromBase64(base64); // ✅

      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  /**
   * Elimina la foto del formulario
   */
  eliminarFoto(): void {
    this.productoForm.patchValue({ foto: '' });
    this.productoForm.get('foto')?.markAsDirty();
    this.productoForm.get('foto')?.markAsTouched();
    this.previewUrl = null; // ✅
  }


}
