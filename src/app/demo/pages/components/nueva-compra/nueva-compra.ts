import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductoService } from 'src/app/@theme/services/producto.service';
import { UbicacionService } from 'src/app/@theme/services/ubicacion.service';
import { CompraProductoService } from 'src/app/@theme/services/compra-producto.service';
import { CompraProductoDetalleService } from 'src/app/@theme/services/compra-producto-detalle.service';
import { ProductoSerialService } from 'src/app/@theme/services/producto-serial.service';
import { InventarioMovimientoService } from 'src/app/@theme/services/inventariomovimiento.service';
import { AlertService } from 'src/app/@theme/services/alert.service';

import { UbicacionModel } from 'src/app/demo/models/ubicacion.model';

/* =========================
   MODELOS
   ========================= */
interface Producto {
  idProducto: number;
  nombre: string;
  esConSerial: boolean;
}

interface ItemCompra {
  idProducto: number | null;
  esConSerial: boolean;
  cantidad: number;
  costoUnitario: number;
  idUbicacion: number;
  seriales: string[];
}

@Component({
  selector: 'app-nueva-compra',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nueva-compra.html',
  styleUrl: './nueva-compra.scss',
})
export default class NuevaCompra implements OnInit {

  /* =========================
     SERVICIOS
     ========================= */
  private productoService = inject(ProductoService);
  private ubicacionService = inject(UbicacionService);
  private compraService = inject(CompraProductoService);
  private detalleService = inject(CompraProductoDetalleService);
  private serialService = inject(ProductoSerialService);
  private inventarioService = inject(InventarioMovimientoService);
  private alert = inject(AlertService);

  /* =========================
     CABECERA
     ========================= */
  fecha = new Date().toISOString().slice(0, 10);
  usuario = 'Usuario Demo'; // luego viene del auth
  observaciones = '';

  ubicaciones: UbicacionModel[] = [];
  idUbicacionGlobal!: number;

  /* =========================
     DATA
     ========================= */
  productos: Producto[] = [];
  items: ItemCompra[] = [];

  /* =========================
     MODAL SERIALES
     ========================= */
  modalSerialVisible = false;
  itemSerialActual!: ItemCompra;

  /* =========================
     INIT
     ========================= */
  ngOnInit(): void {
    this.cargarProductos();
    this.cargarUbicaciones();
    this.agregarItem();
  }

  /* =========================
     BACKEND
     ========================= */
  cargarProductos(): void {
    this.productoService.listarProductos().subscribe({
      next: (data: any[]) => {
        this.productos = (data ?? []).map(p => ({
          idProducto: p.idProducto,
          nombre: p.nombre,
          esConSerial: p.esConSerial
        }));
      },
      error: () => {
        this.alert.error('Error', 'No se pudieron cargar productos');
      }
    });
  }

  cargarUbicaciones(): void {
  this.ubicacionService.listarUbicacions().subscribe({
    next: (data: any[]) => {

      this.ubicaciones = (data ?? [])
        .filter(u => u.idUbicacion !== undefined && u.idUbicacion !== null)
        .map(u => ({
          idUbicacion: u.idUbicacion,
          nombre: u.nombre,
          descripcion: u.descripcion ?? '',
          tipo: u.tipo ?? ''
        }));

      if (this.ubicaciones.length > 0) {
        this.idUbicacionGlobal = this.ubicaciones[0].idUbicacion;
        this.cambiarUbicacionGlobal();
      }
    },
    error: () => {
      this.alert.error('Error', 'No se pudieron cargar ubicaciones');
    }
  });
}


  /* =========================
     ITEMS
     ========================= */
  agregarItem(): void {
    this.items.push({
      idProducto: null,
      esConSerial: false,
      cantidad: 1,
      costoUnitario: 0,
      idUbicacion: this.idUbicacionGlobal,
      seriales: []
    });
  }

  eliminarItem(index: number): void {
    this.items.splice(index, 1);
    if (this.items.length === 0) {
      this.agregarItem();
    }
  }

