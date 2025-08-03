import { Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PdfService } from 'src/pdf/pdf.service';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  async create(userId: string, dto: CreateInvoiceDto) {
    const tva = dto.tva ?? 20;
    const amountTTC = dto.amountHT * (1 + tva / 100);

    const invoice = await this.prisma.invoice.create({
      data: {
        ...dto,
        amountTTC,
        tva,
        status: 'DRAFT',
        userId,
      },
    });

    // Générer le PDF et sauvegarder l'URL locale
    const pdfPath = this.pdfService.generate({
      id: invoice.id,
      title: invoice.title,
      amountHT: invoice.amountHT,
      amountTTC: invoice.amountTTC,
      tva: invoice.tva,
    });

    // Enregistrer le chemin du PDF
    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        pdfUrl: pdfPath,
      },
    });

    return {
      ...invoice,
      pdfUrl: pdfPath,
    };
  }

  async findAll(userId: string) {
    return await this.prisma.invoice.findMany({
      where: { userId },
      include: { client: true, project: true },
    });
  }

  async findOne(userId: string, id: string) {
    return await this.prisma.invoice.findFirst({
      where: { id, userId },
      include: { client: true, project: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateInvoiceDto) {
    const updateData: Partial<UpdateInvoiceDto> & { amountTTC?: number } = {
      ...dto,
    };

    if (dto.amountHT !== undefined) {
      const tva = dto.tva ?? 20;
      updateData.amountTTC = dto.amountHT * (1 + tva / 100);
    }

    return await this.prisma.invoice.update({
      where: { id, userId },
      data: updateData,
      include: { client: true, project: true },
    });
  }

  async remove(userId: string, id: string) {
    return await this.prisma.invoice.delete({
      where: { id, userId },
    });
  }
}
