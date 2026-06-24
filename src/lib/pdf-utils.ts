import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generateReceiptPDF(order: any, store: any, settings: any): boolean {
  if (!order) return false;
  try {
    const doc = new jsPDF()
    const currency = settings?.currencySymbol || '₹'

    // Color Palette - Slate & Accent
    const primaryColor: [number, number, number] = [11, 15, 25] // #0B0F19 (deep slate)
    
    let accentColor: [number, number, number] = [217, 119, 6] // #D97706 (amber-600)
    if (settings?.accentColor) {
      const cleanHex = settings.accentColor.replace('#', '');
      if (cleanHex.length === 6) {
        const r = parseInt(cleanHex.slice(0, 2), 16);
        const g = parseInt(cleanHex.slice(2, 4), 16);
        const b = parseInt(cleanHex.slice(4, 6), 16);
        accentColor = [r, g, b];
      } else if (cleanHex.length === 3) {
        const r = parseInt(cleanHex[0] + cleanHex[0], 16);
        const g = parseInt(cleanHex[1] + cleanHex[1], 16);
        const b = parseInt(cleanHex[2] + cleanHex[2], 16);
        accentColor = [r, g, b];
      }
    }
    const secondaryTextColor: [number, number, number] = [100, 116, 139] // Slate-500
    const borderLineColor: [number, number, number] = [226, 232, 240] // Slate-200
 
    // 1. Company Brand / Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    const storeName = (store?.name || 'BARRELFLOW').toUpperCase()
    doc.text(storeName, 14, 22)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2])
    doc.text(settings?.receiptHeader || 'Premium Fine Wines & Spirits Boutique', 14, 28)
    doc.text('GSTIN: 27AABCB1234F1Z8 • License No: L-1002-BFS', 14, 33)

    // 2. Invoice Meta Header (Right Aligned)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2])
    doc.text('TAX INVOICE', 200 - 14, 22, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.text(`Invoice No: ${order.invoiceNumber}`, 200 - 14, 28, { align: 'right' })
    
    let formattedDate = ''
    try {
      formattedDate = new Date(order.createdAt).toLocaleString('en-IN')
    } catch {
      formattedDate = String(order.createdAt)
    }
    doc.text(`Date: ${formattedDate}`, 200 - 14, 33, { align: 'right' })
    doc.text(`Payment: ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'N/A'}`, 200 - 14, 38, { align: 'right' })

    // Divider line
    doc.setDrawColor(borderLineColor[0], borderLineColor[1], borderLineColor[2])
    doc.setLineWidth(0.5)
    doc.line(14, 44, 200 - 14, 44)

    // 3. Billing Info Section (Two Columns)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('Billed From:', 14, 52)
    doc.text('Billed To / Customer:', 100, 52)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.text(store?.name || 'BarrelFlow Boutique Store', 14, 57)
    doc.text(store?.address || 'Louisville Row, Whiskey Row, KY', 14, 61)
    doc.text(store?.phone ? `Phone: ${store.phone}` : 'Phone: +1 (555) 728-1928', 14, 65)

    const phoneVal = order.customerPhone || 'Walk-in Customer'
    const emailVal = order.customerEmail || 'N/A'
    doc.text(`Phone: ${phoneVal}`, 100, 57)
    doc.text(`Email: ${emailVal}`, 100, 61)
    doc.text(`Status: Completed`, 100, 65)

    // 4. Products Table (jspdf-autotable)
    const tableHeaders = [['#', 'Item Description', 'Unit Price', 'Qty', 'VAT / Tax', 'Total']]
    const tableRows = (order.items || []).map((item: any, idx: number) => [
      idx + 1,
      item.productName || 'Unknown Product',
      `${currency}${(item.unitPrice || 0).toFixed(2)}`,
      item.quantity || 0,
      `${item.taxRate || 0}%`,
      `${currency}${(item.lineTotal || 0).toFixed(2)}`
    ])

    autoTable(doc, {
      startY: 72,
      head: tableHeaders,
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 80 },
        2: { cellWidth: 28, halign: 'right' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 28, halign: 'right' },
      },
      margin: { left: 14, right: 14 }
    })

    // 5. Invoice Totals Summary
    const finalY = (doc as any).lastAutoTable.finalY + 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)

    doc.text('Subtotal:', 130, finalY)
    doc.text(`${currency}${(order.subtotal || 0).toFixed(2)}`, 200 - 14, finalY, { align: 'right' })

    doc.text('VAT / Tax amount:', 130, finalY + 5)
    doc.text(`${currency}${(order.taxAmount || 0).toFixed(2)}`, 200 - 14, finalY + 5, { align: 'right' })

    const discountAmount = order.discountAmount || 0
    if (discountAmount > 0) {
      doc.text('Applied Discount:', 130, finalY + 10)
      doc.text(`-${currency}${discountAmount.toFixed(2)}`, 200 - 14, finalY + 10, { align: 'right' })
    }

    const totalLineY = discountAmount > 0 ? finalY + 15 : finalY + 10
    doc.setDrawColor(borderLineColor[0], borderLineColor[1], borderLineColor[2])
    doc.line(130, totalLineY - 3, 200 - 14, totalLineY - 3)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2])
    doc.text('Total Amount (INR):', 130, totalLineY + 2)
    doc.text(`${currency}${(order.totalAmount || 0).toFixed(2)}`, 200 - 14, totalLineY + 2, { align: 'right' })

    // 6. Warnings & Footer
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2])
    const footerMsg1 = 'Statutory Warning: Alcohol is injurious to health. Please drink responsibly. Don\'t drink and drive.'
    doc.text(footerMsg1, 100, 276, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    const footerMsg2 = settings?.receiptFooter || 'Thank you for your business! Please visit again.'
    doc.text(footerMsg2, 100, 281, { align: 'center' })

    doc.save(`receipt-${order.invoiceNumber}.pdf`)
    return true
  } catch (err) {
    console.error('PDF generation error:', err)
    return false
  }
}
