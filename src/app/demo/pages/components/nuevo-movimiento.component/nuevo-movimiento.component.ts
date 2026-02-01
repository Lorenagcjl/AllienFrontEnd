import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { take } from 'rxjs';
import { ProductoSerialService } from 'src/app/@theme/services/producto-serial.service';
import { ProductoService } from 'src/app/@theme/services/producto.service';
import { UbicacionService } from 'src/app/@theme/services/ubicacion.service';
import { ProductoSerial } from 'src/app/demo/models/producto-serial.model';
import { Producto } from 'src/app/demo/models/producto.model';
import { Ubicacion } from 'src/app/demo/models/ubicacion.model';


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

    this.form.controls.origen.valueChanges.subscribe(o => {
      const d = this.form.controls.destino.value;
      if (o != null && d != null && o === d) this.form.controls.destino.setValue(null);
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

  removeProductRow(index: number): void {
    this.productsFA.removeAt(index);
    if (this._modalRowIndex() === index) this.closeSerialModal();
    const m = this._modalRowIndex();
    if (m !== null && m > index) this._modalRowIndex.set(m - 1);
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
      alert('Este producto ya fue agregado. Ajusta la cantidad en la fila existente.');
      return;
    }

    const row = this.productsFA.at(index);
    row.controls.productQuery.setValue(product.nombre);
    row.controls.productId.setValue(product.idProducto);
    row.controls.serials.setValue([]);

    this.closeAutocomplete();
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
    if (!product?.esConSerial || productId == null) return;

    const allDisponibles = this.getSerialesDisponibles(productId);
    const usados = this.serialesUsadosPorProducto(productId, index);

    const serialsParaModal = allDisponibles.filter(s => !usados.has(s));

    this._modalRowIndex.set(index);
    this._modalSerials.set(serialsParaModal);

    const existing = row.controls.serials.value ?? [];
    // OJO: si “existing” tenía alguno que ahora está en usados (porque lo agarró otra fila),
    // lo limpiamos:
    const limpio = existing.filter(s => !usados.has(s));
    row.controls.serials.setValue(limpio);

    this._modalSelected.set(new Set(limpio));
    this._modalOpen.set(true);
  }

  toggleSerial(serial: string): void {
    const idx = this._modalRowIndex();
    if (idx === null) return;

    const row = this.productsFA.at(idx);
    const productoId = row.controls.productId.value;
    if (productoId == null) return;

    const usados = this.serialesUsadosPorProducto(productoId, idx);
    if (usados.has(serial)) {
      alert('Ese serial ya fue seleccionado en otra fila para este producto.');
      return;
    }

    const required = this.modalRequiredCount();
    const set = new Set(this._modalSelected());

    if (set.has(serial)) {
      set.delete(serial);
    } else {
      if (set.size >= required) {
        alert(`Solo puedes seleccionar ${required} seriales`);
        return;
      }
      set.add(serial);
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
      alert(`Debes seleccionar exactamente ${required} seriales. Actualmente: ${selected.length}`);
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
  saveMovement(): void {
    this.form.markAllAsTouched();

    // validación origen/destino
    if (this.locationError()) {
      alert('Por favor corrige los errores en las ubicaciones');
      return;
    }
    if (this.form.controls.origen.invalid || this.form.controls.destino.invalid) {
      alert('Debes seleccionar origen y destino');
      return;
    }

    // debe existir al menos un producto
    if (this.productsFA.length === 0) {
      alert('Debes agregar al menos un producto');
      return;
    }

    // validar filas
    for (let i = 0; i < this.productsFA.length; i++) {
      const row = this.productsFA.at(i);
      const pid = row.controls.productId.value;
      const product = this.findProduct(pid);

      if (!product) {
        alert('Completa todos los productos');
        return;
      }

      const qty = row.controls.quantity.value;
      if (qty < 1) {
        alert('La cantidad debe ser mayor o igual a 1');
        return;
      }

      if (product.esConSerial) {
        const serials = row.controls.serials.value ?? [];
        if (serials.length !== qty) {
          alert(`Debes seleccionar seriales para: ${product.nombre}`);
          return;
        }
      }

    }

    const payload = {
      origen: this.form.controls.origen.value,
      destino: this.form.controls.destino.value,
      tipo: this.form.controls.tipo.value,
      observaciones: this.form.controls.observaciones.value,
      items: this.productsFA.controls.map((r) => ({
        productId: r.controls.productId.value!,
        quantity: r.controls.quantity.value,
        serials: r.controls.serials.value,
      })),
    };

    alert('✓ Movimiento guardado correctamente');
    console.log('Datos del movimiento:', payload);
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

}
