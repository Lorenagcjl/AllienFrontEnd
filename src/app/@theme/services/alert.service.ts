import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private activeLoadingId = 0;

  loading(title = 'Cargando...', text = 'Por favor espera.'): number {
    const id = ++this.activeLoadingId;

    Swal.fire({
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    return id;
  }

  close(loadingId?: number): void {
    // Si me dan token, cierro solo si coincide con el último loading
    if (typeof loadingId === 'number' && loadingId !== this.activeLoadingId) return;
    Swal.close();
  }

  async confirm(
    title = 'Confirmar',
    text = '¿Estás seguro?',
    confirmButtonText = 'Sí',
    cancelButtonText = 'Cancelar'
  ): Promise<boolean> {
    const r = await Swal.fire({
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: true,
    });
    return r.isConfirmed;
  }

  success(title = 'Éxito', text?: string): Promise<any> {
    return Swal.fire({ icon: 'success', title, text });
  }

  warning(title = 'Atención', text?: string): Promise<any> {
    return Swal.fire({ icon: 'warning', title, text });
  }

  error(title = 'Error', text?: string): Promise<any> {
    return Swal.fire({ icon: 'error', title, text });
  }

  getErrorMessage(err: any, fallback = 'Ocurrió un error. Intenta nuevamente.'): string {
    return err?.error?.message || err?.error?.mensaje || err?.message || fallback;
  }

  toast(icon: SweetAlertIcon, title: string, timer = 2000): Promise<any> {
    return Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title,
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
    });
  }
}