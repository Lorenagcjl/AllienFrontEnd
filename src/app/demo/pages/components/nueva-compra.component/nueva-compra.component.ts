import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// RxJS (alias para evitar choque)
import { forkJoin, Observable, of } from 'rxjs';
import * as rx from 'rxjs/operators';

// Services
import { CompraProductoRequest, CompraProductoService } from 'src/app/@theme/services/compra-producto.service';
import { CompraProductoDetalleRequest, CompraProductoDetalleService } from 'src/app/@theme/services/compra-producto-detalle.service';
import { InventarioMovimientoService } from 'src/app/@theme/services/inventariomovimiento.service';
import { ProductoSerialService } from 'src/app/@theme/services/producto-serial.service';
import { ProductoService } from 'src/app/@theme/services/producto.service';
import { UbicacionService } from 'src/app/@theme/services/ubicacion.service';

// Models
import { InventarioMovimiento } from 'src/app/demo/models/inventariomovimiento.model';
import { ProductoSerial } from 'src/app/demo/models/producto-serial.model';
import { Producto } from 'src/app/demo/models/producto.model';
import { Ubicacion } from 'src/app/demo/models/ubicacion.model';

import { AlertService } from 'src/app/@theme/services/alert.service';


type Product = { id: number; name: string; serialized: boolean };

type RowForm = FormGroup<{
  productName: FormControl<string>;
  productId: FormControl<number | null>;
  quantity: FormControl<number>;
  cost: FormControl<number | null>;
  serials: FormControl<string[]>;
  autocompleteOpen: FormControl<boolean>;
}>;

@Component({
  selector: 'app-nueva-compra.component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './nueva-compra.component.html',
  styleUrl: './nueva-compra.component.scss',
})
export default class NuevaCompraComponent {
  private alertSvc = inject(AlertService);
  private ubicacionService = inject(UbicacionService);

  ubicaciones: Ubicacion[] = [];

  private productoService = inject(ProductoService);

  productsData: Product[] = []; // <-- ya no readonly

  private productoSerialService = inject(ProductoSerialService);
  private compraService = inject(CompraProductoService);
  private compraDetalleService = inject(CompraProductoDetalleService);
  private inventarioMovimientoService = inject(InventarioMovimientoService);


  private serialesExistentesPorProducto = new Map<number, Set<string>>();
  private loadProductos(): void {
    this.productoService.listarProductos().pipe(
      rx.take(1)
    ).subscribe({
      next: (data: Producto[]) => {
        this.productsData = (data ?? []).map(p => ({
          id: p.idProducto,
          name: p.nombre,
          serialized: !!p.esConSerial,
        }));
      },
      error: (err) => {
        console.error('Error cargando productos', err);
        this.productsData = [];
      },
    });
  }


  private fb = new FormBuilder();

  // ====== Form principal ======
  readonly form = this.fb.group({
    fecha: this.fb.control<string>({ value: this.formatNowEc(), disabled: true }),
    usuario: this.fb.control<string>({ value: 'Juan Pérez', disabled: true }),
    ubicacion: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    observaciones: this.fb.control<string>(''),
    rows: this.fb.array<RowForm>([]),
  });

  get rows(): FormArray<RowForm> {
    return this.form.controls.rows;
  }

  // ====== Modal seriales ======
  readonly serialModalOpen = signal(false);
  readonly modalRowIndex = signal<number | null>(null);

  readonly modalProductName = computed(() => {
    const idx = this.modalRowIndex();
    if (idx === null) return '-';
    return this.rows.at(idx).controls.productName.value || '-';
  });

  readonly modalQuantity = computed(() => {
    const idx = this.modalRowIndex();
    if (idx === null) return 0;
    return this.rows.at(idx).controls.quantity.value ?? 0;
  });

  readonly modalSerials = signal<string[]>([]);
  readonly modalDuplicateIndexes = computed(() => this.computeDuplicateIndexes(this.modalSerials()));

