import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const CIPRES = [173, 82, 45]
const CIPRES_LIGHT = [253, 245, 240]

function addHeader(doc, title, subtitle) {
  const pageW = doc.internal.pageSize.getWidth()
  doc.setFillColor(...CIPRES)
  doc.rect(0, 0, pageW, 18, 'F')
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
  return subtitle ? 24 : 22
}

function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages()
  const pageH = doc.internal.pageSize.getHeight()
  const pageW = doc.internal.pageSize.getWidth()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(160)
    doc.setFont('helvetica', 'normal')
    doc.text(`Exporté le ${new Date().toLocaleString('fr-FR')}`, 14, pageH - 5)
    doc.text(`Page ${i} / ${pageCount}`, pageW - 28, pageH - 5)
  }
}

function addDataTable(doc, columns, rows, startY) {
  autoTable(doc, {
    startY,
    head: [columns.map(c => c.header)],
    body: rows.map(row => columns.map(c => {
      const val = c.accessor(row)
      return val ?? '—'
    })),
    styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: { fillColor: CIPRES, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' },
    alternateRowStyles: { fillColor: CIPRES_LIGHT },
    tableLineColor: [220, 210, 205],
    tableLineWidth: 0.1,
  })
}

// Convertit le SVG d'un graphique Recharts en PNG data URL via canvas natif
async function svgToPngDataUrl(svgElement) {
  const bbox = svgElement.getBoundingClientRect()
  const clone = svgElement.cloneNode(true)
  clone.setAttribute('width', bbox.width)
  clone.setAttribute('height', bbox.height)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  // Fond blanc explicite
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  bg.setAttribute('width', '100%')
  bg.setAttribute('height', '100%')
  bg.setAttribute('fill', 'white')
  clone.insertBefore(bg, clone.firstChild)

  const svgStr = new XMLSerializer().serializeToString(clone)
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = bbox.width * scale
      canvas.height = bbox.height * scale
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      resolve({ dataUrl: canvas.toDataURL('image/png'), width: bbox.width, height: bbox.height })
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG render failed')) }
    img.src = url
  })
}

export function exportToPdf({ title, subtitle, columns, rows, filename }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const startY = addHeader(doc, title, subtitle)
  addDataTable(doc, columns, rows, startY)
  addFooter(doc)
  doc.save(filename)
}

export async function exportChartToPdf({ title, subtitle, chartElement, filename, columns, rows }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  let currentY = addHeader(doc, title, subtitle)

  const svgEl = chartElement.querySelector('svg')
  if (svgEl) {
    const { dataUrl, width, height } = await svgToPngDataUrl(svgEl)
    const maxW = pageW - 28
    const imgH = Math.min((height * maxW) / width, 110)
    doc.addImage(dataUrl, 'PNG', 14, currentY, maxW, imgH)
    currentY += imgH + 6
  }

  if (columns && rows && rows.length > 0) {
    addDataTable(doc, columns, rows, currentY)
  }

  addFooter(doc)
  doc.save(filename)
}
