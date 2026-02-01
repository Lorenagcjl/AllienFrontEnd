import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, HostListener, signal, viewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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
  // ====== Datos de ejemplo (igual que tu HTML) ======
  readonly productsData: Product[] = [
    { id: 1, name: 'Laptop Dell XPS 15', serialized: true },
    { id: 2, name: 'Mouse Logitech MX Master', serialized: false },
    { id: 3, name: 'Teclado Mecánico Keychron', serialized: true },
    { id: 4, name: 'Monitor LG UltraWide 34"', serialized: true },
    { id: 5, name: 'Cable HDMI 2m', serialized: false },
    { id: 6, name: 'Webcam Logitech C920', serialized: true },
    { id: 7, name: 'Hub USB-C', serialized: false },
    { id: 8, name: 'Auriculares Sony WH-1000XM5', serialized: true },
  ];

  private fb = new FormBuilder();

  // ====== Form principal ======
  readonly form = this.fb.group({
    fecha: this.fb.control<string>({ value: this.formatNowEc(), disabled: true }),
    usuario: this.fb.control<string>({ value: 'Juan Pérez', disabled: true }),
    ubicacion: this.fb.control<string>('', { validators: [Validators.required] }),
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
    // si cambia ubicación, revalida
    this.form.controls.ubicacion.valueChanges.subscribe(() => this.form.updateValueAndValidity());
  }

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

  removeProductRow(index: number): void {
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
      alert('Debes ingresar todos los seriales y sin duplicados.');
      return;
    }

    const idx = this.modalRowIndex();
    if (idx === null) return;

    const serials = this.modalSerials().map(s => s.trim());
    this.rows.at(idx).controls.serials.setValue(serials, { emitEvent: false });

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
      alert('Por favor completa todos los campos requeridos y los seriales de productos serializados.');
      return;
    }

    const purchaseData = {
      fecha: this.form.controls.fecha.value,
      usuario: this.form.controls.usuario.value,
      ubicacion: this.form.controls.ubicacion.value,
      observaciones: this.form.controls.observaciones.value,
      items: this.rows.controls.map(r => {
        const product = this.productsData.find(p => p.id === r.controls.productId.value)!;
        const quantity = r.controls.quantity.value;
        const cost = Number(r.controls.cost.value ?? 0);

        const item: any = {
          producto: product.name,
          cantidad: quantity,
          costo_unitario: cost,
          con_serial: product.serialized,
        };

        if (product.serialized) item.seriales = r.controls.serials.value;
        return item;
      }),
    };

    console.log('Datos de la compra:', purchaseData);
    alert('✓ Compra guardada correctamente');
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

}