  readonly enteredCount = computed(() => this.modalSerials().filter(s => s.trim()).length);
  readonly modalComplete = computed(() => {
    const q = this.modalQuantity();
    const ser = this.modalSerials();
    const hasDup = this.modalDuplicateIndexes().size > 0;
    const complete = ser.length === q && ser.every(s => s.trim()) && !hasDup;
    return complete;
  });

  // Para cerrar dropdowns cuando clic afuera (similar a tu document.addEventListener)
  private hostEl = viewChild.required<ElementRef<HTMLElement>>('host');

  constructor() {
    this.fillUsuarioFromStorage();
    this.loadUbicaciones();
    this.loadProductos();
    this.loadSerialesExistentes();

    this.form.controls.ubicacion.valueChanges.subscribe(() => this.form.updateValueAndValidity());
  }

  private fillUsuarioFromStorage(): void {
    // Opción 1 (simple): username directo
    const username = localStorage.getItem('username') ?? '';

    // Opción 2 (fallback): desde objeto usuario
    if (!username) {
      try {
        const u = JSON.parse(localStorage.getItem('usuario') ?? 'null');
        const nombreUsuario = u?.nombreUsuario ?? '';
        this.form.controls.usuario.setValue(nombreUsuario || ''); // control está disabled pero setValue funciona
        return;
      } catch {
        // ignore
      }
    }

    this.form.controls.usuario.setValue(username);
  }

  private loadUbicaciones(): void {
    this.ubicacionService.listarUbicaciones()
      .pipe(rx.take(1))
      .subscribe({
        next: (data) => {
          this.ubicaciones = (data ?? []).filter(u =>
            u.idUbicacion != null &&
            u.esPuntoVenta !== true &&
            u.esActivo === true
          );
        },
        error: (err) => {
          console.error('Error cargando ubicaciones', err);
          this.ubicaciones = [];
        }
      });
  }

  // private loadUbicaciones(): void {
  //   this.ubicacionService.listarUbicaciones()
  //     .pipe(rx.take(1))
  //     .subscribe({
  //       next: (data) => {
  //         this.ubicaciones = (data ?? [])
  //           .filter(u => u.idUbicacion != null)
  //           .filter(u => u.esPuntoVenta !== true); // <-- no punto de venta
  //       },
  //       error: (err) => {
  //         console.error('Error cargando ubicaciones', err);
  //         this.ubicaciones = [];
  //       }
  //     });
  // }

  // ====== UI helpers ======
  trackByIndex = (i: number) => i;

  isEmptyState(): boolean {
    return this.rows.length === 0;
  }

  // ====== Row creation ======
  addProductRow(): void {
    const row: RowForm = this.fb.group({
      productName: this.fb.control<string>('', { nonNullable: true }),
      productId: this.fb.control<number | null>(null),
      quantity: this.fb.control<number>(1, { nonNullable: true, validators: [Validators.min(1)] }),
      cost: this.fb.control<number | null>(null),
      serials: this.fb.control<string[]>([], { nonNullable: true }),
      autocompleteOpen: this.fb.control<boolean>(false, { nonNullable: true }),
    });

    // si cambia cantidad, ajusta seriales si es serializado
    row.controls.quantity.valueChanges.subscribe(() => {
      this.onQuantityChangeForRow(row);
      this.closeAutocompleteAll();
    });

    // si escribe en productName, abre autocomplete
    row.controls.productName.valueChanges.subscribe(() => {
      row.controls.autocompleteOpen.setValue(true, { emitEvent: false });
      // al escribir, se invalida productId hasta que elija
      row.controls.productId.setValue(null, { emitEvent: false });
      row.controls.serials.setValue([], { emitEvent: false });
    });

    this.rows.push(row);
  }

  async removeProductRow(index: number): Promise<void> {
  const ok = await this.alertSvc.confirm(
    'Quitar producto',
    '¿Deseas eliminar este producto?',
    'Sí, quitar',
    'Cancelar'
  );

  if (!ok) return;

  this.rows.removeAt(index);
  this.closeAutocompleteAll();
  this.form.updateValueAndValidity();
}