  seleccionarProducto(item: ItemCompra, producto: Producto): void {
    item.idProducto = producto.idProducto;
    item.esConSerial = producto.esConSerial;
    item.seriales = [];
  }

  cambiarCantidad(item: ItemCompra): void {
    if (item.esConSerial) {
      item.seriales = [];
    }
  }

  cambiarUbicacionGlobal(): void {
    this.items.forEach(i => i.idUbicacion = this.idUbicacionGlobal);
  }

  /* =========================
     SERIALES
     ========================= */
  abrirModalSeriales(item: ItemCompra): void {
    this.itemSerialActual = item;
    this.modalSerialVisible = true;
  }

  cerrarModalSeriales(): void {
    this.modalSerialVisible = false;
  }

  guardarSeriales(): void {
    if (this.itemSerialActual.seriales.some(s => !s)) {
      this.alert.toast('warning', 'Completa todos los seriales');
      return;
    }

    const set = new Set(this.itemSerialActual.seriales);
    if (set.size !== this.itemSerialActual.seriales.length) {
      this.alert.toast('warning', 'Seriales duplicados');
      return;
    }

    this.modalSerialVisible = false;
  }

  /* =========================
     VALIDACIÓN CLAVE
     ========================= */
  private validarSeriales(): boolean {
    for (const item of this.items) {
      if (item.esConSerial && item.seriales.length !== item.cantidad) {
        this.alert.toast(
          'warning',
          'Cantidad y seriales no coinciden'
        );
        return false;
      }
    }
    return true;
  }

  /* =========================
     GUARDAR COMPRA
     ========================= */
  guardarCompra(): void {

    if (!this.items.some(i => i.idProducto)) {
      this.alert.toast('warning', 'Agrega al menos un producto');
      return;
    }

    if (!this.validarSeriales()) {
      return;
    }

    const loadingId = this.alert.loading('Guardando compra...', 'Procesando');

    const compraPayload = {
      fechaIngreso: new Date().toISOString(),
      observaciones: this.observaciones,
      fkUsuario: { idUsuario: 1 }
    };

    this.compraService.crear(compraPayload).subscribe({
      next: (compra: any) => {
        this.guardarDetalles(compra.idCompraProducto, loadingId);
      },
      error: () => {
        this.alert.close(loadingId);
        this.alert.error('Error', 'No se pudo guardar la compra');
      }
    });
  }

  private guardarDetalles(idCompraProducto: number, loadingId: any): void {

    const requests = this.items
      .filter(i => i.idProducto)
      .map(item => {

        const payload = {
          cantidad: item.cantidad,
          costoUnitario: item.costoUnitario,
          fkCompraProducto: { idCompraProducto },
          fkProducto: { idProducto: item.idProducto! },
          fkUbicacion: { idUbicacion: item.idUbicacion }
        };

        return this.detalleService.crear(payload);
      });

    Promise.all(requests.map(r => r.toPromise()))
      .then(detalles => {

        detalles.forEach((detalle: any, idx: number) => {
          const item = this.items[idx];

          this.inventarioService.guardar({
            tipo: 'Compra',
            cantidadEntrada: item.cantidad,
            cantidadSalida: 0,
            referenciaTipo: 'CompraDetalle',
            referenciaId: detalle.idCompraProductoDetalle,
            fkProducto: { idProducto: item.idProducto! },
            fkUbicacion: { idUbicacion: item.idUbicacion },
            fkProductoSerial: null
          }).subscribe();

          if (item.esConSerial) {
            item.seriales.forEach(serial => {
              this.serialService.crearProductoSerial({
                serial,
                estado: 'Disponible',
                fkProducto: { idProducto: item.idProducto! }
              }).subscribe();
            });
          }
        });

        this.alert.close(loadingId);
        this.alert.toast('success', 'Compra registrada correctamente');
        this.cancelar();
      })
      .catch(() => {
        this.alert.close(loadingId);
        this.alert.error('Error', 'Error guardando detalles');
      });
  }

  cancelar(): void {
    if (confirm('¿Cancelar compra?')) {
      this.items = [];
      this.observaciones = '';
      this.agregarItem();
    }
  }
}
