import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ClientModule } from './client/client.module';
import { ProjectModule } from './project/project.module';
import { InvoiceModule } from './invoice/invoice.module';
import { PdfModule } from './pdf/pdf.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule,
    ClientModule,
    ProjectModule,
    InvoiceModule,
    PdfModule,
  ],
})
export class AppModule {}
