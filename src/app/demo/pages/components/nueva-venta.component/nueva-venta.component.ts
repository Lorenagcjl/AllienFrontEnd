import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, concatMap, forkJoin, map, Observable, of, Subject, take, takeUntil } from 'rxjs';

import { ClienteService } from 'src/app/@theme/services/cliente.service';
import { UbicacionService } from 'src/app/@theme/services/ubicacion.service';
import { ProductoService } from 'src/app/@theme/services/producto.service';
import { ProductoSerialService } from 'src/app/@theme/services/producto-serial.service';

import { VentaDetalleSerialService } from 'src/app/@theme/services/venta-detalle-serial.service'; // ajusta ruta real

import { Cliente } from 'src/app/demo/models/cliente.model';
import { Ubicacion } from 'src/app/demo/models/ubicacion.model';
import { Producto } from 'src/app/demo/models/producto.model';
import { ProductoSerial } from 'src/app/demo/models/producto-serial.model';
import { VentaService } from 'src/app/@theme/services/venta.service';
import { DetalleVentaService } from 'src/app/@theme/services/detalleventa.service';
import { InventarioMovimientoService } from 'src/app/@theme/services/inventariomovimiento.service';
import { InventarioMovimiento } from 'src/app/demo/models/inventariomovimiento.model';
import { IvaConfigGlobalService } from 'src/app/@theme/services/iva-config-global.service';

type EstadoSerial = 'Disponible' | 'Vendido' | 'Dañado';

