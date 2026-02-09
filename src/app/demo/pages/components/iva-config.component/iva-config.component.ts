import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { take } from 'rxjs';
import { DetalleCatalogoService } from 'src/app/@theme/services/detalle-catalogo.service';
import { IvaConfigGlobalService } from 'src/app/@theme/services/iva-config-global.service';
import { DetalleCatalogoResponseDto } from 'src/app/demo/models/detalle-catalogo.model';
import { AlertService } from 'src/app/@theme/services/alert.service';

type IvaConfig = {
  taxRate: number;      // porcentaje final (valorNumerico o custom)
  isCustom: boolean;
  showSeparate: boolean;
  includeTax: boolean;
  // opcional: para saber qué IVA de catálogo se eligió
  idDetalleCatalogo?: number | null;
};

@Component({
  selector: 'app-iva-config.component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './iva-config.component.html',
  styleUrl: './iva-config.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class IvaConfigComponent {
  private alertSvc = inject(AlertService);
  private readonly detalleCatalogoService = inject(DetalleCatalogoService);
  private readonly ivaGlobal = inject(IvaConfigGlobalService);

  // ==== IVAs desde BD ====
  readonly ivas = signal<DetalleCatalogoResponseDto[]>([]);
  readonly ivasLoading = signal(false);
  readonly ivasError = signal<string | null>(null);

  // ==== Demo base ====
  readonly baseAmount = 100;

  // ==== Estado ====
  // Selección desde catálogo (guardamos el ID; porcentaje se obtiene por valorNumerico)
  selectedIvaId: number | null = null;

  // “Badge” actual (simulado)
  currentTax = 0;

  // Modo custom
  isCustomMode = false;
  customTaxInput = '';
  customTaxRate = 0;

  showSeparate = true;
  includeTax = false;

  // Preview
  previewSubtotal = 100;
  previewTaxAmount = 0;
  previewTotal = 100;

  constructor() {
    this.cargarIvas();
  }

  // Porcentaje efectivo (catálogo o custom)
  get effectiveTaxRate(): number {
    if (this.isCustomMode) return this.customTaxRate;

    const row = this.ivas().find(x => x.idDetalleCatalogo === this.selectedIvaId);
    return Number(row?.valorNumerico ?? 0);
  }

  // Para mostrar nombre del IVA seleccionado (opcional)
  get selectedIvaLabel(): string {
    if (this.isCustomMode) return 'Personalizado';
    const row = this.ivas().find(x => x.idDetalleCatalogo === this.selectedIvaId);
    return row?.descripcion ?? '-';
  }

  private cargarIvas(): void {
    this.ivasLoading.set(true);
    this.ivasError.set(null);

    this.detalleCatalogoService.listarPorNombreCatalogo('IVA')
      .pipe(take(1))
      .subscribe({
        next: (rows) => {
          const list = (rows ?? [])
            .filter(r => r.esActivo)
            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

          this.ivas.set(list);
          this.ivasLoading.set(false);

          // Default: primero activo
          if (!this.isCustomMode && list.length && this.selectedIvaId == null) {
            this.selectedIvaId = list[0].idDetalleCatalogo;
            this.currentTax = Number(list[0].valorNumerico ?? 0);
          }

          this.recalculatePreview();
        },
        error: (err) => {
          console.error('Error cargando IVAs', err);
          this.ivasError.set('No se pudieron cargar los IVAs.');
          this.ivasLoading.set(false);
        }
      });
  }

  onSelectIva(idDetalleCatalogo: number): void {
    if (this.isCustomMode) return;
    this.selectedIvaId = idDetalleCatalogo;
    this.recalculatePreview();
  }

  onToggleCustom(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.isCustomMode = checked;

    if (checked) {
      // Pre-cargar custom con el IVA seleccionado actual
      const current = this.effectiveTaxRate;
      this.customTaxInput = this.customTaxInput || String(current);
      this.customTaxRate = this.parseRate(this.customTaxInput, current);
    } else {
      // al salir de custom, no toques selectedIvaId, solo recalcula
      this.customTaxInput = '';
      this.customTaxRate = 0;
    }

    this.recalculatePreview();
  }

  onCustomTaxInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.customTaxInput = value;

    if (!this.isCustomMode) return;

    const parsed = this.parseRate(value, this.customTaxRate || 0);
    this.customTaxRate = parsed;
    this.recalculatePreview();
  }

  onShowSeparateChange(event: Event): void {
    this.showSeparate = (event.target as HTMLInputElement).checked;
  }

  onIncludeTaxChange(event: Event): void {
    this.includeTax = (event.target as HTMLInputElement).checked;
    this.recalculatePreview();
  }

  onCancel(): void {
    // Reset simple
    this.isCustomMode = false;
    this.customTaxInput = '';
    this.customTaxRate = 0;
    this.showSeparate = true;
    this.includeTax = false;

    // vuelve al primero si no hay selección
    const list = this.ivas();
    if (list.length && this.selectedIvaId == null) {
      this.selectedIvaId = list[0].idDetalleCatalogo;
    }

    this.recalculatePreview();
  }

  onSave(): void {
  const taxRate = this.effectiveTaxRate; // porcentaje ej: 15

  // 1) Guardar GLOBAL
  this.ivaGlobal.setConfig({
    taxRate,
    idDetalleCatalogo: this.isCustomMode ? null : this.selectedIvaId,
    includeTax: this.includeTax,
    showSeparate: this.showSeparate,
    isCustom: this.isCustomMode,
  });

  // 2) Actualiza badge local
  this.currentTax = taxRate;

  // 3) (Opcional) log
  console.log('IVA global guardado:', this.ivaGlobal.snapshot);

  // 4) Un solo alert (reemplaza alert())
this.alertSvc.success(
  'IVA guardado',
  `IVA guardado

- IVA: ${taxRate.toFixed(2)}%
- Modo: ${this.isCustomMode ? 'Personalizado' : this.selectedIvaLabel}
- Mostrar separado: ${this.showSeparate ? 'Sí' : 'No'}
- Incluir en precios: ${this.includeTax ? 'Sí' : 'No'}`
);

}

  private recalculatePreview(): void {
    const taxRate = this.effectiveTaxRate;

    let subtotal: number;
    let taxAmount: number;
    let total: number;

    if (this.includeTax) {
      total = this.baseAmount;
      subtotal = this.baseAmount / (1 + taxRate / 100);
      taxAmount = total - subtotal;
    } else {
      subtotal = this.baseAmount;
      taxAmount = this.baseAmount * (taxRate / 100);
      total = subtotal + taxAmount;
    }

    this.previewSubtotal = subtotal;
    this.previewTaxAmount = taxAmount;
    this.previewTotal = total;
  }

  private parseRate(input: string, fallback: number): number {
    const num = Number(String(input).replace(',', '.'));
    if (!Number.isFinite(num)) return fallback;
    if (num < 0) return 0;
    if (num > 100) return 100;
    return num;
  }
}
