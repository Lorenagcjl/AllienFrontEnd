import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, concatMap, forkJoin, map, of, take } from 'rxjs';

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
  readonly ivaRate = 0.15;

  get subtotalValue(): number {
    return this.cartRows.reduce((acc, r) => acc + this.rowSubtotal(r), 0);
  }

  get taxValue(): number {
    return this.subtotalValue * this.ivaRate;
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
        this.ubicaciones = (data ?? []).filter(u => u.idUbicacion != null);
        // ✅ ayuda con NG0100 en algunos setups
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error cargando ubicaciones', err);
        this.ubicaciones = [];
      },
    });
  }

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

    this.modalRowId = row.id;
    this.modalProductId = row.productId;
    this.modalProductName = p.nombre;
    this.modalRequiredQty = row.quantity;

    const disponibles = this.getSerialesDisponibles(row.productId);

    // usados en otras filas (pero permitir los de esta fila)
    const usados = new Set(this.usedSerials);
    row.serials.forEach(s => usados.delete(s));

    this.modalSerials = disponibles.filter(s => !usados.has(s));
    this.modalSelected = new Set(row.serials.filter(s => this.modalSerials.includes(s)));

    this.serialModalOpen = true;
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

  rowStockText(_row: CartRow): string {
    return 'N/D';
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
    }
    return true;
  }

  // ==========================
  // ✅ Confirmar venta (BASE)
  // ==========================
  confirmSale() {
    if (!this.canConfirmSale()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const idUsuario = Number(localStorage.getItem('idUsuario') ?? '0');
    if (!idUsuario) {
      alert('No se encontró idUsuario en sesión. Vuelve a iniciar sesión.');
      return;
    }

    const logHttpError = (tag: string, err: any) => {
      console.error(`❌ ${tag}`);
      console.error('status:', err?.status);
      console.error('url:', err?.url);
      console.error('message:', err?.message);
      console.error('err.error:', err?.error);
      try {
        console.error('err.error (string):', JSON.stringify(err?.error, null, 2));
      } catch { }
    };

    // =========================
    // 1) CREAR VENTA
    // =========================
    const ventaPayload: any = {
      total: this.totalValue,
      observaciones: this.observaciones?.trim() || '',
      fkCliente: { idCliente: this.selectedClientId! },

      // opcionales (si tu backend los acepta)
      numeroFactura: this.invoiceNumber?.trim() || null,
      fechaVenta: new Date().toISOString(),
    };

    console.log('➡️ [1] POST VENTA payload:', ventaPayload, 'idUsuario:', idUsuario);

    this.ventaService.guardarVenta(ventaPayload, idUsuario).pipe(
      take(1),

      // =========================
      // 2) CREAR DETALLES (uno por fila)
      // =========================
      concatMap((ventaResp: any) => {
        console.log('✅ [1] VENTA RESP:', ventaResp);

        const idVenta = ventaResp?.idVenta;
        if (!idVenta) throw new Error('La respuesta de venta no trajo idVenta');

        const detalleRequests = this.cartRows.map((row) => {
          const p = this.getRowProduct(row)!;

          const detallePayload: any = {
            cantidad: row.quantity,
            precioUnitario: row.price,
            porcentajeComision: p.porcentajeComision ?? 0,
            subtotal: this.rowSubtotal(row),
            fkVenta: { idVenta },
            fkProducto: { idProducto: p.idProducto },
            fkUbicacion: { idUbicacion: this.selectedUbicacionId! },
          };

          console.log('➡️ [2] POST DETALLE payload:', detallePayload);

          return this.detalleVentaService.guardar(detallePayload).pipe(
            map((detalleResp: any) => {
              console.log('✅ [2] DETALLE RESP:', detalleResp);
              console.log('✅ [2] idDetalleVenta:', detalleResp?.idDetalleVenta);
              return { row, p, detalleResp };
            }),
            catchError((err) => {
              logHttpError('POST detalleVenta', err);
              throw err;
            })
          );
        });

        return forkJoin(detalleRequests).pipe(
          map((detallesCreados) => ({ ventaResp, detallesCreados }))
        );
      }),

      // =========================
      // 3) VINCULAR SERIALES + MOVIMIENTOS + UPDATE SERIAL
      // =========================
      concatMap(({ ventaResp, detallesCreados }: any) => {
        const ops: any[] = [];

        for (const item of detallesCreados) {
          const row: CartRow = item.row;
          const p: Producto = item.p;
          const detalleResp: any = item.detalleResp;

          const idDetalleVenta = detalleResp?.idDetalleVenta;
          if (!idDetalleVenta) throw new Error('DetalleVenta no devolvió idDetalleVenta');

          // ---- PRODUCTO CON SERIAL
          if (p.esConSerial) {
            for (const serialStr of row.serials) {
              const serialObj = this.serialesMov.find(
                (s) => s.serial === serialStr && s.productoId === p.idProducto
              );

              if (!serialObj) {
                throw new Error(`No encontré idProductoSerial para serial: ${serialStr}`);
              }

              const vinculoPayload: any = {
                fkDetalleVenta: { idDetalleVenta },
                fkProductoSerial: { idProductoSerial: serialObj.idProductoSerial },
              };

              // ✅ CAMBIO CLAVE: referenciaTipo debe ser VentaDetalle (igual que CompraDetalle)
              const movPayload: any = {
                tipo: 'Venta',
                cantidadEntrada: 0,
                cantidadSalida: 1,
                referenciaTipo: 'VentaDetalle',     // ✅ IMPORTANTÍSIMO
                referenciaId: idDetalleVenta,
                fkProducto: { idProducto: p.idProducto },
                fkProductoSerial: { idProductoSerial: serialObj.idProductoSerial },
                fkUbicacion: { idUbicacion: this.selectedUbicacionId! },
              };

              const updateSerialPayload: any = {
                serial: serialObj.serial,
                estado: 'VENDIDO',
                fkProducto: { idProducto: p.idProducto },
              };

              console.log('➡️ [3A] POST ventaDetalleSerial payload:', vinculoPayload);
              console.log('➡️ [3A] POST inventarioMovimiento (serial) payload:', movPayload);
              console.log('➡️ [3A] PUT productoSerial payload:', updateSerialPayload);

              ops.push(
                this.ventaDetalleSerialService.vincularSerialAVenta(vinculoPayload).pipe(
                  catchError((err) => {
                    logHttpError('POST ventaDetalleSerial', err);
                    return of({ ok: false, where: 'ventaDetalleSerial', err });
                  })
                ),
                this.inventarioMovimientoService.guardar(movPayload).pipe(
                  catchError((err) => {
                    logHttpError('POST inventarioMovimiento (serial)', err);
                    return of({ ok: false, where: 'inventarioMovimiento-serial', err });
                  })
                ),
                this.productoSerialService
                  .actualizarProductoSerial(serialObj.idProductoSerial, updateSerialPayload)
                  .pipe(
                    catchError((err) => {
                      logHttpError('PUT productoSerial (VENDIDO)', err);
                      return of({ ok: false, where: 'productoSerial-update', err });
                    })
                  )
              );
            }
          }
          // ---- PRODUCTO SIN SERIAL
          else {
            // ✅ CAMBIO CLAVE: referenciaTipo debe ser VentaDetalle
            const movPayload: any = {
              tipo: 'Venta',
              cantidadEntrada: 0,
              cantidadSalida: row.quantity,
              referenciaTipo: 'VentaDetalle',     // ✅ IMPORTANTÍSIMO
              referenciaId: idDetalleVenta,
              fkProducto: { idProducto: p.idProducto },
              fkProductoSerial: null,
              fkUbicacion: { idUbicacion: this.selectedUbicacionId! },
            };

            console.log('➡️ [3B] POST inventarioMovimiento (no-serial) payload:', movPayload);

            ops.push(
              this.inventarioMovimientoService.guardar(movPayload).pipe(
                catchError((err) => {
                  logHttpError('POST inventarioMovimiento (no-serial)', err);
                  return of({ ok: false, where: 'inventarioMovimiento-no-serial', err });
                })
              )
            );
          }
        }

        if (!ops.length) return of({ ventaResp, results: [] });

        return forkJoin(ops).pipe(
          map((results) => ({ ventaResp, results }))
        );
      }),

      // =========================
      // 4) CATCH GLOBAL
      // =========================
      catchError((err) => {
        logHttpError('PIPELINE ERROR (general)', err);
        alert('Error confirmando la venta. Revisa consola / backend.');
        return of(null);
      })
    ).subscribe((finalResp: any) => {
      if (!finalResp) return;

      const ventaResp = finalResp.ventaResp;
      const results = finalResp.results ?? [];

      const failed = results.filter((x: any) => x && x.ok === false);
      if (failed.length) {
        console.warn('⚠️ Operaciones fallidas:', failed);
        alert(`⚠️ Venta creada, pero fallaron ${failed.length} operaciones (seriales/inventario/updates). Revisa consola.`);
        return;
      }

      alert(
        `✓ Venta realizada exitosamente\nFactura: ${ventaResp?.numeroFactura ?? '(sin factura)'}\nTotal: $${this.totalValue.toFixed(2)}`
      );

      // ✅ limpiar formulario
      this.resetForm();

      // ✅ recargar seriales para que ya no aparezcan disponibles
      this.loadSeriales();
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

}
