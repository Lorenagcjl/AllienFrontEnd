import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { CatalogoService } from 'src/app/@theme/services/catalogo.service';
import { DetalleCatalogoService } from 'src/app/@theme/services/detalle-catalogo.service';

import { CatalogoRequestDto, CatalogoResponseDto } from 'src/app/demo/models/catalogo.model';
import { DetalleCatalogoRequestDto, DetalleCatalogoResponseDto } from 'src/app/demo/models/detalle-catalogo.model';

type CatalogoVm = CatalogoResponseDto & { detalles?: DetalleCatalogoResponseDto[] };

@Component({
  selector: 'app-catalogo-management.component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo-management.component.html',
  styleUrl: './catalogo-management.component.scss',
})
export default class CatalogoManagementComponent implements OnInit {
  private readonly catalogoApi = inject(CatalogoService);
  private readonly detalleApi = inject(DetalleCatalogoService);
  private readonly cdr = inject(ChangeDetectorRef);

  catalogs: CatalogoVm[] = [];
  filteredCatalogs: CatalogoVm[] = [];

  isLoadingCatalogs = false;
  isSavingCatalog = false;
  isSavingDetail = false;

  expandedRows = new Set<number>();

  // UI state
  searchTerm = '';
  isCatalogModalOpen = false;
  isDetailModalOpen = false;

  // Forms model (mantenemos tu forma)
  catalogModalTitle = 'Nuevo Catálogo';
  catalogFormModel: Partial<CatalogoVm> = {
    idCatalogo: undefined,
    nombreCatalogo: '',
    descripcion: '',
    esActivo: true,
  };

  detailModalTitle = 'Nuevo Detalle';
  detailFormModel: {
    idDetalleCatalogo?: number;
    catalogId?: number;
    codigoDetalle: string;
    descripcion: string;
    valorNumerico: number;
    orden: number;
    esActivo: boolean;
  } = {
      idDetalleCatalogo: undefined,
      catalogId: undefined,
      codigoDetalle: '',
      descripcion: '',
      valorNumerico: 0,
      orden: 1,
      esActivo: true,
    };

  // cache opcional para no pegarle al endpoint cada vez que expandes/colapsas
  private readonly detailsLoaded = new Set<number>();

  ngOnInit(): void {
    this.loadCatalogs();
  }

  // -----------------------
  // DATA LOAD
  // -----------------------
  private loadCatalogs(): void {
    this.isLoadingCatalogs = true;

    this.catalogoApi
      .listar()
      .pipe(finalize(() => {
        this.isLoadingCatalogs = false;
        this.cdr.detectChanges(); // 👈 clave
      }))
      .subscribe({
        next: (data) => {
          this.catalogs = data.map(c => ({ ...c, detalles: [] }));
          this.filteredCatalogs = [...this.catalogs]; // evita quedarse vacío
          this.renderCatalogs();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          alert('Error cargando catálogos.');
        },
      });
  }

  private loadDetailsForCatalog(catalog: CatalogoVm): void {
    if (this.detailsLoaded.has(catalog.idCatalogo)) return;

    this.detalleApi
      .listarPorNombreCatalogo(catalog.nombreCatalogo)
      .pipe(finalize(() => this.cdr.detectChanges()))
      .subscribe({
        next: (details) => {
          const detalles = details ?? [];

          this.catalogs = this.catalogs.map(c =>
            c.idCatalogo === catalog.idCatalogo ? { ...c, detalles } : c
          );

          this.detailsLoaded.add(catalog.idCatalogo);
          this.renderCatalogs();

          // por si el catalog que tenías en mano ya quedó “viejo”
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          alert(`Error cargando detalles para: ${catalog.nombreCatalogo}`);

          this.catalogs = this.catalogs.map(c =>
            c.idCatalogo === catalog.idCatalogo ? { ...c, detalles: [] } : c
          );

          this.renderCatalogs();
          this.cdr.detectChanges();
        },
      });
  }

  // -----------------------
  // FILTER / UI
  // -----------------------
  renderCatalogs(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredCatalogs = this.catalogs.filter((c) => {
      const n = (c.nombreCatalogo ?? '').toLowerCase();
      const d = (c.descripcion ?? '').toLowerCase();
      return !term || n.includes(term) || d.includes(term);
    });
  }

