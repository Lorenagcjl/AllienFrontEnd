import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type IvaGlobalConfig = {
  taxRate: number;               // porcentaje, ej: 15 (NO 0.15)
  idDetalleCatalogo?: number | null;
  includeTax?: boolean;
  showSeparate?: boolean;
  isCustom?: boolean;
};

const STORAGE_KEY = 'iva_global_config_v1';

@Injectable({
  providedIn: 'root',
})
export class IvaConfigGlobalService {
  private readonly subject = new BehaviorSubject<IvaGlobalConfig>(this.read());
  readonly config$ = this.subject.asObservable();

  get snapshot(): IvaGlobalConfig {
    return this.subject.value;
  }

  setConfig(cfg: IvaGlobalConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    this.subject.next(cfg);
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.subject.next({ taxRate: 0 });
  }

  private read(): IvaGlobalConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { taxRate: 0 };
      const obj = JSON.parse(raw);

      const taxRate = Number(obj?.taxRate ?? 0);
      return {
        taxRate: Number.isFinite(taxRate) ? taxRate : 0,
        idDetalleCatalogo: obj?.idDetalleCatalogo ?? null,
        includeTax: !!obj?.includeTax,
        showSeparate: obj?.showSeparate ?? true,
        isCustom: !!obj?.isCustom,
      };
    } catch {
      return { taxRate: 0 };
    }
  }
}
