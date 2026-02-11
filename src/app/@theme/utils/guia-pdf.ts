import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GuiaMovimientoResponseDto } from 'src/app/demo/models/reportes-inventario.model';

export function generarGuiaPdf(g: GuiaMovimientoResponseDto) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const marginX = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 40;

  // ==========================================
  // LOGO Y ENCABEZADO EMPRESA
  // ==========================================

  const logoPath = 'assets/images/logoallien.jpg';

  try {
    doc.addImage(logoPath, 'JPEG', marginX, y, 80, 40);
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error);
  }

  // Nombre de la empresa
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text('ALLIENGNSS', marginX + 95, y + 20);

  // Información de contacto
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Quito - Ecuador', marginX + 95, y + 34);
  doc.text('Tel: 0999999999', marginX + 95, y + 46);

  // ==========================================
  // DATOS DE GUÍA (Derecha)
  // ==========================================

  const guiaX = pageWidth - marginX - 160;

  // Recuadro para el tipo de movimiento
  doc.setFillColor(76, 175, 80); // Verde para traslado
  doc.rect(guiaX - 10, y, 170, 30, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('GUÍA DE TRASLADO', guiaX, y + 20);

  // Número y fecha
  doc.setFillColor(240, 240, 240);
  doc.rect(guiaX - 10, y + 30, 170, 36, 'F');

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.text(`N°: ${String(g.idMovimiento).padStart(6, '0')}`, guiaX, y + 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Fecha: ${formatFecha(g.fechaMovimiento)}`, guiaX, y + 60);

  y += 90;

  // ==========================================
  // LÍNEA SEPARADORA
  // ==========================================
  doc.setDrawColor(76, 175, 80);
  doc.setLineWidth(2);
  doc.line(marginX, y, pageWidth - marginX, y);

  y += 25;

  // ==========================================
  // INFORMACIÓN DE TRASLADO
  // ==========================================

  // Fondo gris claro para la sección de traslado
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(marginX, y, pageWidth - (2 * marginX), 100, 3, 3, 'F');

  y += 15;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(76, 175, 80);
  doc.text('INFORMACIÓN DEL TRASLADO', marginX + 10, y);

  y += 20;

  // Contenedor de origen y destino lado a lado
  const columnWidth = (pageWidth - (2 * marginX) - 40) / 2;

  // ORIGEN (Izquierda)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('ORIGEN:', marginX + 10, y);

  y += 14;

  // Círculo como marcador de ubicación
  doc.setFillColor(41, 128, 185);
  doc.circle(marginX + 15, y - 3, 4, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text(g.ubicacionOrigen?.nombre ?? 'N/A', marginX + 25, y);

  // DESTINO (Derecha)
  const destinoX = marginX + columnWidth + 20;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('DESTINO:', destinoX, y - 14);

  // Círculo como marcador de ubicación
  doc.setFillColor(76, 175, 80);
  doc.circle(destinoX + 5, y - 3, 4, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(76, 175, 80);
  doc.text(g.ubicacionDestino?.nombre ?? 'N/A', destinoX + 15, y);

  // Flecha visual entre origen y destino
  y += 20;
  const arrowY = y;
  const arrowStartX = marginX + 10;
  const arrowEndX = pageWidth - marginX - 10;

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(1.5);
  doc.line(arrowStartX, arrowY, arrowEndX, arrowY);

  // Punta de flecha
  doc.line(arrowEndX, arrowY, arrowEndX - 8, arrowY - 4);
  doc.line(arrowEndX, arrowY, arrowEndX - 8, arrowY + 4);

  y += 25;

  // Usuario responsable
  const u = g.usuario;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Responsable: ${fullName(u?.primerNombre, undefined, u?.primerApellido, undefined)} (${u?.nombreUsuario ?? 'N/A'})`,
    marginX + 10,
    y
  );

  // ==========================================
  // TABLA DE PRODUCTOS
  // ==========================================

  y += 20;

  const body = g.detalles.map(d => ([
    `${d.producto}\n${d.marca} - ${d.tipo}`,
    d.esConSerial ? 'Sí' : 'No',
    String(d.cantidad),
    d.seriales.length > 0 ? 'Ver abajo' : '-',
  ]));

  autoTable(doc, {
    startY: y,
    head: [['Producto', 'Con Serial', 'Cantidad', 'Seriales']],
    body,
    theme: 'striped',
    headStyles: {
      fillColor: [76, 175, 80],
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
      0: { cellWidth: 250 },
      1: { cellWidth: 80, halign: 'center' },
      2: { cellWidth: 80, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 120, halign: 'center', textColor: [100, 100, 100] },
    },
    margin: { left: marginX, right: marginX },
  });

  let y2 = (doc as any).lastAutoTable.finalY + 20;

  // ==========================================
  // SERIALES DETALLADOS
  // ==========================================

  const productosConSerial = g.detalles.filter(d => d.seriales && d.seriales.length > 0);

  if (productosConSerial.length > 0) {
    doc.setFillColor(255, 251, 230);

    productosConSerial.forEach((d, index) => {
      // Calcular altura necesaria
      const numSeriales = d.seriales.length;
      const serialHeight = 35 + (numSeriales * 12);

      // Verificar si necesitamos una nueva página
      if (y2 + serialHeight > doc.internal.pageSize.getHeight() - 100) {
        doc.addPage();
        y2 = 40;
      }

      // Fondo para cada producto
      doc.roundedRect(marginX, y2 - 5, pageWidth - (2 * marginX), serialHeight, 3, 3, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 120, 0);
      doc.text(`SERIALES - ${d.producto} (${d.marca})`, marginX + 10, y2 + 10);

      y2 += 22;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);

      d.seriales.forEach((serial, idx) => {
        doc.text(`${idx + 1}. ${serial}`, marginX + 10, y2);
        y2 += 12;
      });

      y2 += 15;
    });
  }

  // ==========================================
  // OBSERVACIONES
  // ==========================================

  if (g.observaciones?.trim()) {
    // Verificar espacio disponible
    if (y2 + 50 > doc.internal.pageSize.getHeight() - 100) {
      doc.addPage();
      y2 = 40;
    }

    doc.setFillColor(245, 245, 245);
    doc.roundedRect(marginX, y2, pageWidth - (2 * marginX), 50, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Observaciones:', marginX + 10, y2 + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Dividir observaciones en líneas si es muy largo
    const maxWidth = pageWidth - (2 * marginX) - 30;
    const observacionesLines = doc.splitTextToSize(g.observaciones, maxWidth);
    doc.text(observacionesLines, marginX + 10, y2 + 33);

    y2 += 60;
  }

  // ==========================================
  // RESUMEN DE TOTALES
  // ==========================================

  const totalProductos = g.detalles.length;
  const totalUnidades = g.detalles.reduce((sum, d) => sum + d.cantidad, 0);

  // Verificar espacio disponible
  if (y2 + 70 > doc.internal.pageSize.getHeight() - 100) {
    doc.addPage();
    y2 = 40;
  }

  const resumenBoxX = pageWidth - marginX - 200;

  doc.setFillColor(250, 250, 250);
  doc.roundedRect(resumenBoxX, y2, 200, 60, 3, 3, 'F');

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.roundedRect(resumenBoxX, y2, 200, 60, 3, 3, 'S');

  let resumenY = y2 + 20;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('Total Productos:', resumenBoxX + 15, resumenY);
  doc.setFont('helvetica', 'normal');
  doc.text(String(totalProductos), resumenBoxX + 185, resumenY, { align: 'right' });

  resumenY += 20;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(76, 175, 80);
  doc.text('Total Unidades:', resumenBoxX + 15, resumenY);
  doc.setFontSize(12);
  doc.text(String(totalUnidades), resumenBoxX + 185, resumenY, { align: 'right' });

  // ==========================================
  // FIRMAS
  // ==========================================

  y2 += 120;

  // Verificar espacio para firmas
  if (y2 + 80 > doc.internal.pageSize.getHeight() - 80) {
    doc.addPage();
    y2 = 80;
  }

  const firmaWidth = 200;
  const firmaSpacing = (pageWidth - (2 * marginX) - (2 * firmaWidth)) / 3;

  // Firma Entrega
  let firmaX = marginX + firmaSpacing;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  doc.line(firmaX, y2, firmaX + firmaWidth, y2);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('Entregado por:', firmaX, y2 + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Nombre y Firma', firmaX, y2 + 28);

  // Firma Recibe
  firmaX = marginX + (2 * firmaSpacing) + firmaWidth;
  doc.line(firmaX, y2, firmaX + firmaWidth, y2);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('Recibido por:', firmaX, y2 + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Nombre y Firma', firmaX, y2 + 28);

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
  doc.text('Guía de Traslado - ALLIENGNSS', pageWidth / 2, footerY, { align: 'center' });

  // Abrir en otra pestaña
  doc.output('dataurlnewwindow');

  // Si prefieres descargar:
  // doc.save(`guia-traslado-${String(g.idMovimiento).padStart(6, '0')}.pdf`);
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function formatFecha(iso: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  return new Intl.DateTimeFormat('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d);
}

function fullName(p1?: string, p2?: string, a1?: string, a2?: string) {
  return [p1, p2, a1, a2].filter(Boolean).join(' ');
}
