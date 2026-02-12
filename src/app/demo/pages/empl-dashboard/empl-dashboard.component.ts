// angular import
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from 'src/app/@theme/services/alert.service';
import { UbicacionService } from 'src/app/@theme/services/ubicacion.service';
import { InventarioRepostService } from 'src/app/@theme/services/inventario-repost.service';
import { SerialEnStockDto, StockUbicacionDto } from '../../models/reportes-inventario.model';
import { Ubicacion } from '../../models/ubicacion.model';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './empl-dashboard.component.html',
  styleUrls: ['./empl-dashboard.component.scss']
})
export default class DashboardComponent implements OnInit {
  private alertService = inject(AlertService);
  private ubicacionService = inject(UbicacionService);
  private inventarioService = inject(InventarioRepostService);
  private cdr = inject(ChangeDetectorRef);
  private serialesCache = new Map<number, SerialEnStockDto[]>();
  trackBySerial = (_: number, s: SerialEnStockDto) => s.idProductoSerial;


  ubicaciones: Ubicacion[] = [];
  ubicacionSeleccionadaId: number | null = null;
  stock: StockUbicacionDto[] = [];
  seriales: SerialEnStockDto[] = [];
  cargarSeriales = false;

  ngOnInit(): void {
    this.cargarInicial();
  }

  cargarInicial(): void {
    this.inventarioService.stockPorUbicacion()
      .pipe(
        switchMap((stockGlobal) => {
          this.stock = stockGlobal ?? [];
          this.cdr.detectChanges(); // opcional: si también te pasaba con stock inicial
          return this.ubicacionService.listarUbicaciones();
        })
      )
      .subscribe({
        next: (ubs) => {
          this.ubicaciones = ubs ?? [];
          this.ubicacionSeleccionadaId = null;

          this.cdr.detectChanges(); // <- CLAVE para que el select pinte de inmediato
        },
        error: (err) => {
          this.alertService.error('Error', this.alertService.getErrorMessage(err, 'No se pudo cargar el dashboard'));
        }
      });
  }

  onCambiarUbicacion(id: number | null): void {
    this.ubicacionSeleccionadaId = id;

    const stock$ = id
      ? this.inventarioService.stockPorUnaUbicacion(id)
      : this.inventarioService.stockPorUbicacion();

    stock$.subscribe({
      next: (data) => {
        this.stock = data ?? [];
        this.seriales = [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.alertService.error('Error', this.alertService.getErrorMessage(err, 'No se pudo cargar el stock'));
      }
    });

    if (this.cargarSeriales && id) {
      this.inventarioService.serialesDisponiblesEnUbicacion(id)
        .subscribe({
          next: (s) => {
            this.seriales = s ?? [];
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.alertService.error('Error', this.alertService.getErrorMessage(err, 'No se pudieron cargar seriales'));
          }
        });
    }
  }

  // Métodos de cálculo
  getTotalProductos(): number {
    const productosUnicos = new Set(this.stock.map(s => s.idProducto));
    return productosUnicos.size;
  }

  getTotalStock(): number {
    return this.stock.reduce((sum, item) => sum + item.stock, 0);
  }

  getTotalUbicaciones(): number {
    if (this.ubicacionSeleccionadaId) return 1;
    const ubicacionesUnicas = new Set(this.stock.map(s => s.idUbicacion));
    return ubicacionesUnicas.size;
  }

  getStockStatus(): { icon: string; label: string; subtitle: string } {
    const total = this.getTotalStock();
    if (total === 0) return { icon: 'error', label: 'Sin stock', subtitle: 'Requiere atención' };
    if (total < 10) return { icon: 'warning', label: 'Stock bajo', subtitle: 'Considerar reposición' };
    if (total < 50) return { icon: 'check_circle', label: 'Stock normal', subtitle: 'En buen estado' };
    return { icon: 'verified', label: 'Stock óptimo', subtitle: 'Excelente nivel' };
  }

  getStockPercentage(stock: number): number {
    const max = Math.max(...this.stock.map(s => s.stock), 10);
    return (stock / max) * 100;
  }

  getProductIcon(producto: string): string {
    const productLower = producto.toLowerCase();
    if (productLower.includes('trip')) return 'satellite_alt';
    if (productLower.includes('tripod')) return 'camera_outdoor';
    if (productLower.includes('gps')) return 'gps_fixed';
    return 'inventory_2';
  }

  getResumenPorUbicacion(): any[] {
    const ubicacionesMap = new Map<number, { nombre: string; total: number; productos: number }>();

    this.stock.forEach(item => {
      if (!ubicacionesMap.has(item.idUbicacion)) {
        ubicacionesMap.set(item.idUbicacion, {
          nombre: item.ubicacion,
          total: 0,
          productos: 0
        });
      }
      const ub = ubicacionesMap.get(item.idUbicacion)!;
      ub.total += item.stock;
      ub.productos++;
    });

    const totalGeneral = this.getTotalStock();
    return Array.from(ubicacionesMap.values())
      .map(ub => ({
        ...ub,
        percentage: totalGeneral > 0 ? (ub.total / totalGeneral) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }

  getTopProductos(): any[] {
    const productosMap = new Map<number, { nombre: string; total: number }>();

    this.stock.forEach(item => {
      if (!productosMap.has(item.idProducto)) {
        productosMap.set(item.idProducto, { nombre: item.producto, total: 0 });
      }
      productosMap.get(item.idProducto)!.total += item.stock;
    });

    return Array.from(productosMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }

  getStockBajo(): StockUbicacionDto[] {
    return this.stock.filter(item => item.stock > 0 && item.stock < 3);
  }

  serialesVisibles = false;
  serialesCargando = false;
  productoSeleccionado?: { idProducto: number; producto: string; ubicacion: string; idUbicacion: number };

  serialesFiltrados: SerialEnStockDto[] = [];

  verSerialesDeItem(item: StockUbicacionDto): void {
    this.productoSeleccionado = {
      idProducto: item.idProducto,
      producto: item.producto,
      ubicacion: item.ubicacion,
      idUbicacion: item.idUbicacion
    };

    this.serialesVisibles = true;
    this.serialesCargando = true;

    const cached = this.serialesCache.get(item.idUbicacion);
    if (cached) {
      this.seriales = cached;
      this.serialesFiltrados = cached.filter(x => x.idProducto === item.idProducto);
      this.serialesCargando = false;
      this.cdr.detectChanges();
      return;
    }

    this.inventarioService.serialesDisponiblesEnUbicacion(item.idUbicacion)
      .subscribe({
        next: (s) => {
          const data = s ?? [];
          this.serialesCache.set(item.idUbicacion, data);

          this.seriales = data;
          this.serialesFiltrados = data.filter(x => x.idProducto === item.idProducto);

          this.serialesCargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.serialesCargando = false;
          this.alertService.error('Error', this.alertService.getErrorMessage(err, 'No se pudieron cargar seriales'));
        }
      });
  }

  cerrarSeriales(): void {
    this.serialesVisibles = false;
    this.serialesFiltrados = [];
    this.productoSeleccionado = undefined;
  }
}