  // ====== Autocomplete ======
  openAutocomplete(index: number): void {
    this.closeAutocompleteAll();
    this.rows.at(index).controls.autocompleteOpen.setValue(true, { emitEvent: false });
  }

  closeAutocompleteAll(): void {
    this.rows.controls.forEach(r => r.controls.autocompleteOpen.setValue(false, { emitEvent: false }));
  }

  filteredProductsForRow(index: number): Product[] {
    const q = (this.rows.at(index).controls.productName.value || '').trim().toLowerCase();
    if (!q) return [];
    return this.productsData.filter(p => p.name.toLowerCase().includes(q));
  }

  selectProduct(index: number, product: Product): void {
  const row = this.rows.at(index);

  const yaExiste = this.rows.controls.some(
    (r, i) => i !== index && r.controls.productId.value === product.id
  );

  if (yaExiste) {
    this.alertSvc.warning(
      'Producto repetido',
      'Este producto ya fue agregado. Ajusta la cantidad en la fila existente.'
    );
    return;
  }

  row.controls.productName.setValue(product.name, { emitEvent: false });
  row.controls.productId.setValue(product.id, { emitEvent: false });
  row.controls.autocompleteOpen.setValue(false, { emitEvent: false });

  if (!product.serialized) {
    row.controls.serials.setValue([], { emitEvent: false });
  }

  // si serializado, deja botón de gestionar seriales en estado "incompleto"
  this.form.updateValueAndValidity();
}


  productForRow(index: number): Product | null {
    const id = this.rows.at(index).controls.productId.value;
    if (!id) return null;
    return this.productsData.find(p => p.id === id) ?? null;
  }

  // ====== Serial logic ======
  openSerialModal(rowIndex: number): void {
    const product = this.productForRow(rowIndex);
    if (!product?.serialized) return;

    const q = this.rows.at(rowIndex).controls.quantity.value;
    const current = this.rows.at(rowIndex).controls.serials.value ?? [];

    const padded = Array.from({ length: q }, (_, i) => current[i] ?? '');
    this.modalSerials.set(padded);

    this.modalRowIndex.set(rowIndex);
    this.serialModalOpen.set(true);
  }

  closeSerialModal(): void {
    this.serialModalOpen.set(false);
    this.modalRowIndex.set(null);
    this.modalSerials.set([]);
  }

  setModalSerial(index: number, value: string): void {
    const arr = [...this.modalSerials()];
    arr[index] = value;
    this.modalSerials.set(arr);
  }

  handlePasteSerials(event: ClipboardEvent, startIndex: number): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') ?? '';
    const parts = text
      .split(/[\n\t,;]/)
      .map(s => s.trim())
      .filter(Boolean);

    const q = this.modalQuantity();
    const arr = [...this.modalSerials()];

    parts.forEach((serial, i) => {
      const idx = startIndex + i;
      if (idx < q) arr[idx] = serial;
    });