  filterCatalogs(): void {
    this.renderCatalogs();
  }

  isExpanded(catalogId: number): boolean {
    return this.expandedRows.has(catalogId);
  }

  toggleRow(catalogId: number): void {
    const next = new Set(this.expandedRows);

    if (next.has(catalogId)) {
      next.delete(catalogId);
      this.expandedRows = next;
      this.cdr.detectChanges();
      return;
    }

    next.add(catalogId);
    this.expandedRows = next;

    const catalog = this.catalogs.find((c) => c.idCatalogo === catalogId);
    if (catalog) this.loadDetailsForCatalog(catalog);

    this.cdr.detectChanges();
  }

  getSortedDetails(catalog: CatalogoVm): DetalleCatalogoResponseDto[] {
    return [...(catalog.detalles ?? [])].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  }

  // Modal overlay click
  onOverlayClick(_: MouseEvent, which: 'catalog' | 'detail'): void {
    if (which === 'catalog') this.closeCatalogModal();
    if (which === 'detail') this.closeDetailModal();
  }

  // -----------------------
  // CRUD CATÁLOGO
  // -----------------------
  openCatalogModal(catalogId?: number): void {
    if (catalogId) {
      const catalog = this.catalogs.find((c) => c.idCatalogo === catalogId);
      if (!catalog) return;

      this.catalogModalTitle = 'Editar Catálogo';
      this.catalogFormModel = {
        idCatalogo: catalog.idCatalogo,
        nombreCatalogo: catalog.nombreCatalogo,
        descripcion: catalog.descripcion ?? '',
        esActivo: catalog.esActivo,
      };
    } else {
      this.catalogModalTitle = 'Nuevo Catálogo';
      this.catalogFormModel = {
        idCatalogo: undefined,
        nombreCatalogo: '',
        descripcion: '',
        esActivo: true,
      };
    }

    this.isCatalogModalOpen = true;
  }

  closeCatalogModal(): void {
    this.isCatalogModalOpen = false;
  }

  saveCatalog(): void {
    if (this.isSavingCatalog) return; // 👈 evita doble click
    this.isSavingCatalog = true;

    const nombre = (this.catalogFormModel.nombreCatalogo ?? '').trim().toUpperCase();
    const descripcion = (this.catalogFormModel.descripcion ?? '').trim();
    const esActivo = !!this.catalogFormModel.esActivo;

    if (!nombre) {
      alert('El nombre del catálogo es requerido');
      this.isSavingCatalog = false;
      return;
    }

    const dto: CatalogoRequestDto = { nombreCatalogo: nombre, descripcion, esActivo };
    const id = this.catalogFormModel.idCatalogo;

    const request$ = id
      ? this.catalogoApi.actualizar(id, dto)
      : this.catalogoApi.crear(dto);

    request$
      .pipe(finalize(() => {
        this.isSavingCatalog = false;
        this.cdr.detectChanges(); // 👈 clave
      }))
      .subscribe({
        next: (resp) => {
          if (id) {
            const idx = this.catalogs.findIndex(c => c.idCatalogo === id);
            if (idx >= 0) {
              // si cambió el nombre, invalida detalles cacheados
              const nameChanged = this.catalogs[idx].nombreCatalogo !== resp.nombreCatalogo;
              this.catalogs[idx] = { ...this.catalogs[idx], ...resp };

              if (nameChanged) {
                this.catalogs[idx].detalles = [];
                this.detailsLoaded.delete(id);
              }
            }
          } else {
            this.catalogs.unshift({ ...(resp as any), detalles: [] });
          }

          this.closeCatalogModal();
          this.renderCatalogs();
        },
        error: (err) => {
          console.error(err);
          alert(id ? 'Error actualizando catálogo.' : 'Error creando catálogo.');
        },
      });
  }

  editCatalog(catalogId: number): void {
    this.openCatalogModal(catalogId);
  }

