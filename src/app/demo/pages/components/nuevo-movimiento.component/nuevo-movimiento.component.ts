import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, concatMap, forkJoin, map, Observable, of, take } from 'rxjs';
import { InventarioMovimientoService } from 'src/app/@theme/services/inventariomovimiento.service';
import { MovimientoDetalleService } from 'src/app/@theme/services/movimiento-detalle.service';
import { MovimientoSeriesService } from 'src/app/@theme/services/movimiento-series.service';
import { MovimientoService } from 'src/app/@theme/services/movimiento.service';
import { ProductoSerialService } from 'src/app/@theme/services/producto-serial.service';
import { ProductoService } from 'src/app/@theme/services/producto.service';
import { UbicacionService } from 'src/app/@theme/services/ubicacion.service';
import { InventarioMovimiento } from 'src/app/demo/models/inventariomovimiento.model';
import { ProductoSerial } from 'src/app/demo/models/producto-serial.model';
import { Producto } from 'src/app/demo/models/producto.model';
import { Ubicacion } from 'src/app/demo/models/ubicacion.model';
import { AlertService } from 'src/app/@theme/services/alert.service';

type MovementType = 'traslado' | 'ajuste' | 'devolucion';

export interface ProductoSerialMovDto {
  idProductoSerial: number;
  productoId: number;   // ✅ siempre consistente
  serial: string;
  estado: string;
}


type ProductRowForm = FormGroup<{
  productQuery: FormControl<string>;
  productId: FormControl<number | null>;
  quantity: FormControl<number>;
  serials: FormControl<string[]>;
}>;

type EstadoSerial = 'Disponible' | 'Vendido' | 'Dañado';



