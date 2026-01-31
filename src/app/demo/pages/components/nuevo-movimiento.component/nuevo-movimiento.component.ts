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

type Product = { id: number; name: string; serialized: boolean; stock: number };

type ProductRowForm = FormGroup<{
  productQuery: FormControl<string>;
  productId: FormControl<number | null>;
  quantity: FormControl<number>;
  serials: FormControl<string[]>;
}>;


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

  readonly productsData: Product[] = [
    { id: 1, name: 'Laptop Dell XPS 15', serialized: true, stock: 5 },
    { id: 2, name: 'Mouse Logitech MX Master', serialized: false, stock: 25 },
    { id: 3, name: 'Teclado Mecánico Keychron', serialized: true, stock: 8 },
    { id: 4, name: 'Monitor LG UltraWide 34"', serialized: true, stock: 3 },
    { id: 5, name: 'Cable HDMI 2m', serialized: false, stock: 50 },
  ];

  readonly serialsData: Record<number, string[]> = {
    1: ['SN-DELL-001', 'SN-DELL-002', 'SN-DELL-003', 'SN-DELL-004', 'SN-DELL-005'],
    3: ['SN-KEY-A01', 'SN-KEY-A02', 'SN-KEY-A03', 'SN-KEY-A04', 'SN-KEY-A05', 'SN-KEY-A06', 'SN-KEY-A07', 'SN-KEY-A08'],
    4: ['SN-MON-X1', 'SN-MON-X2', 'SN-MON-X3'],
  };

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
    return p?.name ?? '-';
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
        this.seriales.set(data ?? []);
        this.serialesPorProducto.clear(); // reset cache
        this.serialesLoading.set(false);
      },
      error: () => {
        this.serialesError.set('No se pudieron cargar los seriales.');
        this.serialesLoading.set(false);
      },
    });
  }

  /**
   * Retorna lista de seriales para producto, filtrando por estado.
   * Ajusta los estados válidos a los que uses en tu BD: "DISPONIBLE", "ACTIVO", etc.
   */
  private getSerialesDisponibles(productoId: number): string[] {
    const cached = this.serialesPorProducto.get(productoId);
    if (cached) return cached;

    const estadosPermitidos = new Set(['DISPONIBLE', 'Disponible', 'ACTIVO', 'Activo', 'EN_STOCK']);
    const list = this.seriales()
      .filter(s => s.idProducto === productoId && estadosPermitidos.has((s.estado ?? '').trim()))
      .map(s => s.serial);

    this.serialesPorProducto.set(productoId, list);
    return list;
  }


  // ===== Helpers =====
  trackByIndex = (i: number) => i;

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
    const row = this.productsFA.at(index);

    row.controls.productQuery.setValue(product.nombre);
    row.controls.productId.setValue(product.idProducto);
    row.controls.serials.setValue([]);

    // como aún no tenemos stock real, no ajustamos cantidad aquí
    this.closeAutocomplete();
  }

  // ===== Cantidad / stock =====
  onQuantityChanged(index: number): void {
    const row = this.productsFA.at(index);
    const pid = row.controls.productId.value;
    const product = this.findProduct(pid);
    if (!product) return;

    const qty = row.controls.quantity.value;
    if (qty > product.stock) {
      row.controls.quantity.setValue(product.stock);
      alert(`La cantidad no puede exceder el stock disponible (${product.stock} uds.)`);
    }

    if (product.serialized) {
      const current = row.controls.serials.value ?? [];
      if (current.length > row.controls.quantity.value) {
        row.controls.serials.setValue(current.slice(0, row.controls.quantity.value));
      }
    }
  }

  // ===== Seriales =====
  canOpenSerialModal(index: number): boolean {
    const row = this.productsFA.at(index);
    const product = this.findProduct(row.controls.productId.value);
    return !!product?.serialized;
  }

  openSerialModal(index: number): void {
    const row = this.productsFA.at(index);
    const product = this.findProduct(row.controls.productId.value);
    if (!product?.esConSerial) return;

    const serials = this.getSerialesDisponibles(product.idProducto);

    this._modalRowIndex.set(index);
    this._modalSerials.set(serials);

    const existing = row.controls.serials.value ?? [];
    this._modalSelected.set(new Set(existing));

    this._modalOpen.set(true);
  }

  toggleSerial(serial: string): void {
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
      if (qty > product.stock) {
        alert(`La cantidad no puede exceder el stock disponible (${product.stock} uds.)`);
        return;
      }

      if (product.serialized) {
        const serials = row.controls.serials.value ?? [];
        if (serials.length !== qty) {
          alert(`Debes seleccionar seriales para: ${product.name}`);
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
}
