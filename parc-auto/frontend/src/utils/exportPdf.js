import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const CIPRES = [173, 82, 45]   // cipres-600 #AD522D
const CIPRES_LIGHT = [253, 245, 240] // cipres-50

export function exportToPdf({ title, subtitle, columns, rows, filename }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // En-tête document
  doc.setFillColor(...CIPRES)
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 18, 'F')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('ParcAuto — CIPRES', 14, 7)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(title, 14, 13)

  if (subtitle) {
    doc.setFontSize(8)
    doc.setTextColor(180, 100, 60)
    doc.text(subtitle, 14, 20)
  }

  const startY = subtitle ? 24 : 22

  autoTable(doc, {
    startY,
    head: [columns.map(c => c.header)],
    body: rows.map(row => columns.map(c => {
      const val = c.accessor(row)
      return val ?? '—'
    })),
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: CIPRES,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: { fillColor: CIPRES_LIGHT },
    tableLineColor: [220, 210, 205],
    tableLineWidth: 0.1,
  })

  // Pied de page
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(160)
    doc.setFont('helvetica', 'normal')
    const date = new Date().toLocaleString('fr-FR')
    doc.text(`Exporté le ${date}`, 14, doc.internal.pageSize.getHeight() - 5)
    doc.text(`Page ${i} / ${pageCount}`, doc.internal.pageSize.getWidth() - 28, doc.internal.pageSize.getHeight() - 5)
  }

  doc.save(filename)
}
