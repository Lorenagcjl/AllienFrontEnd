import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Client = { id: number; name: string; cedula: string };
type Product = { id: number; name: string; serialized: boolean; stock: number; price: number };

type CartRow = {
  id: string;
  productQuery: string;
  productId?: number;
  quantity: number;
  price: number;
  serials: string[];
  showProductResults: boolean;
};

@Component({
  selector: 'app-nueva-venta.component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nueva-venta.component.html',
  styleUrl: './nueva-venta.component.scss',
})
export default class NuevaVentaComponent implements OnInit {
  // ===== Datos (demo) =====
  clientsData: Client[] = [
    { id: 1, name: 'Juan Pérez', cedula: '1234567890' },
    { id: 2, name: 'María González', cedula: '0987654321' },
    { id: 3, name: 'Carlos Rodríguez', cedula: '1122334455' },
    { id: 4, name: 'Ana Martínez', cedula: '5566778899' },
    { id: 5, name: 'Luis Fernández', cedula: '9988776655' },
  ];

  productsData: Product[] = [
    { id: 1, name: 'Laptop Dell XPS 15', serialized: true, stock: 5, price: 1299.99 },
    { id: 2, name: 'Mouse Logitech MX Master', serialized: false, stock: 25, price: 99.99 },
    { id: 3, name: 'Teclado Mecánico Keychron', serialized: true, stock: 8, price: 149.99 },
    { id: 4, name: 'Monitor LG UltraWide 34"', serialized: true, stock: 3, price: 599.99 },
    { id: 5, name: 'Cable HDMI 2m', serialized: false, stock: 50, price: 12.99 },
    { id: 6, name: 'Webcam Logitech C920', serialized: true, stock: 12, price: 79.99 },
    { id: 7, name: 'Hub USB-C', serialized: false, stock: 30, price: 45.99 },
    { id: 8, name: 'Auriculares Sony WH-1000XM5', serialized: true, stock: 6, price: 399.99 },
  ];

  serialsInventory: Record<number, string[]> = {
    1: ['SN-DELL-001', 'SN-DELL-002', 'SN-DELL-003', 'SN-DELL-004', 'SN-DELL-005'],
    3: ['SN-KEY-A01', 'SN-KEY-A02', 'SN-KEY-A03', 'SN-KEY-A04', 'SN-KEY-A05', 'SN-KEY-A06', 'SN-KEY-A07', 'SN-KEY-A08'],
    4: ['SN-MON-X1', 'SN-MON-X2', 'SN-MON-X3'],
    6: ['SN-CAM-101', 'SN-CAM-102', 'SN-CAM-103', 'SN-CAM-104', 'SN-CAM-105', 'SN-CAM-106', 'SN-CAM-107', 'SN-CAM-108', 'SN-CAM-109', 'SN-CAM-110', 'SN-CAM-111', 'SN-CAM-112'],
    8: ['SN-SONY-A1', 'SN-SONY-A2', 'SN-SONY-A3', 'SN-SONY-A4', 'SN-SONY-A5', 'SN-SONY-A6'],
  };

  // ===== Cabecera =====
  invoiceNumber = '';
  dateText = '';
  locationText = 'Tienda Principal';
  observaciones = '';

  // ===== Cliente autocomplete =====
  clientQuery = '';
  selectedClientId?: number;
  showClientResults = false;

  get filteredClients(): Client[] {
    const q = (this.clientQuery ?? '').trim().toLowerCase();
    if (!q) return [];
    return this.clientsData.filter(
      c => c.name.toLowerCase().includes(q) || c.cedula.includes(q)
    );
  }

  // ===== Carrito =====
  cartRows: CartRow[] = [];
  private cartRowCounter = 0;

  // Seriales usados globalmente (para no repetir)
  usedSerials = new Set<string>();

  // ===== Modal seriales =====
  serialModalOpen = false;
  modalRowId?: string;
  modalProductId?: number;
  modalProductName = '-';
  modalRequiredQty = 0;

  // serial -> checked
  modalChecked = new Map<string, boolean>();

  get modalAvailableSerials(): string[] {
    if (!this.modalProductId) return [];
    return this.serialsInventory[this.modalProductId] ?? [];
  }

  ngOnInit(): void {
    // Fecha (formato simple; si quieres exactamente "es-EC" con hora, lo dejamos así)
    const d = new Date();
    this.dateText = d.toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Factura
    this.invoiceNumber = 'FAC-' + Date.now().toString().slice(-8);
  }

