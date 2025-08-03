import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';

interface InvoiceData {
  id: string;
  title: string;
  amountHT: number;
  amountTTC: number;
  tva: number;
}

@Injectable()
export class PdfService {
  generate(invoice: InvoiceData): string {
    const fileName = `invoice-${invoice.id}.pdf`;
    const filePath = path.resolve(__dirname, '../../invoices', fileName);

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text('🧾 Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Title: ${invoice.title}`);
    doc.text(`Montant HT: €${invoice.amountHT}`);
    doc.text(`TVA: ${invoice.tva}%`);
    doc.text(`Montant TTC: €${invoice.amountTTC}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);

    doc.end();

    return filePath;
  }
}
