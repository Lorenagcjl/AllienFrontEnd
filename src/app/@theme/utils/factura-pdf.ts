import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FacturaVentaResponse } from 'src/app/demo/models/factura-venta.model';

export function generarFacturaPdf(f: FacturaVentaResponse) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const marginX = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 40;

  // ==========================================
  // LOGO Y ENCABEZADO EMPRESA
  // ==========================================

  // Agregar logo (asegúrate de que la ruta sea correcta en tu proyecto)
  const logoPath = 'assets/images/logoallien.jpg';

  try {
    // Logo en la esquina superior izquierda
    doc.addImage(logoPath, 'JPEG', marginX, y, 80, 40); // Ajusta el tamaño según tu logo
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error);
  }

  // Nombre de la empresa al lado del logo
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 128, 185); // Color azul corporativo
  doc.text('ALLIENGNSS', marginX + 95, y + 20);

  // Información de contacto
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Quito - Ecuador', marginX + 95, y + 34);
  doc.text('Tel: 0999999999', marginX + 95, y + 46);

  // ==========================================
  // DATOS DE FACTURA (Derecha)
  // ==========================================

  const facturaX = pageWidth - marginX - 160;

  // Recuadro para el número de factura
  doc.setFillColor(41, 128, 185);
  doc.rect(facturaX - 10, y, 170, 30, 'F');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('FACTURA', facturaX, y + 20);

  // Número y fecha
  doc.setFillColor(240, 240, 240);
  doc.rect(facturaX - 10, y + 30, 170, 36, 'F');

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.text(`N°: ${f.numeroFactura}`, facturaX, y + 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Fecha: ${formatFecha(f.fechaVenta)}`, facturaX, y + 60);

  y += 90;

  // ==========================================
  // LÍNEA SEPARADORA
  // ==========================================
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(2);
  doc.line(marginX, y, pageWidth - marginX, y);

  y += 25;

  // ==========================================
  // INFORMACIÓN DEL CLIENTE
  // ==========================================

  const c = f.cliente;

  // Fondo gris claro para la sección de cliente
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(marginX, y, pageWidth - (2 * marginX), 80, 3, 3, 'F');

  y += 15;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text('INFORMACIÓN DEL CLIENTE', marginX + 10, y);

  y += 16;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('Cliente:', marginX + 10, y);

  doc.setFont('helvetica', 'normal');
  doc.text(`${fullName(c.primerNombre, c.segundoNombre, c.primerApellido, c.segundoApellido)}`, marginX + 60, y);

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('Documento:', marginX + 10, y);
  doc.setFont('helvetica', 'normal');
  doc.text(c.documento, marginX + 75, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Teléfono:', marginX + 200, y);
  doc.setFont('helvetica', 'normal');
  doc.text(c.telefono, marginX + 255, y);

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('Dirección:', marginX + 10, y);
  doc.setFont('helvetica', 'normal');
  doc.text(c.direccion, marginX + 70, y);

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('Email:', marginX + 10, y);
  doc.setFont('helvetica', 'normal');
  doc.text(c.email, marginX + 45, y);

  y += 20;

  // Vendedor
  const u = f.usuario;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Atendido por: ${fullName(u.primerNombre, undefined, u.primerApellido, undefined)} (${u.nombreUsuario})`, marginX, y);

  // ==========================================
  // TABLA DE PRODUCTOS
  // ==========================================

  y += 20;

  const body = f.detalles.map(d => ([
    `${d.producto.nombre}\n${d.producto.marca} - ${d.producto.tipo}`,
    d.ubicacion?.nombre ?? '-',
    String(d.cantidad),
    money(d.precioUnitario),
    money(d.subtotal),
  ]));

  autoTable(doc, {
    startY: y,
    head: [['Producto', 'Ubicación', 'Cant', 'Precio Unit.', 'Subtotal']],
    body,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 6,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: 220 },
      1: { cellWidth: 100, halign: 'center' },
      2: { cellWidth: 50, halign: 'center' },
      3: { cellWidth: 80, halign: 'right' },
      4: { cellWidth: 80, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: marginX, right: marginX },
  });

  let y2 = (doc as any).lastAutoTable.finalY + 20;

  // ==========================================
  // SERIALES
  // ==========================================

  const serialLines: string[] = [];
  f.detalles.forEach(d => {
    if (d.seriales?.length) {
      serialLines.push(`${d.producto.nombre}: ${d.seriales.join(', ')}`);
    }
  });

  if (serialLines.length) {
    // Fondo para seriales
    const serialHeight = 18 + (serialLines.length * 12);
    doc.setFillColor(255, 251, 230);
    doc.roundedRect(marginX, y2 - 5, pageWidth - (2 * marginX), serialHeight, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 120, 0);
    doc.text('NÚMEROS DE SERIE:', marginX + 10, y2 + 10);

    y2 += 22;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    serialLines.forEach(line => {
      doc.text(line, marginX + 10, y2);
      y2 += 12;
    });

    y2 += 10;
  }

  // ==========================================
  // OBSERVACIONES
  // ==========================================

  if (f.observaciones?.trim()) {
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(marginX, y2, pageWidth - (2 * marginX), 40, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Observaciones:', marginX + 10, y2 + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(f.observaciones, marginX + 10, y2 + 30);

    y2 += 50;
  }

  // ==========================================
  // TOTAL
  // ==========================================

  const totalBoxY = y2 + 10;

  // Recuadro del total
  doc.setFillColor(41, 128, 185);
  doc.roundedRect(pageWidth - marginX - 180, totalBoxY, 180, 40, 3, 3, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL A PAGAR:', pageWidth - marginX - 170, totalBoxY + 18);

  doc.setFontSize(16);
  doc.text(money(f.total), pageWidth - marginX - 170, totalBoxY + 35);

  // ==========================================
  // PIE DE PÁGINA
  // ==========================================

  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(marginX, footerY - 10, pageWidth - marginX, footerY - 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  doc.text('Gracias por su compra - ALLIENGNSS', pageWidth / 2, footerY, { align: 'center' });

  // Abrir en otra pestaña
  doc.output('dataurlnewwindow');

  // Si prefieres descargar:
  // doc.save(`factura-${f.numeroFactura}.pdf`);
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function money(n: number) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(n ?? 0));
}

function formatFecha(iso: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  return new Intl.DateTimeFormat('es-EC', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true
  }).format(d);
}

function fullName(p1?: string, p2?: string, a1?: string, a2?: string) {
  return [p1, p2, a1, a2].filter(Boolean).join(' ');
}