@Component({
  selector: 'app-nuevo-movimiento.component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './nuevo-movimiento.component.html',
  styleUrl: './nuevo-movimiento.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export default class NuevoMovimientoComponent {
  private alertSvc = inject(AlertService);
  private readonly movimientoService = inject(MovimientoService);
  private readonly movimientoDetalleService = inject(MovimientoDetalleService);
  private readonly movimientoSeriesService = inject(MovimientoSeriesService);
  private readonly inventarioMovimientoService = inject(InventarioMovimientoService);
private readonly cdr = inject(ChangeDetectorRef);
  private readonly ubicacionService = inject(UbicacionService);
  private readonly productoService = inject(ProductoService);
  private readonly productoSerialService = inject(ProductoSerialService);
  // ===== Datos demo (reemplaza con tu servicio/API) =====
  readonly ubicaciones = signal<Ubicacion[]>([]);
  readonly ubicacionesLoading = signal<boolean>(false);
  readonly ubicacionesError = signal<string | null>(null);

  readonly productos = signal<Producto[]>([]);
  readonly productosLoading = signal(false);
  readonly productosError = signal<string | null>(null);

  readonly seriales = signal<ProductoSerial[]>([]);
  readonly serialesLoading = signal(false);
  readonly serialesError = signal<string | null>(null);

  // cache simple: para no recalcular siempre (opcional)
  private readonly serialesPorProducto = new Map<number, string[]>();

  // cache kardex
  private kardexCache: InventarioMovimiento[] = [];

  // stock por (producto|ubicacion)
  private stockByPU = new Map<string, number>();

  // para UI en tabla
  readonly stockLabelByRow = signal<Record<number, string>>({});


  // ===== Form =====
  readonly form = this.fb.group({
    origen: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    destino: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    tipo: this.fb.control<MovementType>('traslado'),
    observaciones: this.fb.control<string>(''),
    products: this.fb.array<ProductRowForm>([]),
  });

  get productsFA(): FormArray<ProductRowForm> {
    return this.form.controls.products;
  }

  // ===== UI state (signals) =====
  private readonly _openAutocompleteIndex = signal<number | null>(null);
  private readonly _modalOpen = signal(false);
  private readonly _modalRowIndex = signal<number | null>(null);
  private readonly _modalSerials = signal<string[]>([]);
  private readonly _modalSelected = signal<Set<string>>(new Set());

  readonly isModalOpen = computed(() => this._modalOpen());
  readonly modalSerials = computed(() => this._modalSerials());
  readonly modalSelectedCount = computed(() => this._modalSelected().size);

  readonly modalRequiredCount = computed(() => {
    const idx = this._modalRowIndex();
    if (idx === null) return 0;
    return this.productsFA.at(idx).controls.quantity.value ?? 0;
  });

  readonly modalProductName = computed(() => {
    const idx = this._modalRowIndex();
    if (idx === null) return '-';
    const pid = this.productsFA.at(idx).controls.productId.value;
    const p = this.findProduct(pid);
    return p?.nombre ?? '-';
  });

  // ===== Validación origen/destino no iguales =====
  readonly locationError = computed(() => {
    const o = this.form.controls.origen.value;
    const d = this.form.controls.destino.value;
    if (o != null && d != null && o === d) return 'El origen y destino no pueden ser iguales';
    return null;
  });

  constructor(private readonly fb: FormBuilder) {
    this.cargarUbicaciones();
    this.cargarProductos();
    this.cargarSeriales();

    this.form.controls.origen.valueChanges.subscribe((o) => {
      const d = this.form.controls.destino.value;
      if (o != null && d != null && o === d) this.form.controls.destino.setValue(null);

      // ✅ limpiar selección previa (porque cambió el origen)
      for (let i = 0; i < this.productsFA.length; i++) {
        const r = this.productsFA.at(i);
        r.controls.serials.setValue([], { emitEvent: false });

        // si alguna cantidad estaba deshabilitada por stock=0, la vuelves a habilitar
        if (r.controls.quantity.disabled) {
          r.controls.quantity.enable({ emitEvent: false });
          if ((r.controls.quantity.value ?? 0) <= 0) {
            r.controls.quantity.setValue(1, { emitEvent: false });
          }
        }
      }

      if (o != null) {
        this.revalidateAllRowsAgainstStock(o);
      } else {
        this.stockLabelByRow.set({});
      }
    });

    this.form.controls.destino.valueChanges.subscribe(d => {
      const o = this.form.controls.origen.value;
      if (o != null && d != null && o === d) this.form.controls.origen.setValue(null);
    });
  }

  private cargarUbicaciones(): void {
    this.ubicacionesLoading.set(true);
    this.ubicacionesError.set(null);

    this.ubicacionService.listarUbicaciones().pipe(take(1)).subscribe({
      next: (data: Ubicacion[]) => {
        // ✅ opcional pero recomendado: quita las que no tengan id
        const limpio = (data ?? []).filter(u => u.idUbicacion != null);
        this.ubicaciones.set(limpio);
        this.ubicacionesLoading.set(false);
      },
      error: () => {
        this.ubicacionesError.set('No se pudieron cargar las ubicaciones.');
        this.ubicacionesLoading.set(false);
      },
    });
  }

  private cargarProductos(): void {
    this.productosLoading.set(true);
    this.productosError.set(null);

    this.productoService.listarProductos().pipe(take(1)).subscribe({
      next: (data: Producto[]) => {
        this.productos.set(data ?? []);
        this.productosLoading.set(false);
      },
      error: () => {
        this.productosError.set('No se pudieron cargar los productos.');
        this.productosLoading.set(false);
      },
    });
  }

  private cargarSeriales(): void {
    this.serialesLoading.set(true);
    this.serialesError.set(null);

    this.productoSerialService.listarProductosSerial().pipe(take(1)).subscribe({
      next: (data: ProductoSerial[]) => {
        console.log('[SERIALES RAW] length:', data?.length);
        console.log('[SERIALES RAW sample0]', data?.[0]);
        console.log('[SERIALES RAW keys0]', data?.[0] ? Object.keys(data[0] as any) : 'no data');

        const mapped: ProductoSerialMovDto[] = (data ?? [])
          .map((s, idx) => {
            const anyS = s as any;

            // ✅ En tu API: fkProducto es objeto y el id está en fkProducto.idProducto
            const fk = anyS.fkProducto;

            const productoId =
              (fk && typeof fk === 'object' && typeof fk.idProducto === 'number'
                ? fk.idProducto
                : null);

            const idProductoSerial =
              (typeof anyS.idProductoSerial === 'number' ? anyS.idProductoSerial : null);

            const serial = (typeof anyS.serial === 'string' ? anyS.serial : null);
            const estado = (typeof anyS.estado === 'string' ? anyS.estado : '');

            if (idx < 10) {
              console.log('[MAP ITEM]', {
                idx,
                fkProductoType: typeof fk,
                fkIdProducto: fk?.idProducto,
                productoId,
                idProductoSerial,
                serial,
                estado,
                estadoNorm: this.normalizeEstadoSerial(estado),
              });
            }

            if (productoId == null || idProductoSerial == null || serial == null) return null;

            return { idProductoSerial, productoId, serial, estado };
          })
          .filter((x): x is ProductoSerialMovDto => x !== null);

        console.log('[SERIALES MAPPED] length:', mapped.length);
        console.log('[SERIALES MAPPED sample]', mapped.slice(0, 20));

        // ✅ Este es el dataset que usa tu modal (getSerialesDisponibles)
        this.serialesMov.set(mapped);

        // limpiar cache por si recargaste
        this.serialesPorProducto.clear();

        this.serialesLoading.set(false);
      },
      error: (err) => {
        console.error('[API productoSerial] error:', err);
        this.serialesError.set('No se pudieron cargar los seriales.');
        this.serialesLoading.set(false);
      },
    });
  }


  readonly serialesMov = signal<ProductoSerialMovDto[]>([]);

  /**
   * Retorna lista de seriales para producto, filtrando por estado.
   * Ajusta los estados válidos a los que uses en tu BD: "DISPONIBLE", "ACTIVO", etc.
   */
  private normalizeEstadoSerial(raw: string | null | undefined): EstadoSerial | null {
    const v = (raw ?? '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    // Mapear variantes del backend -> tus 3 estados
    if (v === 'DISPONIBLE' || v === 'DISPONIBLE ' || v === 'EN_STOCK') return 'Disponible';
    if (v === 'VENDIDO') return 'Vendido';
    if (v === 'DANADO' || v === 'DAÑADO') return 'Dañado';

    // Si en tu backend existe ACTIVO y quieres tratarlo como disponible:
    if (v === 'ACTIVO') return 'Disponible';

    // si llega algo desconocido
    return null;
  }

  private uniqueStrings(list: string[]): string[] {
    return Array.from(new Set(list));
  }

  private getSerialesDisponibles(productoId: number): string[] {
    const cached = this.serialesPorProducto.get(productoId);
    if (cached) return cached;

    const list = this.serialesMov()
      .filter(s => s.productoId === productoId)
      .filter(s => this.normalizeEstadoSerial(s.estado) === 'Disponible')
      .map(s => s.serial);

    const unique = this.uniqueStrings(list);
    this.serialesPorProducto.set(productoId, unique);
    return unique;
  }

  // ===== Helpers =====
  trackByIndex = (i: number) => i;
  trackBySerial = (_: number, serial: string) => serial;

  // ✅ trackBy para ubicaciones (mejor performance)
  trackByUbicacionId = (index: number, u: Ubicacion) => u.idUbicacion ?? index;

  private createRow(): ProductRowForm {
    return this.fb.group({
      productQuery: this.fb.control<string>('', { nonNullable: true }),
      productId: this.fb.control<number | null>(null),
      quantity: this.fb.control<number>(1, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)],
      }),
      serials: this.fb.control<string[]>([], { nonNullable: true }),
    });
  }

  findProduct(productId: number | null): Producto | undefined {
    if (!productId) return undefined;
    return this.productos().find(p => p.idProducto === productId);
  }

  // ===== Acciones tabla =====
  addProductRow(): void {
    this.productsFA.push(this.createRow());
  }

 async removeProductRow(index: number): Promise<void> {
  const ok = await this.alertSvc.confirm(
    'Quitar producto',
    '¿Deseas eliminar este producto del movimiento?',
    'Sí, quitar',
    'Cancelar'
  );
  if (!ok) return;

  // cerrar modal antes si corresponde
  const m = this._modalRowIndex();
  if (m === index) this.closeSerialModal();

  // ✅ ejecuta el remove
  this.productsFA.removeAt(index);

  // ajustar índice del modal
  if (m !== null && m > index) this._modalRowIndex.set(m - 1);

  // ✅ si estás en OnPush, fuerza repaint
  this.cdr.detectChanges();
}

  // ===== Autocomplete =====
  openAutocomplete(index: number): void {
    this._openAutocompleteIndex.set(index);
  }
  closeAutocomplete(): void {
    this._openAutocompleteIndex.set(null);
  }
  isAutocompleteOpen(index: number): boolean {
    return this._openAutocompleteIndex() === index;
  }

  filteredProducts(index: number): Producto[] {
    const q = (this.productsFA.at(index).controls.productQuery.value || '').toLowerCase().trim();
    if (!q) return [];

    // si quieres obligar a seleccionar origen antes de buscar, descomenta:
    // if (this.form.controls.origen.value == null) return [];

    return this.productos()
      .filter(p => (p.nombre ?? '').toLowerCase().includes(q))
      .slice(0, 15); // limita resultados (opcional)
  }

  selectProduct(index: number, product: Producto): void {
  const yaExiste = this.productsFA.controls.some((r, i) =>
    i !== index && r.controls.productId.value === product.idProducto
  );

  if (yaExiste) {
    this.alertSvc.warning(
      'Producto repetido',
      'Este producto ya fue agregado. Ajusta la cantidad en la fila existente.'
    );
    return;
  }

  const row = this.productsFA.at(index);
  row.controls.productQuery.setValue(product.nombre);
  row.controls.productId.setValue(product.idProducto);
  row.controls.serials.setValue([]);

  this.closeAutocomplete();
  this.applyStockValidationToRow(index);
}

  // ===== Cantidad / stock =====
  onQuantityChanged(index: number): void {
    const row = this.productsFA.at(index);
    const pid = row.controls.productId.value;
    const product = this.findProduct(pid);
    if (!product) return;

    const qty = row.controls.quantity.value;

    if (product.esConSerial) {
      const current = row.controls.serials.value ?? [];
      if (current.length > qty) row.controls.serials.setValue(current.slice(0, qty));
    }
    this.applyStockValidationToRow(index);
  }

  // ===== Seriales =====
  canOpenSerialModal(index: number): boolean {
    const row = this.productsFA.at(index);
    const product = this.findProduct(row.controls.productId.value);
    return !!product?.esConSerial;
  }

  openSerialModal(index: number): void {
  const row = this.productsFA.at(index);
  const productId = row.controls.productId.value;
  const product = this.findProduct(productId);

  const origen = this.form.controls.origen.value;
  if (!origen) {
    this.alertSvc.warning(
      'Falta ubicación',
      'Selecciona ubicación de origen primero.'
    );
    return;
  }

  if (!product?.esConSerial || productId == null) return;

  const allDisponibles = this.getSerialesDisponibles(productId);
  const usados = this.serialesUsadosPorProducto(productId, index);

  forkJoin(
    allDisponibles.map(serial =>
      this.inventarioMovimientoService.buscarPorSerial(serial).pipe(
        take(1),
        map(movs => {
          const last = [...(movs ?? [])].sort((a, b) => {
            const da = new Date(a?.fecha ?? 0).getTime();
            const db = new Date(b?.fecha ?? 0).getTime();
            if (da !== db) return db - da;
            return (b?.idInventarioMovimiento ?? 0) - (a?.idInventarioMovimiento ?? 0);
          })[0];

          const idUb = last?.fkUbicacion?.idUbicacion ?? 0;
          return { serial, idUb };
        }),
        catchError(() => of({ serial, idUb: 0 }))
      )
    )
  ).pipe(take(1)).subscribe(pairs => {
    const serialsEnOrigen = pairs
      .filter(x => x.idUb === origen)
      .map(x => x.serial);

    const serialsParaModal = serialsEnOrigen.filter(s => !usados.has(s));

    this._modalRowIndex.set(index);
    this._modalSerials.set(serialsParaModal);

    const existing = row.controls.serials.value ?? [];
    const limpio = existing.filter(s => serialsParaModal.includes(s));
    row.controls.serials.setValue(limpio);

    this._modalSelected.set(new Set(limpio));
    this._modalOpen.set(true);
  });
}

  toggleSerial(serial: string, ev: Event): void {
  const input = ev.target as HTMLInputElement;
  const next = input.checked;

  const idx = this._modalRowIndex();
  if (idx === null) {
    input.checked = false;
    return;
  }

  const row = this.productsFA.at(idx);
  const productoId = row.controls.productId.value;
  if (productoId == null) {
    input.checked = false;
    return;
  }

  const usados = this.serialesUsadosPorProducto(productoId, idx);
  if (usados.has(serial)) {
    this.alertSvc.warning(
      'Serial duplicado',
      'Ese serial ya fue seleccionado en otra fila para este producto.'
    );
    input.checked = false; // ✅ revierte el check
    return;
  }

  const required = this.modalRequiredCount();
  const set = new Set(this._modalSelected());

  if (next) {
    if (set.size >= required) {
      this.alertSvc.warning(
        'Límite de seriales',
        `Solo puedes seleccionar ${required} seriales`
      );
      input.checked = false; // ✅ revierte el check
      return;
    }
    set.add(serial);
  } else {
    set.delete(serial);
  }

  this._modalSelected.set(set);
}

  isSerialSelected(serial: string): boolean {
    return this._modalSelected().has(serial);
  }

  confirmSerials(): void {
  const idx = this._modalRowIndex();
  if (idx === null) return;

  const required = this.modalRequiredCount();
  const selected = Array.from(this._modalSelected());

  if (selected.length !== required) {
    this.alertSvc.warning(
      'Seriales incompletos',
      `Debes seleccionar exactamente ${required} seriales. Actualmente: ${selected.length}`
    );
    return;
  }

  this.productsFA.at(idx).controls.serials.setValue(selected);
  this.closeSerialModal();
}

  closeSerialModal(): void {
    this._modalOpen.set(false);
    this._modalRowIndex.set(null);
    this._modalSerials.set([]);
    this._modalSelected.set(new Set());
  }

  // ===== Guardar =====
  async saveMovement(): Promise<void> {
  this.form.markAllAsTouched();

  if (this.locationError()) {
    await this.alertSvc.warning(
      'Ubicaciones inválidas',
      'Por favor corrige los errores en las ubicaciones'
    );
    return;
  }

  if (this.form.controls.origen.invalid || this.form.controls.destino.invalid) {
    await this.alertSvc.warning(
      'Ubicaciones requeridas',
      'Debes seleccionar origen y destino'
    );
    return;
  }

  if (this.productsFA.length === 0) {
    await this.alertSvc.warning(
      'Sin productos',
      'Debes agregar al menos un producto'
    );
    return;
  }

  // validar filas
  for (let i = 0; i < this.productsFA.length; i++) {
    const row = this.productsFA.at(i);
    const pid = row.controls.productId.value;
    const product = this.findProduct(pid);

    if (!product) {
      await this.alertSvc.warning(
        'Producto incompleto',
        'Completa todos los productos'
      );
      return;
    }

    const qty = row.controls.quantity.value;
    if (qty < 1) {
      await this.alertSvc.warning(
        'Cantidad inválida',
        'La cantidad debe ser mayor o igual a 1'
      );
      return;
    }

    if (product.esConSerial) {
      const serials = row.controls.serials.value ?? [];
      if (serials.length !== qty) {
        await this.alertSvc.warning(
          'Seriales incompletos',
          `Debes seleccionar seriales para: ${product.nombre}`
        );
        return;
      }
    }
  }

  // ✅ CONFIRMACIÓN (igual a confirmSale)
  const confirmed = await this.alertSvc.confirm(
    'Confirmar movimiento',
    'Se registrará el movimiento de inventario. ¿Deseas continuar?',
    'Sí, confirmar',
    'Cancelar'
  );
  if (!confirmed) return;

  const idUsuario = Number(localStorage.getItem('idUsuario') ?? '0');
  if (!idUsuario) {
    await this.alertSvc.error(
      'Sesión inválida',
      'No se encontró idUsuario en sesión. Vuelve a iniciar sesión.'
    );
    return;
  }

  const idUbOrigen = this.form.controls.origen.value!;
  const idUbDestino = this.form.controls.destino.value!;
  const tipo = this.form.controls.tipo.value ?? 'traslado';
  const observaciones = (this.form.controls.observaciones.value ?? '').trim();

  const logHttpError = (tag: string, err: any) => {
    console.error(`❌ ${tag}`);
    console.error('status:', err?.status);
    console.error('url:', err?.url);
    console.error('message:', err?.message);
    console.error('err.error:', err?.error);
  };

  // 1) MOVIMIENTO (cabecera)
  const movPayload = {
    tipo: (tipo ?? 'traslado').toUpperCase(),
    observaciones,
    idUsuario,
    idUbicacionOrigen: idUbOrigen,
    idUbicacionDestino: idUbDestino,
  };

  this.movimientoService.crear(movPayload as any).pipe(
    take(1),

    // 2) DETALLES
    concatMap((movResp: any) => {
      const idMovimiento = movResp?.idMovimiento;
      if (!idMovimiento) throw new Error('Movimiento no devolvió idMovimiento');

      const detalleRequests = this.productsFA.controls.map((r) => {
        const pid = r.controls.productId.value!;
        const qty = r.controls.quantity.value;

        const detallePayload: any = {
          cantidad: qty,
          fkMovimiento: { idMovimiento },
          fkProducto: { idProducto: pid },
        };

        return this.movimientoDetalleService.crear(detallePayload).pipe(
          map((detalleResp: any) => {
            const idMovimientoDetalle = detalleResp?.idMovimientoDetalle;
            if (!idMovimientoDetalle) {
              throw new Error('MovimientoDetalle no devolvió idMovimientoDetalle');
            }

            return {
              row: r,
              idMovimientoDetalle,
              idProducto: pid,
              cantidad: qty,
            };
          }),
          catchError((err) => {
            logHttpError('POST MovimientoDetalle', err);
            throw err;
          })
        );
      });

      return forkJoin(detalleRequests).pipe(
        map((detallesCreados) => ({ movResp, detallesCreados }))
      );
    }),

    // 3) SERIAL + KARDEX
    concatMap(({ detallesCreados }: any) => {
      const ops: Observable<any>[] = [];

      for (const item of detallesCreados) {
        const row = item.row as ProductRowForm;
        const idMovimientoDetalle = item.idMovimientoDetalle as number;
        const idProducto = item.idProducto as number;
        const cantidad = item.cantidad as number;

        const product = this.findProduct(idProducto);
        if (!product) throw new Error('Producto no encontrado al procesar detalle');

        if (product.esConSerial) {
          const serials = (row.controls.serials.value ?? [])
            .map(s => (s ?? '').trim())
            .filter(Boolean);

          for (const serialStr of serials) {
            const serialObj = this.serialesMov().find(
              s => s.serial === serialStr && s.productoId === idProducto
            );
            if (!serialObj) {
              throw new Error(`No encontré idProductoSerial para serial: ${serialStr}`);
            }

            const detalleSerialPayload: any = {
              idMovimientoDetalle,
              fkProductoSerial: { idProductoSerial: serialObj.idProductoSerial },
            };

            const [movOut, movIn] = this.buildKardexTrasladoSerial({
              idMovimientoDetalle,
              idProducto,
              idProductoSerial: serialObj.idProductoSerial,
              idUbOrigen,
              idUbDestino,
            });

            const op$ = this.movimientoSeriesService.crearMovimientoSeries(detalleSerialPayload).pipe(
              concatMap(() =>
                this.inventarioMovimientoService.buscarPorSerial(serialStr).pipe(take(1))
              ),
              concatMap((movs) => {
                const last = [...(movs ?? [])].sort((a, b) => {
                  const da = new Date(a?.fecha ?? 0).getTime();
                  const db = new Date(b?.fecha ?? 0).getTime();
                  if (da !== db) return db - da;
                  return (b?.idInventarioMovimiento ?? 0) - (a?.idInventarioMovimiento ?? 0);
                })[0];

                const ubActual = last?.fkUbicacion?.idUbicacion ?? 0;
                if (ubActual !== idUbOrigen) {
                  throw new Error(
                    `El serial ${serialStr} no está en el origen. Actual: ${ubActual}, Origen: ${idUbOrigen}`
                  );
                }

                return this.inventarioMovimientoService.guardar(movOut);
              }),
              concatMap(() => this.inventarioMovimientoService.guardar(movIn)),
              catchError((err) => {
                logHttpError('OP Serial Traslado (detalleSerial + kardex)', err);
                throw err;
              })
            );

            ops.push(op$);
          }
        } else {
          const [movOut, movIn] = this.buildKardexTrasladoNoSerial({
            idMovimientoDetalle,
            idProducto,
            cantidad,
            idUbOrigen,
            idUbDestino,
          });

          ops.push(
            this.inventarioMovimientoService.obtenerStock(idProducto, idUbOrigen).pipe(
              take(1),
              concatMap(() => this.inventarioMovimientoService.guardar(movOut)),
              concatMap(() => this.inventarioMovimientoService.guardar(movIn)),
              catchError((err) => {
                logHttpError('OP No-Serial Traslado (kardex)', err);
                throw err;
              })
            )
          );
        }
      }

      return (ops.length ? forkJoin(ops) : of([]));
    }),

    catchError((err) => {
      logHttpError('PIPELINE ERROR (movimiento)', err);

      if (err?.status === 409) {
        this.alertSvc.error('Conflicto de stock', err?.error?.message ?? err?.message);
      } else {
        this.alertSvc.error(
          'Error',
          'Error guardando movimiento. Revisa consola / backend.'
        );
      }
      return of(null);
    })
  ).subscribe((finalResp) => {
    if (!finalResp) return;

    this.alertSvc.success(
      'Movimiento guardado',
      'Movimiento guardado correctamente'
    );

    this.cancel();
    this.cargarSeriales();
  });
}

  cancel(): void {
    // ajusta a tu navegación real
    this.form.reset({ tipo: 'traslado' });
    this.productsFA.clear();
    this.closeAutocomplete();
    this.closeSerialModal();
  }

  private serialesUsadosPorProducto(productoId: number, excludeRowIndex: number): Set<string> {
    const used = new Set<string>();

    for (let i = 0; i < this.productsFA.length; i++) {
      if (i === excludeRowIndex) continue;

      const row = this.productsFA.at(i);
      if (row.controls.productId.value !== productoId) continue;

      for (const s of (row.controls.serials.value ?? [])) {
        used.add(s);
      }
    }

    return used;
  }



  private buildKardexTrasladoSerial(args: {
    idMovimientoDetalle: number;
    idProducto: number;
    idProductoSerial: number;
    idUbOrigen: number;
    idUbDestino: number;
  }) {
    const base = {
      tipo: 'Traslado' as const,
      referenciaTipo: 'MovimientoDetalle' as const,
      referenciaId: args.idMovimientoDetalle,
      fkProducto: { idProducto: args.idProducto },
      fkProductoSerial: { idProductoSerial: args.idProductoSerial },
    };

    return [
      { ...base, cantidadEntrada: 0, cantidadSalida: 1, fkUbicacion: { idUbicacion: args.idUbOrigen } },
      { ...base, cantidadEntrada: 1, cantidadSalida: 0, fkUbicacion: { idUbicacion: args.idUbDestino } },
    ];
  }

  private buildKardexTrasladoNoSerial(args: {
    idMovimientoDetalle: number;
    idProducto: number;
    cantidad: number;
    idUbOrigen: number;
    idUbDestino: number;
  }) {
    const base = {
      tipo: 'Traslado' as const,
      referenciaTipo: 'MovimientoDetalle' as const,
      referenciaId: args.idMovimientoDetalle,
      fkProducto: { idProducto: args.idProducto },
      fkProductoSerial: null,
    };

    return [
      { ...base, cantidadEntrada: 0, cantidadSalida: args.cantidad, fkUbicacion: { idUbicacion: args.idUbOrigen } },
      { ...base, cantidadEntrada: args.cantidad, cantidadSalida: 0, fkUbicacion: { idUbicacion: args.idUbDestino } },
    ];
  }

  private refreshStockFromKardex(idUbicacionOrigen: number): void {
    this.inventarioMovimientoService.listar().pipe(
      take(1),
      catchError((err) => {
        console.error('Error cargando kardex', err);
        return of([] as InventarioMovimiento[]);
      })
    ).subscribe((movs) => {
      this.kardexCache = movs ?? [];
      this.rebuildStockMap(idUbicacionOrigen);
      this.revalidateAllRowsAgainstStock(idUbicacionOrigen);
    });
  }

  private keyPU(idProducto: number, idUbicacion: number) {
    return `${idProducto}|${idUbicacion}`;
  }

  private rebuildStockMap(idUbicacionOrigen: number): void {
    this.stockByPU.clear();

    for (const m of (this.kardexCache ?? [])) {
      const idProducto = (m as any)?.fkProducto?.idProducto;
      const idUb = (m as any)?.fkUbicacion?.idUbicacion;

      if (!idProducto || !idUb) continue;
      if (idUb !== idUbicacionOrigen) continue;

      const entrada = Number((m as any)?.cantidadEntrada ?? 0);
      const salida = Number((m as any)?.cantidadSalida ?? 0);

      const k = this.keyPU(idProducto, idUb);
      const prev = this.stockByPU.get(k) ?? 0;
      this.stockByPU.set(k, prev + entrada - salida);
    }
  }

  private getStockDisponible(idProducto: number, idUbicacion: number): number {
    return Math.max(0, this.stockByPU.get(this.keyPU(idProducto, idUbicacion)) ?? 0);
  }

  private applyStockValidationToRow(index: number): void {
    const idUb = this.form.controls.origen.value;
    if (!idUb) return;

    const row = this.productsFA.at(index);
    const pid = row.controls.productId.value;
    const product = this.findProduct(pid);
    if (!product || !pid) return;

    // serial se valida por ubicación en el modal
    if (product.esConSerial) {
      this.setRowStockLabel(index, 'Serial');
      return;
    }

    this.inventarioMovimientoService.obtenerStock(pid, idUb).pipe(take(1)).subscribe({
      next: (stock) => {
        const s = Math.max(0, Number(stock ?? 0));
        this.setRowStockLabel(index, String(s));

        if (s <= 0) {
          row.controls.quantity.setValue(0, { emitEvent: false });
          row.controls.quantity.disable({ emitEvent: false });
          row.controls.quantity.setValidators([Validators.required, Validators.max(0)]);
          row.controls.quantity.updateValueAndValidity({ emitEvent: false });
          return;
        }

        row.controls.quantity.enable({ emitEvent: false });
        row.controls.quantity.setValidators([Validators.required, Validators.min(1), Validators.max(s)]);
        row.controls.quantity.updateValueAndValidity({ emitEvent: false });

        const qty = row.controls.quantity.value ?? 1;
        if (qty > s) {
          row.controls.quantity.setValue(s, { emitEvent: false });
          this.alertSvc.warning(
            'Stock insuficiente',
            `Stock insuficiente en origen. Disponible: ${s}`
          );
        }
      },
      error: () => {
        this.setRowStockLabel(index, '0');
        row.controls.quantity.setValue(0, { emitEvent: false });
        row.controls.quantity.disable({ emitEvent: false });
      }
    });
  }


  private setRowStockLabel(index: number, label: string) {
    const current = this.stockLabelByRow();
    this.stockLabelByRow.set({ ...current, [index]: label });
  }

  private revalidateAllRowsAgainstStock(idUb: number): void {
    for (let i = 0; i < this.productsFA.length; i++) {
      this.applyStockValidationToRow(i);
    }
  }

}
