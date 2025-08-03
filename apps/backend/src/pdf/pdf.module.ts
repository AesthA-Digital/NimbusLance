import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