    this.modalSerials.set(arr);
  }

  simulateScan(index: number): void {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const serial = `SN-${timestamp}-${random}`;
    this.setModalSerial(index, serial);
  }

  confirmSerials(): void {
  if (!this.modalComplete()) {
    this.alertSvc.warning(
      'Seriales incompletos',
      'Debes ingresar todos los seriales y sin duplicados.'
    );
    return;
  }

  const rowIdx = this.modalRowIndex();
  if (rowIdx === null) return;

  const row = this.rows.at(rowIdx);
  const productId = row.controls.productId.value;

  if (!productId) {
    this.alertSvc.warning(
      'Producto no seleccionado',
      'Selecciona un producto antes de ingresar seriales.'
    );
    return;
  }

  const serials = this.modalSerials().map(s => s.trim()).filter(Boolean);

  // ✅ validar contra seriales ya existentes en BD para este producto
  const existentes = this.serialesExistentesPorProducto.get(productId) ?? new Set<string>();

  const repetidosEnBD = serials.filter(s => existentes.has(s.toUpperCase()));
  if (repetidosEnBD.length > 0) {
    this.alertSvc.warning(
      'Seriales ya existentes',
      `Estos seriales ya existen para este producto:\n- ${Array.from(new Set(repetidosEnBD)).join('\n- ')}`
    );
    return;
  }

  row.controls.serials.setValue(serials, { emitEvent: false });
  this.form.updateValueAndValidity();
  this.closeSerialModal();
}


  // ====== Validaciones visuales de fila ======
  rowSerialStatus(index: number): 'na' | 'empty' | 'partial' | 'complete' {
    const product = this.productForRow(index);
    if (!product) return 'empty';

    if (!product.serialized) return 'na';

    const q = this.rows.at(index).controls.quantity.value;
    const ser = this.rows.at(index).controls.serials.value ?? [];

    const filled = ser.filter(s => s.trim()).length;
    const complete = ser.length === q && filled === q;

    if (complete) return 'complete';
    if (filled > 0) return 'partial';
    return 'empty';
  }

  isRowIncomplete(index: number): boolean {
    const product = this.productForRow(index);
    if (!product) return false;
    if (!product.serialized) return false;
    return this.rowSerialStatus(index) !== 'complete';
  }

  // ====== Guardar ======
  canSave(): boolean {
    if (this.form.controls.ubicacion.invalid) return false;
    if (this.rows.length === 0) return false;

    for (let i = 0; i < this.rows.length; i++) {
      const product = this.productForRow(i);
      if (!product) return false;

      if (product.serialized) {
        const q = this.rows.at(i).controls.quantity.value;
        const ser = this.rows.at(i).controls.serials.value ?? [];
        if (ser.length !== q || ser.some(s => !s.trim())) return false;
      }
    }
    return true;
  }

  savePurchase(): void {
  if (!this.canSave()) {
    this.alertSvc.warning(
      'Faltan datos',
      'Por favor completa todos los campos requeridos y los seriales de productos serializados.'
    );
    return;
  }

  const idUsuario = Number(localStorage.getItem('idUsuario') ?? '0');
  if (!idUsuario) {
    this.alertSvc.error(
      'Sesión inválida',
      'No se encontró idUsuario en sesión. Vuelve a iniciar sesión.'
    );
    return;
  }

  const idUbicacion = this.form.controls.ubicacion.value;
  if (!idUbicacion) {
    this.alertSvc.warning(
      'Falta ubicación',
      'Selecciona una ubicación.'
    );
    return;
  }

  // ✅ CONFIRMACIÓN
  this.alertSvc.confirm(
    'Confirmar compra',
    'Se registrará la compra con los productos ingresados. ¿Deseas continuar?',
    'Sí, confirmar',
    'Cancelar'
  ).then((confirmed) => {
    if (!confirmed) return;

    const logHttpError = (tag: string, err: any) => {
      console.error(`❌ ${tag}`);
      console.error('status:', err?.status);
      console.error('url:', err?.url);
      console.error('message:', err?.message);
      console.error('err.error:', err?.error);
    };

    const loadingId = this.alertSvc.loading(
      'Guardando compra...',
      'Procesando, por favor espera.'
    );

    const compraPayload: CompraProductoRequest = {
      fechaIngreso: new Date().toISOString(),
      observaciones: (this.form.controls.observaciones.value ?? '').trim(),
      fkUsuario: { idUsuario },
    };

    this.compraService.crear(compraPayload).pipe(
      rx.take(1),

      // 2) detalles
      rx.concatMap((compraResp: any) => {
        const idCompraProducto: number | undefined = compraResp?.idCompraProducto;
        if (!idCompraProducto) throw new Error('CompraProducto no devolvió idCompraProducto');

        const detalleRequests = this.rows.controls.map((r) => {
          const idProducto = r.controls.productId.value;
          if (!idProducto) throw new Error('Fila sin producto seleccionado');

          const cantidad = r.controls.quantity.value;
          const costoUnitario = Number(r.controls.cost.value ?? 0);

          const detallePayload: CompraProductoDetalleRequest = {
            cantidad,
            costoUnitario,
            fkCompraProducto: { idCompraProducto },
            fkProducto: { idProducto },
            fkUbicacion: { idUbicacion },
          };

          return this.compraDetalleService.crear(detallePayload).pipe(
            rx.map((detalleResp: any) => ({ row: r, detalleResp })),
            rx.catchError((err) => {
              logHttpError('POST CompraProductoDetalle', err);
              throw err;
            })
          );
        });

        return forkJoin(detalleRequests).pipe(
          rx.map((detallesCreados) => ({ compraResp, detallesCreados }))
        );
      }),

      // 3) seriales + movimientos
      rx.concatMap(({ compraResp, detallesCreados }: any) => {
        const ops: Observable<any>[] = [];

        for (const item of detallesCreados) {
          const row: RowForm = item.row;
          const detalleResp: any = item.detalleResp;

          const idCompraProductoDetalle: number | undefined =
            detalleResp?.idCompraProductoDetalle;
          if (!idCompraProductoDetalle)
            throw new Error('Detalle no devolvió idCompraProductoDetalle');

          const idProducto = row.controls.productId.value!;
          const product = this.productsData.find(p => p.id === idProducto)!;

          // CON SERIAL
          if (product.serialized) {
            const serials = (row.controls.serials.value ?? [])
              .map(s => s.trim())
              .filter(Boolean);

            for (const serialStr of serials) {
              const serialPayload = {
                serial: serialStr,
                estado: 'Disponible',
                fkProducto: { idProducto },
              };

              ops.push(
                this.productoSerialService.crearProductoSerial(serialPayload).pipe(
                  rx.concatMap((serialResp: any) => {
                    const idProductoSerial: number | undefined =
                      serialResp?.idProductoSerial;
                    if (!idProductoSerial)
                      throw new Error('ProductoSerial no devolvió idProductoSerial');

                    const mov: InventarioMovimiento = {
                      tipo: 'Compra',
                      cantidadEntrada: 1,
                      cantidadSalida: 0,
                      referenciaTipo: 'CompraDetalle',
                      referenciaId: idCompraProductoDetalle,
                      fkProducto: { idProducto },
                      fkProductoSerial: { idProductoSerial },
                      fkUbicacion: { idUbicacion },
                    };

                    return this.inventarioMovimientoService.guardar(mov);
                  }),
                  rx.catchError((err) => {
                    logHttpError('POST ProductoSerial + InventarioMovimiento(serial)', err);
                    throw err;
                  })
                )
              );
            }
          }

          // SIN SERIAL
          else {
            const cantidad = row.controls.quantity.value;

            const mov: InventarioMovimiento = {
              tipo: 'Compra',
              cantidadEntrada: cantidad,
              cantidadSalida: 0,
              referenciaTipo: 'CompraDetalle',
              referenciaId: idCompraProductoDetalle,
              fkProducto: { idProducto },
              fkProductoSerial: null,
              fkUbicacion: { idUbicacion },
            };

            ops.push(
              this.inventarioMovimientoService.guardar(mov).pipe(
                rx.catchError((err) => {
                  logHttpError('POST InventarioMovimiento(no-serial)', err);
                  throw err;
                })
              )
            );
          }
        }

        return (ops.length ? forkJoin(ops) : of([] as any[])).pipe(
          rx.map((results: any[]) => ({ compraResp, results }))
        );
      }),

      rx.catchError((err) => {
        logHttpError('PIPELINE ERROR (compra)', err);

        this.alertSvc.close(loadingId);

        const msg = this.alertSvc.getErrorMessage(err);
        this.alertSvc.error('No se pudo guardar la compra', msg);

        return of(null);
      })
    ).subscribe((finalResp: any) => {
      this.alertSvc.close(loadingId);

      if (!finalResp) return;

      this.alertSvc.success(
        'Compra registrada',
        'La compra se guardó correctamente.'
      );

      // ✅ limpiar UI
      this.resetCompraForm();

      // ✅ refrescar cache de seriales
      this.refreshSerialCacheAfterSave();
    });
  });
}


  // ====== Click afuera ======
  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    const host = this.hostEl().nativeElement;
    const target = ev.target as HTMLElement;

    // Si el click fue fuera del componente, cierra todo
    if (!host.contains(target)) {
      this.closeAutocompleteAll();
      return;
    }

    // Si fue dentro del componente pero fuera de un wrapper de autocomplete, igual cerramos
    if (!target.closest('.nc20-autocomplete-wrapper')) {
      this.closeAutocompleteAll();
    }
  }

  // ====== Internals ======
  private onQuantityChangeForRow(row: RowForm): void {
    const id = row.controls.productId.value;
    if (!id) return;

    const product = this.productsData.find(p => p.id === id);
    if (!product?.serialized) return;

    const q = row.controls.quantity.value;
    const current = row.controls.serials.value ?? [];
    if (current.length !== q) {
      row.controls.serials.setValue([], { emitEvent: false });
    }
  }

  private computeDuplicateIndexes(values: string[]): Set<number> {
    const seen = new Map<string, number[]>();
    values.forEach((raw, idx) => {
      const v = raw.trim();
      if (!v) return;
      const arr = seen.get(v) ?? [];
      arr.push(idx);
      seen.set(v, arr);
    });

    const dupIdx = new Set<number>();
    for (const [, idxs] of seen) {
      if (idxs.length > 1) idxs.forEach(i => dupIdx.add(i));
    }
    return dupIdx;
  }

  private formatNowEc(): string {
    // "es-EC" similar a tu ejemplo (incluyendo hora/min)
    const now = new Date();
    return now.toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  readonly modalIndexes = computed(() =>
    Array.from({ length: this.modalQuantity() }, (_, i) => i)
  );

  rowFilledSerialsCount(rowIndex: number): number {
    const row = this.rows.at(rowIndex);
    const serials = row.controls.serials.value ?? [];
    let count = 0;
    for (const s of serials) {
      if ((s ?? '').trim()) count++;
    }
    return count;
  }

  private loadSerialesExistentes(): void {
    this.productoSerialService.listarProductosSerial().pipe(
      rx.take(1)
    ).subscribe({
      next: (data: ProductoSerial[]) => {
        this.serialesExistentesPorProducto.clear();

        for (const s of (data ?? [])) {
          const pid = s.idProducto;
          const serial = (s.serial ?? '').trim();
          if (!pid || !serial) continue;

          const set = this.serialesExistentesPorProducto.get(pid) ?? new Set<string>();
          set.add(serial.toUpperCase());
          this.serialesExistentesPorProducto.set(pid, set);
        }
      },
      error: (err) => {
        console.error('Error cargando seriales existentes', err);
        this.serialesExistentesPorProducto.clear();
      }
    });
  }

  private resetCompraForm(): void {
    // 1) cerrar modal por si quedó abierto
    this.closeSerialModal();

    // 2) limpiar filas
    this.rows.clear();

    // 3) resetear campos editables
    this.form.controls.ubicacion.setValue(null);
    this.form.controls.observaciones.setValue('');

    // 4) refrescar fecha
    this.form.controls.fecha.setValue(this.formatNowEc());

    // 5) (opcional) dejar 1 fila lista para seguir agregando
    // this.addProductRow();

    // 6) limpiar dropdowns
    this.closeAutocompleteAll();

    // 7) revalidar
    this.form.updateValueAndValidity();
  }

  private refreshSerialCacheAfterSave(): void {
    this.loadSerialesExistentes();
  }

}