type ProductoSerialMovDto = {
  idProductoSerial: number;
  productoId: number;
  serial: string;
  estado: string;
};

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
  private clienteService = inject(ClienteService);
  private ubicacionService = inject(UbicacionService);
  private productoService = inject(ProductoService);
  private productoSerialService = inject(ProductoSerialService);

  // servicios de guardado (los usas cuando ya confirmes)
  private ventaService = inject(VentaService);
  private detalleVentaService = inject(DetalleVentaService);
  private ventaDetalleSerialService = inject(VentaDetalleSerialService);
  private inventarioMovimientoService = inject(InventarioMovimientoService);

  private cdr = inject(ChangeDetectorRef);

  private readonly ivaGlobal = inject(IvaConfigGlobalService);
  private readonly destroy$ = new Subject<void>();

  ivaRatePercent = 0;   // ej 15
  includeTax = false;   // opcional si quieres respetarlo

  // ===== Cabecera =====
  invoiceNumber = '';
  dateText = '';
  observaciones = '';

  // ===== Ubicación =====
  ubicaciones: Ubicacion[] = [];
  selectedUbicacionId: number | null = null;
  selectedUbicacion?: Ubicacion;

  // ===== Clientes =====
  clientes: Cliente[] = [];
  clientQuery = '';
  selectedClientId?: number;
  showClientResults = false;

  // ===== Productos =====
  productos: Producto[] = [];

  // ===== Carrito =====
  cartRows: CartRow[] = [];
  private cartRowCounter = 0;
  usedSerials = new Set<string>();

  // ===== Seriales =====
  serialesMov: ProductoSerialMovDto[] = [];
  private serialesPorProducto = new Map<number, string[]>();

  private serialUbicacionCache = new Map<string, number>(); // serial -> idUbicacion actual
  private serialUbicacionInflight = new Map<string, Observable<number>>(); // evita llamadas repetidas mientras carga

  // ===== Stock cache (NO SERIAL) =====
  private stockNoSerialCache = new Map<string, number>(); // key: `${ubicacionId}-${productoId}`
  private stockReady = false;

  private stockKey(ubicacionId: number, productoId: number): string {
    return `${ubicacionId}-${productoId}`;
  }

  // ===== Modal seriales =====
  serialModalOpen = false;
  modalRowId?: string;
  modalProductId?: number;
  modalProductName = '-';
  modalRequiredQty = 0;

  modalSerials: string[] = [];
  private modalSelected = new Set<string>();

  // =======================
  // ✅ TOTALES (IVA 15%)
  // =======================
  // readonly ivaRate = 0.15;

  get subtotalValue(): number {
    return this.cartRows.reduce((acc, r) => acc + this.rowSubtotal(r), 0);
  }

  get ivaRateDecimal(): number {
    return (this.ivaRatePercent ?? 0) / 100; // 15 -> 0.15
  }

  get taxValue(): number {
    return this.subtotalValue * this.ivaRateDecimal;
  }

  get totalValue(): number {
    return this.subtotalValue + this.taxValue;
  }

  // ✅ fuerza refresco cuando cambias campos dentro de row
  private touchRows(): void {
    this.cartRows = [...this.cartRows];
  }

  // ===== Cliente helpers =====
  clienteNombreCompleto(c: Cliente): string {
    return [c.primerNombre, c.segundoNombre, c.primerApellido, c.segundoApellido]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  get filteredClients(): Cliente[] {
    const q = (this.clientQuery ?? '').trim().toLowerCase();
    if (!q) return [];

    return this.clientes.filter(c => {
      const nombre = this.clienteNombreCompleto(c).toLowerCase();
      const doc = (c.documento ?? '').toLowerCase();
      return nombre.includes(q) || doc.includes(q);
    });
  }

  ngOnInit(): void {
    this.debugSerial('5126');


    const d = new Date();
    this.dateText = d.toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    this.loadClientes();
    this.loadUbicaciones();
    this.loadProductos();
    this.loadSeriales();
    this.loadStockNoSerial();

    this.ivaGlobal.config$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cfg => {
        this.ivaRatePercent = Number(cfg?.taxRate ?? 0);  // 15
        this.includeTax = !!cfg?.includeTax;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== Loaders =====
  private loadClientes() {
    this.clienteService.listarClientes().pipe(take(1)).subscribe({
      next: data => (this.clientes = data ?? []),
      error: err => {
        console.error('Error cargando clientes', err);
        this.clientes = [];
      },
    });
  }

  private loadUbicaciones() {
    this.ubicacionService.listarUbicaciones().pipe(take(1)).subscribe({
      next: data => {
        this.ubicaciones = (data ?? []).filter(u =>
          u.idUbicacion != null &&
          u.esPuntoVenta === true &&
          u.esActivo === true
        );

        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error cargando ubicaciones', err);
        this.ubicaciones = [];
      },
    });
  }

  // private loadUbicaciones() {
  //   this.ubicacionService.listarUbicaciones().pipe(take(1)).subscribe({
  //     next: data => {
  //       this.ubicaciones = (data ?? []).filter(u =>
  //         u.idUbicacion != null && u.esPuntoVenta === true
  //       );
  //       this.cdr.detectChanges();
  //     },
  //     error: err => {
  //       console.error('Error cargando ubicaciones', err);
  //       this.ubicaciones = [];
  //     },
  //   });
  // }

  private loadProductos(): void {
    this.productoService.listarProductos().pipe(take(1)).subscribe({
      next: (data: Producto[]) => {
        this.productos = data ?? [];
      },
      error: err => {
        console.error('Error cargando productos', err);
        this.productos = [];
      },
    });
  }

  private loadSeriales(): void {
    this.productoSerialService.listarProductosSerial().pipe(take(1)).subscribe({
      next: (data: ProductoSerial[]) => {
        const mapped: ProductoSerialMovDto[] = (data ?? [])
          .map(s => {
            const anyS = s as any;
            const fk = anyS.fkProducto;

            const productoId =
              fk && typeof fk === 'object' && typeof fk.idProducto === 'number' ? fk.idProducto : null;

            const idProductoSerial = typeof anyS.idProductoSerial === 'number' ? anyS.idProductoSerial : null;
            const serial = typeof anyS.serial === 'string' ? anyS.serial : null;
            const estado = typeof anyS.estado === 'string' ? anyS.estado : '';

            if (productoId == null || idProductoSerial == null || serial == null) return null;
            return { idProductoSerial, productoId, serial, estado };
          })
          .filter((x): x is ProductoSerialMovDto => x !== null);

        this.serialesMov = mapped;
        this.serialesPorProducto.clear();
      },
      error: err => {
        console.error('Error cargando seriales', err);
        this.serialesMov = [];
        this.serialesPorProducto.clear();
      },
    });
  }

  // ===== Ubicación =====
  onUbicacionChange() {
    const id = this.selectedUbicacionId;
    this.selectedUbicacion = this.ubicaciones.find(u => u.idUbicacion === id) ?? undefined;

    // recomendado: limpiar carrito al cambiar ubicación
    this.usedSerials.clear();
    this.cartRows = [];
    this.cartRowCounter = 0;
    this.loadStockNoSerial();
    this.serialUbicacionCache.clear();
    this.serialUbicacionInflight.clear();
  }

  // ===== Utils UI =====
  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const target = ev.target as HTMLElement | null;
    if (!target) return;

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
    this.selectedClientId = undefined;

    const raw = (this.clientQuery ?? '').replace(/\D/g, '');
    if (raw.length >= 10) {
      const match = this.clientes.find(c => (c.documento ?? '').replace(/\D/g, '') === raw);
      if (match) this.selectClient(match);
    }
  }

  selectClient(c: Cliente) {
    this.clientQuery = this.clienteNombreCompleto(c);
    this.selectedClientId = c.idCliente;
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
    if (row) row.serials.forEach(s => this.usedSerials.delete(s));
    this.cartRows = this.cartRows.filter(r => r.id !== rowId);
  }

  // ===== Productos (autocomplete) =====
  filteredProductsForRow(row: CartRow): Producto[] {
    const q = (row.productQuery ?? '').trim().toLowerCase();
    if (!q) return [];

    return this.productos
      .filter(p => (p.nombre ?? '').toLowerCase().includes(q))
      .slice(0, 15);
  }

  onProductFocus(row: CartRow) {
    row.showProductResults = this.filteredProductsForRow(row).length > 0;
    this.touchRows();
  }

  onProductChange(row: CartRow) {
    row.showProductResults = this.filteredProductsForRow(row).length > 0;

    if (row.productId) row.serials.forEach(s => this.usedSerials.delete(s));

    row.productId = undefined;
    row.price = 0;
    row.serials = [];

    this.touchRows();
  }

  selectProduct(row: CartRow, p: Producto) {
    const yaExiste = this.cartRows.some(r => r.id !== row.id && r.productId === p.idProducto);
    if (yaExiste) {
      alert('Este producto ya fue agregado. Ajusta la cantidad en la fila existente.');
      return;
    }

    // liberar seriales previos
    row.serials.forEach(s => this.usedSerials.delete(s));
    row.serials = [];

    row.productQuery = p.nombre;
    row.productId = p.idProducto;
    row.showProductResults = false;

    // ✅ PRECIO desde Producto
    row.price = Number((p.precioVenta ?? 0).toFixed(2));
    if (!row.quantity || row.quantity < 1) row.quantity = 1;

    this.touchRows();
  }

  // ✅ si el usuario edita el precio manualmente
  onPriceChange(_row: CartRow) {
    this.touchRows();
  }

  // ===== Cantidad =====
  onQuantityChange(row: CartRow) {
    const p = this.getRowProduct(row);
    if (!p) return;

    if (row.quantity < 1) row.quantity = 1;

    if (p.esConSerial) {
      if (row.serials.length !== row.quantity) {
        row.serials.forEach(s => this.usedSerials.delete(s));
        row.serials = [];
      }
    } else {
      if (row.serials.length) {
        row.serials.forEach(s => this.usedSerials.delete(s));
        row.serials = [];
      }
    }

    this.touchRows();
    // ✅ clamp por stock si NO serial
    if (!p.esConSerial && this.stockReady) {
      const disponible = this.getStockNoSerialForRow(row) ?? 0;
      if (row.quantity > disponible) {
        row.quantity = Math.max(0, disponible);
        alert(`Stock insuficiente en esta ubicación. Disponible: ${disponible}`);
      }
    }

  }

  // ===== Seriales helpers =====
  private normalizeEstadoSerial(raw: string | null | undefined): EstadoSerial | null {
    const v = (raw ?? '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    if (v === 'DISPONIBLE' || v === 'EN_STOCK') return 'Disponible';
    if (v === 'VENDIDO') return 'Vendido';
    if (v === 'DANADO' || v === 'DAÑADO') return 'Dañado';
    if (v === 'ACTIVO') return 'Disponible';
    return null;
  }

  private uniqueStrings(list: string[]): string[] {
    return Array.from(new Set(list));
  }

  private getSerialesDisponibles(productoId: number): string[] {
    const cached = this.serialesPorProducto.get(productoId);
    if (cached) return cached;

    const list = this.serialesMov
      .filter(s => s.productoId === productoId)
      .filter(s => this.normalizeEstadoSerial(s.estado) === 'Disponible')
      .map(s => s.serial);

    const unique = this.uniqueStrings(list);
    this.serialesPorProducto.set(productoId, unique);
    return unique;
  }

  // ===== Seriales (modal) =====
  openSerialModal(row: CartRow) {
    const p = this.getRowProduct(row);
    if (!p?.esConSerial || !row.productId) return;

    if (!this.selectedUbicacionId) {
      alert('Selecciona una ubicación antes de escoger seriales.');
      return;
    }

    this.modalRowId = row.id;
    this.modalProductId = row.productId;
    this.modalProductName = p.nombre;
    this.modalRequiredQty = row.quantity;

    const disponibles = this.getSerialesDisponibles(row.productId);
    const idUb = this.selectedUbicacionId;

    // usados en otras filas (pero permitir los de esta fila)
    const usados = new Set(this.usedSerials);
    row.serials.forEach(s => usados.delete(s));

    // ✅ pedir ubicación actual de cada serial y filtrar por ubicación seleccionada
    forkJoin(
      disponibles.map(serial =>
        this.getUbicacionActualDeSerial$(serial).pipe(
          map(ubId => ({ serial, ubId }))
        )
      )
    ).pipe(take(1)).subscribe((pairs) => {
      const serialesEnEstaUbicacion = pairs
        .filter(x => x.ubId === idUb)
        .map(x => x.serial);

      this.modalSerials = serialesEnEstaUbicacion.filter(s => !usados.has(s));
      this.modalSelected = new Set(row.serials.filter(s => this.modalSerials.includes(s)));

      this.serialModalOpen = true;
      this.cdr.detectChanges();
    });
  }

  closeSerialModal() {
    this.serialModalOpen = false;
    this.modalRowId = undefined;
    this.modalProductId = undefined;
    this.modalProductName = '-';
    this.modalRequiredQty = 0;
    this.modalSerials = [];
    this.modalSelected = new Set();
  }

  isSerialDisabled(serial: string): boolean {
    // usado por OTRA fila
    return this.usedSerials.has(serial) && !this.modalSelected.has(serial);
  }

  isSerialSelected(serial: string): boolean {
    return this.modalSelected.has(serial);
  }

  modalSelectedCount(): number {
    return this.modalSelected.size;
  }

  onSerialChange(serial: string, ev: Event) {
    const input = ev.target as HTMLInputElement;
    const next = input.checked;

    if (this.isSerialDisabled(serial)) {
      input.checked = false;
      return;
    }

    if (next) {
      if (this.modalSelected.size >= this.modalRequiredQty) {
        alert(`Solo puedes seleccionar ${this.modalRequiredQty} seriales`);
        input.checked = false;
        return;
      }
      this.modalSelected.add(serial);
    } else {
      this.modalSelected.delete(serial);
    }

    // ✅ fuerza re-render
    this.modalSelected = new Set(this.modalSelected);
  }

  confirmSerials() {
    if (!this.modalRowId) return;

    const row = this.cartRows.find(r => r.id === this.modalRowId);
    if (!row) return;

    const selected = Array.from(this.modalSelected);

    if (selected.length !== this.modalRequiredQty) {
      alert(`Debes seleccionar exactamente ${this.modalRequiredQty} seriales`);
      return;
    }

    // liberar anteriores
    row.serials.forEach(s => this.usedSerials.delete(s));

    row.serials = selected;
    selected.forEach(s => this.usedSerials.add(s));

    this.closeSerialModal();
    this.touchRows();
  }

  // ===== Helpers =====
  getRowProduct(row: CartRow): Producto | undefined {
    if (!row.productId) return undefined;
    return this.productos.find(p => p.idProducto === row.productId);
  }

  rowStockText(row: CartRow): string {
    const p = this.getRowProduct(row);
    if (!this.selectedUbicacionId || !p) return 'N/D';

    if (!this.stockReady) return '...';

    // NO SERIAL
    if (!p.esConSerial) {
      return String(this.getStockNoSerialForRow(row) ?? 0);
    }

    // SERIAL: por ahora muestra "Serial"
    // (tu modal ya filtra por ubicación con buscarPorSerial)
    return 'Serial';
  }

  rowSubtotal(row: CartRow): number {
    const qty = Number(row.quantity || 0);
    const price = Number(row.price || 0);
    return qty * price;
  }

  canConfirmSale(): boolean {
    if (!this.selectedClientId) return false;
    if (!this.selectedUbicacionId) return false;
    if (this.cartRows.length === 0) return false;

    for (const row of this.cartRows) {
      const p = this.getRowProduct(row);
      if (!p) return false;
      if (row.quantity < 1) return false;
      if (p.esConSerial && row.serials.length !== row.quantity) return false;
      if (!p.esConSerial && this.stockReady) {
        const disponible = this.getStockNoSerialForRow(row) ?? 0;
        if (row.quantity > disponible) return false;
      }

    }
    return true;
  }

  // ==========================
  // ✅ Confirmar venta (BASE)
  // ==========================
  confirmSale(): void {
    if (!this.canConfirmSale()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const idUsuario = Number(localStorage.getItem('idUsuario') ?? '0');
    if (!idUsuario) {
      alert('No se encontró idUsuario en sesión. Vuelve a iniciar sesión.');
      return;
    }

    const idUbicacion = this.selectedUbicacionId;
    if (!idUbicacion) {
      alert('Selecciona una ubicación');
      return;
    }

    const logHttpError = (tag: string, err: any) => {
      console.error(`❌ ${tag}`);
      console.error('status:', err?.status);
      console.error('url:', err?.url);
      console.error('message:', err?.message);
      console.error('err.error:', err?.error);
    };

    // 1) VENTA (backend espera fkUsuario y numeroFactura)
    const ventaPayload: any = {
      numeroFactura: (this.invoiceNumber ?? '').trim() || null,
      total: 0, // o this.totalValue si tu backend no recalcula
      observaciones: (this.observaciones ?? '').trim(),
      fkCliente: { idCliente: this.selectedClientId! },
      fkUsuario: { idUsuario }, // ✅ clave
    };

    this.ventaService.guardarVenta(ventaPayload, idUsuario).pipe(
      take(1),

      // 2) DETALLES
      concatMap((ventaResp: any) => {
        const idVenta = ventaResp?.idVenta;
        if (!idVenta) throw new Error('La respuesta de venta no trajo idVenta');

        const detalleRequests = this.cartRows.map((row) => {
          const p = this.getRowProduct(row);
          if (!p) throw new Error('Fila sin producto seleccionado');

          const detallePayload: any = {
            cantidad: row.quantity,
            precioUnitario: row.price,
            porcentajeComision: p.porcentajeComision ?? 0,
            subtotal: this.rowSubtotal(row),
            fkVenta: { idVenta },
            fkProducto: { idProducto: p.idProducto },
            fkUbicacion: { idUbicacion },
          };

          return this.detalleVentaService.guardar(detallePayload).pipe(
            map((detalleResp: any) => {
              const idDetalleVenta = detalleResp?.idDetalleVenta;
              if (!idDetalleVenta) throw new Error('DetalleVenta no devolvió idDetalleVenta');
              return { row, p, idDetalleVenta };
            }),
            catchError((err) => {
              logHttpError('POST detalleVenta', err);
              throw err; // ✅ corta todo
            })
          );
        });

        return forkJoin(detalleRequests).pipe(
          map((detallesCreados) => ({ ventaResp, detallesCreados }))
        );
      }),

      // 3) SERIAL + MOVIMIENTOS + UPDATE SERIAL
      concatMap(({ ventaResp, detallesCreados }: any) => {
        const ops: Observable<any>[] = [];

        for (const item of detallesCreados) {
          const row: CartRow = item.row;
          const p: Producto = item.p;
          const idDetalleVenta: number = item.idDetalleVenta;

          // ---- CON SERIAL
          if (p.esConSerial) {
            for (const serialStr of row.serials) {
              const serialObj = this.serialesMov.find(
                (s) => s.serial === serialStr && s.productoId === p.idProducto
              );
              if (!serialObj) throw new Error(`No encontré idProductoSerial para serial: ${serialStr}`);

              const vinculoPayload = {
                fkDetalleVenta: { idDetalleVenta },
                fkProductoSerial: { idProductoSerial: serialObj.idProductoSerial },
              };

              const movPayload = this.buildMovVentaSerial({
                idDetalleVenta,
                idProducto: p.idProducto,
                idProductoSerial: serialObj.idProductoSerial,
                idUbicacion,
              });

              const updateSerialPayload = {
                serial: serialObj.serial,
                estado: 'Vendido', // ⚠️ usa EXACTO lo que tu backend espera (Vendido vs VENDIDO)
                fkProducto: { idProducto: p.idProducto },
              };

              // ✅ SECUENCIAL por serial (si falla algo, revienta)
              const op$ = this.ventaDetalleSerialService.vincularSerialAVenta(vinculoPayload).pipe(
                concatMap(() => this.inventarioMovimientoService.guardar(movPayload)),
                concatMap(() => this.productoSerialService.actualizarProductoSerial(serialObj.idProductoSerial, updateSerialPayload)),
                catchError((err) => {
                  logHttpError('OP serial (vinculo/mov/update)', err);
                  throw err;
                })
              );

              ops.push(op$);
            }
          }

          // ---- SIN SERIAL
          else {
            const movPayload = this.buildMovVentaNoSerial({
              idDetalleVenta,
              idProducto: p.idProducto,
              cantidad: row.quantity,
              idUbicacion,
            });

            ops.push(
              this.inventarioMovimientoService.guardar(movPayload).pipe(
                catchError((err) => {
                  logHttpError('POST inventarioMovimiento (no-serial)', err);
                  throw err;
                })
              )
            );
          }
        }

        return (ops.length ? forkJoin(ops) : of([])).pipe(
          map((results) => ({ ventaResp, results }))
        );
      }),

      catchError((err) => {
        logHttpError('PIPELINE ERROR (venta)', err);
        alert('Error confirmando la venta. Revisa consola / backend.');
        return of(null);
      })
    ).subscribe((finalResp: any) => {
      if (!finalResp) return;

      alert(`✓ Venta realizada exitosamente\nFactura: ${finalResp.ventaResp?.numeroFactura ?? '(sin factura)'}\nTotal: $${this.totalValue.toFixed(2)}`);

      this.resetForm();
      this.loadSeriales(); // refresca seriales disponibles
    });
  }

  trackByRowId(_index: number, row: { id: string }) {
    return row.id;
  }

  private resetForm(): void {
    // Cabecera
    this.invoiceNumber = '';
    this.observaciones = '';

    // Cliente
    this.clientQuery = '';
    this.selectedClientId = undefined;
    this.showClientResults = false;

    // Ubicación (si quieres mantenerla seleccionada, comenta estas 2 líneas)
    // this.selectedUbicacionId = null;
    // this.selectedUbicacion = undefined;

    // Carrito + seriales usados
    this.usedSerials.clear();
    this.cartRows = [];
    this.cartRowCounter = 0;

    // Modal
    this.closeSerialModal();

    // (Opcional) si quieres limpiar cache de seriales por producto
    // this.serialesPorProducto.clear();

    // fuerza refresh visual
    this.cdr.detectChanges();
  }

  private buildMovVentaSerial(args: {
    idDetalleVenta: number;
    idProducto: number;
    idProductoSerial: number;
    idUbicacion: number;
  }): any {
    return {
      tipo: 'Venta',
      cantidadEntrada: 0,
      cantidadSalida: 1,
      referenciaTipo: 'VentaDetalle',
      referenciaId: args.idDetalleVenta,
      fkProducto: { idProducto: args.idProducto },
      fkProductoSerial: { idProductoSerial: args.idProductoSerial },
      fkUbicacion: { idUbicacion: args.idUbicacion },
    };
  }

  private buildMovVentaNoSerial(args: {
    idDetalleVenta: number;
    idProducto: number;
    cantidad: number;
    idUbicacion: number;
  }): any {
    return {
      tipo: 'Venta',
      cantidadEntrada: 0,
      cantidadSalida: args.cantidad,
      referenciaTipo: 'VentaDetalle',
      referenciaId: args.idDetalleVenta,
      fkProducto: { idProducto: args.idProducto },
      fkProductoSerial: null,
      fkUbicacion: { idUbicacion: args.idUbicacion },
    };
  }

  private debugSerial(serial: string): void {
    this.inventarioMovimientoService
      .buscarPorSerial(serial)
      .pipe(take(1))
      .subscribe(
        (movs: InventarioMovimiento[]) => {
          console.log('SERIAL:', serial);
          console.log('MOVS:', movs);

          const last = [...(movs ?? [])].sort((a, b) => {
            const da = new Date(a?.fecha ?? 0).getTime();
            const db = new Date(b?.fecha ?? 0).getTime();
            if (da !== db) return db - da;
            return (b?.idInventarioMovimiento ?? 0) - (a?.idInventarioMovimiento ?? 0);
          })[0];

          console.log('LAST:', last);
          console.log(
            'LAST UBICACION:',
            last?.fkUbicacion?.idUbicacion
          );
        },
        (e) => console.error('ERROR debugSerial', e)
      );
  }

  private getUbicacionActualDeSerial$(serial: string): Observable<number> {
    const cached = this.serialUbicacionCache.get(serial);
    if (cached != null) return of(cached);

    const inflight = this.serialUbicacionInflight.get(serial);
    if (inflight) return inflight;

    const req$ = this.inventarioMovimientoService.buscarPorSerial(serial).pipe(
      take(1),
      map((movs: any[]) => {
        const last = [...(movs ?? [])].sort((a, b) => {
          const da = new Date(a?.fecha ?? 0).getTime();
          const db = new Date(b?.fecha ?? 0).getTime();
          if (da !== db) return db - da;
          return (b?.idInventarioMovimiento ?? 0) - (a?.idInventarioMovimiento ?? 0);
        })[0];

        const idUb = last?.fkUbicacion?.idUbicacion ?? 0;
        this.serialUbicacionCache.set(serial, idUb);
        this.serialUbicacionInflight.delete(serial);
        return idUb;
      }),
      catchError(() => {
        // si falla, asumimos "no ubicable"
        this.serialUbicacionInflight.delete(serial);
        return of(0);
      })
    );

    this.serialUbicacionInflight.set(serial, req$);
    return req$;
  }

  private loadStockNoSerial(): void {
    this.stockReady = false;
    this.stockNoSerialCache.clear();

    this.inventarioMovimientoService.listar().pipe(take(1)).subscribe({
      next: (movs: InventarioMovimiento[]) => {
        for (const m of (movs ?? [])) {
          const ubi = m?.fkUbicacion?.idUbicacion;
          const prod = m?.fkProducto?.idProducto;
          const prodSerial = m?.fkProductoSerial?.idProductoSerial ?? null;

          if (!ubi || !prod) continue;

          // SOLO NO-SERIAL
          if (prodSerial != null) continue;

          const k = this.stockKey(ubi, prod);
          const prev = this.stockNoSerialCache.get(k) ?? 0;

          const entrada = Number(m?.cantidadEntrada ?? 0);
          const salida = Number(m?.cantidadSalida ?? 0);

          this.stockNoSerialCache.set(k, prev + (entrada - salida));
        }

        this.stockReady = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando movimientos para stock', err);
        this.stockReady = true; // para no bloquear UI
      }
    });
  }

  private getStockNoSerialForRow(row: CartRow): number | null {
    const ubi = this.selectedUbicacionId;
    const p = this.getRowProduct(row);
    if (!ubi || !p) return null;
    if (p.esConSerial) return null; // no aplica

    const k = this.stockKey(ubi, p.idProducto);
    return this.stockNoSerialCache.get(k) ?? 0;
  }


}