  // ===== Utils UI =====
  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const target = ev.target as HTMLElement | null;
    if (!target) return;

    // Cerrar autocompletes si clic fuera
    if (!target.closest('.nv-autocomplete-wrapper')) {
      this.showClientResults = false;
      this.cartRows = this.cartRows.map(r => ({ ...r, showProductResults: false }));
    }
  }

  // ===== Cliente =====
  onClientInputFocus() {
    this.showClientResults = this.filteredClients.length > 0;
  }

  onClientInputChange() {
    this.showClientResults = this.filteredClients.length > 0;
    // Si cambia texto manualmente, des-selecciona
    this.selectedClientId = undefined;
  }

  selectClient(c: Client) {
    this.clientQuery = c.name;
    this.selectedClientId = c.id;
    this.showClientResults = false;
  }

  // ===== Carrito: filas =====
  addCartRow() {
    const rowId = `cart-${this.cartRowCounter++}`;
    const row: CartRow = {
      id: rowId,
      productQuery: '',
      quantity: 1,
      price: 0,
      serials: [],
      showProductResults: false,
    };
    this.cartRows = [...this.cartRows, row];
  }

  removeCartRow(rowId: string) {
    const row = this.cartRows.find(r => r.id === rowId);
    if (row) {
      // liberar seriales
      row.serials.forEach(s => this.usedSerials.delete(s));
    }
    this.cartRows = this.cartRows.filter(r => r.id !== rowId);
  }

  // ===== Carrito: producto autocomplete =====
  filteredProductsForRow(row: CartRow): Product[] {
    const q = (row.productQuery ?? '').trim().toLowerCase();
    if (!q) return [];
    return this.productsData.filter(p => p.stock > 0 && p.name.toLowerCase().includes(q));
  }

  onProductFocus(row: CartRow) {
    row.showProductResults = this.filteredProductsForRow(row).length > 0;
  }

  onProductChange(row: CartRow) {
    row.showProductResults = this.filteredProductsForRow(row).length > 0;

    // si escriben manual, limpiamos selección
    if (row.productId) {
      // liberar seriales anteriores
      row.serials.forEach(s => this.usedSerials.delete(s));
    }
    row.productId = undefined;
    row.price = 0;
    row.serials = [];
  }

  selectProduct(row: CartRow, p: Product) {
    row.productQuery = p.name;
    row.productId = p.id;
    row.price = Number(p.price.toFixed(2));
    row.showProductResults = false;

    // si era serializado, hay que recalcular celda / validar
    // (seriales se mantienen vacíos hasta seleccionar)
    if (!p.serialized) {
      // no seriales
      row.serials = [];
    } else {
      // si cambia producto, liberar seriales previos
      row.serials.forEach(s => this.usedSerials.delete(s));
      row.serials = [];
    }
  }

  // ===== Carrito: cantidades / precios =====
  onQuantityChange(row: CartRow) {
    const p = this.getRowProduct(row);
    if (!p) return;

    // Validar stock
    if (row.quantity > p.stock) {
      alert(`Stock insuficiente. Disponible: ${p.stock} unidades`);
      row.quantity = p.stock;
    }
    if (row.quantity < 1) row.quantity = 1;

    if (p.serialized) {
      // si cambia cantidad, reset seriales
      if (row.serials.length !== row.quantity) {
        row.serials.forEach(s => this.usedSerials.delete(s));
        row.serials = [];
      }
    }
  }

  // ===== Seriales =====
  openSerialModal(row: CartRow) {
    const p = this.getRowProduct(row);
    if (!p) return;

    this.modalRowId = row.id;
    this.modalProductId = p.id;
    this.modalProductName = p.name;
    this.modalRequiredQty = row.quantity;

    // cargar checks
    this.modalChecked = new Map<string, boolean>();
    const available = this.serialsInventory[p.id] ?? [];

    available.forEach(serial => {
      const isSelected = row.serials.includes(serial);
      this.modalChecked.set(serial, isSelected);
    });

    this.serialModalOpen = true;
  }

  closeSerialModal() {
    this.serialModalOpen = false;
    this.modalRowId = undefined;
    this.modalProductId = undefined;
    this.modalProductName = '-';
    this.modalRequiredQty = 0;
    this.modalChecked.clear();
  }

  isSerialUsedElsewhere(serial: string): boolean {
    if (!this.modalRowId) return this.usedSerials.has(serial);

    const row = this.cartRows.find(r => r.id === this.modalRowId);
    const currentRowHasIt = row?.serials.includes(serial) ?? false;

    return this.usedSerials.has(serial) && !currentRowHasIt;
  }

  toggleSerial(serial: string) {
    if (this.isSerialUsedElsewhere(serial)) return;

    const current = this.modalChecked.get(serial) ?? false;
    const next = !current;

    // si activa, validar límite
    if (next) {
      const selectedCount = this.modalSelectedCount();
      if (selectedCount + 1 > this.modalRequiredQty) {
        alert(`Solo puedes seleccionar ${this.modalRequiredQty} seriales`);
        return;
      }
    }

    this.modalChecked.set(serial, next);
  }

  modalSelectedCount(): number {
    let count = 0;
    for (const [, checked] of this.modalChecked) {
      if (checked) count++;
    }
    // pero excluye disabled (usados en otra fila)
    // (los disabled ya no se pueden toggle, pero igual por seguridad:)
    let safeCount = 0;
    for (const [serial, checked] of this.modalChecked) {
      if (!checked) continue;
      if (!this.isSerialUsedElsewhere(serial)) safeCount++;
      else {
        // si por algún motivo quedó marcado y está usado en otra fila, lo ignoro
      }
    }
    return safeCount;
  }

  confirmSerials() {
    if (!this.modalRowId) return;

    const row = this.cartRows.find(r => r.id === this.modalRowId);
    if (!row) return;

    const selected = [...this.modalChecked.entries()]
      .filter(([serial, checked]) => checked && !this.isSerialUsedElsewhere(serial))
      .map(([serial]) => serial);

    if (selected.length !== this.modalRequiredQty) {
      alert(`Debes seleccionar exactamente ${this.modalRequiredQty} seriales`);
      return;
    }

    // liberar anteriores
    row.serials.forEach(s => this.usedSerials.delete(s));

    // set nuevos
    row.serials = selected;
    selected.forEach(s => this.usedSerials.add(s));

    this.closeSerialModal();
  }

  // ===== Totales / helpers =====
  getRowProduct(row: CartRow): Product | undefined {
    if (!row.productId) return undefined;
    return this.productsData.find(p => p.id === row.productId);
  }

  rowStockBadgeClass(row: CartRow): string {
    const p = this.getRowProduct(row);
    if (!p) return '';
    if (p.stock === 0) return 'nv-stock-badge--out';
    if (p.stock < 10) return 'nv-stock-badge--low';
    return '';
  }

  rowStockText(row: CartRow): string {
    const p = this.getRowProduct(row);
    if (!p) return '-';
    return `${p.stock} uds.`;
  }

  rowSubtotal(row: CartRow): number {
    const qty = Number(row.quantity || 0);
    const price = Number(row.price || 0);
    return qty * price;
  }

  subtotal(): number {
    return this.cartRows.reduce((acc, r) => acc + this.rowSubtotal(r), 0);
  }

  tax(): number {
    return this.subtotal() * 0.12;
  }

  total(): number {
    return this.subtotal() + this.tax();
  }

  canConfirmSale(): boolean {
    if (!this.selectedClientId) return false;
    if (this.cartRows.length === 0) return false;

    for (const row of this.cartRows) {
      const p = this.getRowProduct(row);
      if (!p) return false;

      if (row.quantity < 1) return false;
      if (row.quantity > p.stock) return false;

      if (p.serialized && row.serials.length !== row.quantity) return false;
    }
    return true;
  }

  confirmSale() {
    if (!this.canConfirmSale()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const client = this.clientsData.find(c => c.id === this.selectedClientId);

    const saleData = {
      factura: this.invoiceNumber,
      fecha: this.dateText,
      cliente: client,
      ubicacion: this.locationText,
      observaciones: this.observaciones,
      items: this.cartRows.map(row => {
        const p = this.getRowProduct(row)!;
        return {
          producto: p.name,
          cantidad: row.quantity,
          precio_unitario: row.price,
          subtotal: this.rowSubtotal(row),
          con_serial: p.serialized,
          seriales: p.serialized ? row.serials : undefined,
        };
      }),
      totals: {
        subtotal: this.subtotal(),
        tax: this.tax(),
        total: this.total(),
      },
    };

    console.log('Datos de la venta:', saleData);
    alert(`✓ Venta confirmada exitosamente!\n\nFactura: ${saleData.factura}\nTotal: $${saleData.totals.total.toFixed(2)}`);
  }

  trackByRowId(index: number, row: { id: string }) {
  return row.id;
}

}
