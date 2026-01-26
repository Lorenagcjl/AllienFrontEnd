
export interface InventarioMovimiento {
  idInventarioMovimiento?: number;
  fecha?: string; 
  tipo: 'Compra' | 'Venta' | 'Traslado';
  cantidadEntrada: number;
  cantidadSalida: number;
  referenciaTipo: string; 
  referenciaId: number;
  fkProducto: { 
    idProducto: number; 
    nombre?: string; 
  };
  fkProductoSerial?: { 
    idProductoSerial: number; 
    serial?: string; 
  } | null;
  fkUbicacion: { 
    idUbicacion: number; 
    nombre?: string; 
  };
}