  deleteCatalog(catalogId: number): void {
    const catalog = this.catalogs.find((c) => c.idCatalogo === catalogId);
    if (!catalog) return;

    const hasDetails = (catalog.detalles?.length ?? 0) > 0;
    const msg = hasDetails
      ? `El catálogo "${catalog.nombreCatalogo}" tiene ${catalog.detalles!.length} detalle(s). ¿Estás seguro de eliminarlo?`
      : `¿Estás seguro de eliminar el catálogo "${catalog.nombreCatalogo}"?`;

    if (!confirm(msg)) return;

    this.catalogoApi.eliminar(catalogId).subscribe({
      next: () => {
        this.catalogs = this.catalogs.filter((c) => c.idCatalogo !== catalogId);
        this.filteredCatalogs = this.filteredCatalogs.filter((c) => c.idCatalogo !== catalogId);
        this.expandedRows.delete(catalogId);
        this.detailsLoaded.delete(catalogId);
        this.renderCatalogs();
      },
      error: (err) => {
        console.error(err);
        alert('Error eliminando catálogo.');
      },
    });
  }

  // -----------------------
  // CRUD DETALLE
  // -----------------------
  openDetailModal(catalogId: number, detailId?: number): void {
    const catalog = this.catalogs.find((c) => c.idCatalogo === catalogId);
    if (!catalog) return;

    // si está expandido y no cargó detalles aún, los cargamos (para poder editar)
    if (!this.detailsLoaded.has(catalogId)) this.loadDetailsForCatalog(catalog);

    if (detailId) {
      const detail = (catalog.detalles ?? []).find((d) => d.idDetalleCatalogo === detailId);
      if (!detail) return;

      this.autoCodeLocked = false; // ✅ en editar: respeta el código

      this.detailModalTitle = 'Editar Detalle';
      this.detailFormModel = {
        idDetalleCatalogo: detail.idDetalleCatalogo,
        catalogId,
        codigoDetalle: (detail.codigoDetalle ?? '').toUpperCase(),
        descripcion: detail.descripcion,
        valorNumerico: detail.valorNumerico,
        orden: detail.orden,
        esActivo: detail.esActivo,
      };
    } else {
      const nextOrder = (catalog.detalles?.length ?? 0) + 1;

      this.autoCodeLocked = true; // ✅ en nuevo: autogeneración activa

      this.detailModalTitle = 'Nuevo Detalle';
      this.detailFormModel = {
        idDetalleCatalogo: undefined,
        catalogId,
        codigoDetalle: this.generateCodeFromDescription(''), // ✅ arranca en AAA
        descripcion: '',
        valorNumerico: 0,
        orden: nextOrder,
        esActivo: true,
      };
    }

    this.isDetailModalOpen = true;
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.detailFormModel = {
      idDetalleCatalogo: undefined,
      catalogId: undefined,
      codigoDetalle: 'AAA',
      descripcion: '',
      valorNumerico: 0,
      orden: 1,
      esActivo: true,
    };
    this.autoCodeLocked = true;
  }

  saveDetail(): void {
    if (this.isSavingDetail) return; // 👈 evita doble click
    this.isSavingDetail = true;

    const catalogId = this.detailFormModel.catalogId;
    if (!catalogId) {
      this.isSavingDetail = false;
      return;
    }

    const codigo = (this.detailFormModel.codigoDetalle ?? '').trim().toUpperCase();
    const descripcion = (this.detailFormModel.descripcion ?? '').trim();
    const valor = Number(this.detailFormModel.valorNumerico ?? 0);
    const orden = Number(this.detailFormModel.orden ?? 1);
    const esActivo = !!this.detailFormModel.esActivo;

    if (!codigo || !descripcion) {
      alert('El código y la descripción son requeridos');
      this.isSavingDetail = false;
      return;
    }

    const catalog = this.catalogs.find(c => c.idCatalogo === catalogId);
    if (!catalog) {
      this.isSavingDetail = false;
      return;
    }

    const dto: DetalleCatalogoRequestDto = {
      idDetalleCatalogo: this.detailFormModel.idDetalleCatalogo,
      codigoDetalle: codigo,
      descripcion,
      valorNumerico: isFinite(valor) ? valor : 0,
      orden: isFinite(orden) ? orden : 1,
      esActivo,
      idCatalogo: catalogId,
    };

    const detailId = this.detailFormModel.idDetalleCatalogo;

    const request$ = detailId
      ? this.detalleApi.actualizar(detailId, dto)
      : this.detalleApi.crear(dto);

    request$
      .pipe(finalize(() => {
        this.isSavingDetail = false;
        this.cdr.detectChanges(); // 👈 clave
      }))
      .subscribe({
        next: (resp) => {
          const catalogId = this.detailFormModel.catalogId!;
          const detailId = this.detailFormModel.idDetalleCatalogo;

          this.catalogs = this.catalogs.map(c => {
            if (c.idCatalogo !== catalogId) return c;

            const current = c.detalles ?? [];

            const nextDetalles = detailId
              ? current.map(d => d.idDetalleCatalogo === resp.idDetalleCatalogo ? resp : d)
              : [...current, resp];

            return { ...c, detalles: nextDetalles };
          });

          this.detailsLoaded.add(catalogId);
          this.closeDetailModal();

          // expand inmutable
          const nextSet = new Set(this.expandedRows);
          nextSet.add(catalogId);
          this.expandedRows = nextSet;

          this.renderCatalogs();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          alert(detailId ? 'Error actualizando detalle.' : 'Error creando detalle.');
        },
      });
  }

  editDetail(catalogId: number, detailId: number): void {
    this.openDetailModal(catalogId, detailId);
  }

  deleteDetail(catalogId: number, detailId: number): void {
    const catalog = this.catalogs.find((c) => c.idCatalogo === catalogId);
    if (!catalog) return;

    const detail = (catalog.detalles ?? []).find((d) => d.idDetalleCatalogo === detailId);
    if (!detail) return;

    if (!confirm(`¿Estás seguro de eliminar el detalle "${detail.descripcion}"?`)) return;

    this.detalleApi.eliminar(detailId).subscribe({
      next: () => {
        this.catalogs = this.catalogs.map(c => {
          if (c.idCatalogo !== catalogId) return c;
          return { ...c, detalles: (c.detalles ?? []).filter(d => d.idDetalleCatalogo !== detailId) };
        });

        this.renderCatalogs();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        alert('Error eliminando detalle.');
      },
    });
  }








  // -----------------------
  // REGLAS: MAYÚSCULAS + AUTOCÓDIGO
  // -----------------------

  private autoCodeLocked = true; // true = se autogenera; false = usuario editó manualmente

  toUpper(value: string): string {
    return (value ?? '').toUpperCase();
  }

  onCatalogNameInput(value: string): void {
    // siempre mayúsculas mientras escribe
    this.catalogFormModel.nombreCatalogo = this.toUpper(value);
  }

  /**
   * Cuando el usuario escribe la descripción del detalle:
   * - se guarda el texto
   * - si el usuario NO ha editado el código manualmente, autogenera código
   */
  onDetailDescriptionInput(value: string): void {
    this.detailFormModel.descripcion = value;

    if (!this.autoCodeLocked) return; // ya fue editado manualmente

    this.detailFormModel.codigoDetalle = this.generateCodeFromDescription(value);
  }

  /**
   * Cuando el usuario edita manualmente el código:
   * - se convierte a mayúsculas
   * - se desactiva autogeneración
   */
  onDetailCodeManualEdit(value: string): void {
    this.autoCodeLocked = false;
    this.detailFormModel.codigoDetalle = this.toUpper(value);
  }

  /**
   * Genera un código en MAYÚSCULAS a partir de la descripción
   * - quita acentos
   * - letras/números solamente
   * - si hay varias palabras: iniciales (hasta 4)
   * - si hay una palabra: primeros 4 caracteres
   * - mínimo 3 caracteres (rellena con 'X')
   */
  private generateCodeFromDescription(desc: string): string {
    const clean = (desc ?? '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quita acentos
      .replace(/[^A-Z0-9\s]+/g, ' ')   // deja A-Z, 0-9 y espacios
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean) return 'AAA'; // fallback mínimo 3

    const parts = clean.split(' ').filter(Boolean);

    let code = '';
    if (parts.length >= 2) {
      code = parts.map(p => p[0]).join('').slice(0, 4);
    } else {
      code = parts[0].slice(0, 4);
    }

    // mínimo 3 caracteres
    code = code.padEnd(3, 'X');

    return code;
  }

}
