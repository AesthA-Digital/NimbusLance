# 📘 NimbusLance – Building a Fullstack Cloud-Ready Freelance SaaS Platform

# 8️⃣ Chapter 7 — Invoice & Quote Module (🧾 PDF Generation & Billing)

## 7.1 ✨ Overview

In this chapter, you'll implement the **Invoice & Quote module**—one of the most essential features of any freelance SaaS platform! Each invoice is connected to a client and optionally a project. Upon creation, we automatically calculate tax (TVA), total amount, and generate a professional-looking PDF file stored locally.

> 💡 **You'll learn how to:**
> - Model invoice data with user, client, and project relationships
> - Automatically calculate tax and total amounts
> - Generate professional PDF invoices using PDFKit
> - Store PDF files locally (ready for AWS S3 later)
> - Implement invoice status workflow (DRAFT → SENT → PAID)
> - Apply secure CRUD operations with user ownership

---

## 7.2 🎯 What You'll Build

By the end of this chapter, you'll have:

- ✅ **Invoice CRUD Operations** - Create, read, update, delete invoices
- ✅ **Automatic Tax Calculation** - TVA computation and total amounts
- ✅ **PDF Generation** - Professional invoice PDFs with PDFKit
- ✅ **Status Management** - Invoice workflow (DRAFT → SENT → PAID)
- ✅ **File Storage** - Local PDF storage (AWS S3 ready)
- ✅ **Secure Ownership** - Users can only access their own invoices
- ✅ **Client & Project Linking** - Invoices connected to business entities

---

## 7.3 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   File System   │
│                 │    │   (NestJS)      │    │   (PDFs)        │
│                 │    │                 │    │                 │
│ 1. Create       │───▶│ 2. Invoice      │───▶│ 3. PDFKit       │
│    Invoice      │    │   Service       │    │   generates     │
│                 │    │   calculates    │    │   PDF file      │
│                 │    │   tax & total   │    │                 │
│ 4. Receive      │◀───│ 5. Store PDF    │◀───│ 6. File saved   │
│    invoice +    │    │   path in DB    │    │   locally       │
│    PDF path     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 7.4 🗃️ Prisma Schema

**Update your `prisma/schema.prisma` with the following:**

```prisma
enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
}

model Invoice {
  id          String        @id @default(uuid())
  title       String
  description String?
  status      InvoiceStatus @default(DRAFT)
  clientId    String
  client      Client        @relation(fields: [clientId], references: [id])
  projectId   String?
  project     Project?      @relation(fields: [projectId], references: [id])
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  amountHT    Float
  tva         Float         @default(20.0)
  amountTTC   Float
  pdfUrl      String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

// Add these relations to existing models
model Client {
  // ... existing fields ...
  invoices Invoice[]
}

model User {
  // ... existing fields ...
  invoices Invoice[]
}

model Project {
  // ... existing fields ...
  invoices Invoice[]
}
```

> 🔗 **Each invoice belongs to a user and client, with optional project linking.**

---

## 7.5 🏗️ Database Migration

**Run the migration inside your backend container:**

```bash
cd apps/backend
npx prisma migrate dev --name add-invoice-model
npx prisma generate
```

**What this does:**
- 📊 Creates the `Invoice` table with all relationships
- 🔄 Adds the `InvoiceStatus` enum
- 🔗 Establishes foreign key relationships
- 📝 Generates updated Prisma Client

---

## 7.6 🗂️ Module Structure

```
apps/backend/src/
├── invoice/
│   ├── dto/
│   │   ├── create-invoice.dto.ts
│   │   └── update-invoice.dto.ts
│   ├── invoice.module.ts
│   ├── invoice.controller.ts
│   └── invoice.service.ts
└── pdf/
    ├── pdf.module.ts
    └── pdf.service.ts
```

---

## 7.7 📦 DTO Definitions

### 7.7.1 📝 CreateInvoiceDto

**File:** `apps/backend/src/invoice/dto/create-invoice.dto.ts`

```typescript
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export class CreateInvoiceDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsNumber()
  amountHT: number;

  @IsOptional()
  @IsNumber()
  tva?: number;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}
```

### 7.7.2 📝 UpdateInvoiceDto

**File:** `apps/backend/src/invoice/dto/update-invoice.dto.ts`

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateInvoiceDto } from './create-invoice.dto';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {}
```

---

## 7.8 🧾 PDF Service (PDF Generation)

### 7.8.1 Install Dependencies

```bash
cd apps/backend
npm install pdfkit
npm install --save-dev @types/pdfkit
```

### 7.8.2 Create PDF Module

**File:** `apps/backend/src/pdf/pdf.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';

@Module({
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
```

### 7.8.3 Implement PDF Service

**File:** `apps/backend/src/pdf/pdf.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  generate(invoice: {
    id: string;
    title: string;
    description?: string;
    amountHT: number;
    amountTTC: number;
    tva: number;
    clientName?: string;
    projectTitle?: string;
  }): string {
    // Create invoices directory if it doesn't exist
    const invoicesDir = path.resolve(__dirname, '../../invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const fileName = `invoice-${invoice.id}.pdf`;
    const filePath = path.join(invoicesDir, fileName);

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    // Pipe to file
    doc.pipe(fs.createWriteStream(filePath));

    // Add content to PDF
    this.addHeader(doc, invoice);
    this.addInvoiceDetails(doc, invoice);
    this.addAmounts(doc, invoice);
    this.addFooter(doc);

    // Finalize PDF
    doc.end();

    return filePath;
  }

  private addHeader(doc: PDFKit.PDFDocument, invoice: any) {
    // Company header
    doc.fontSize(24).text('🧾 NimbusLance Invoice', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).text('Professional Freelance Services', { align: 'center' });
    doc.moveDown(2);

    // Invoice title
    doc.fontSize(18).text(`Invoice: ${invoice.title}`, { underline: true });
    doc.moveDown();
  }

  private addInvoiceDetails(doc: PDFKit.PDFDocument, invoice: any) {
    doc.fontSize(12);
    
    if (invoice.description) {
      doc.text(`Description: ${invoice.description}`);
      doc.moveDown(0.5);
    }

    if (invoice.clientName) {
      doc.text(`Client: ${invoice.clientName}`);
      doc.moveDown(0.5);
    }

    if (invoice.projectTitle) {
      doc.text(`Project: ${invoice.projectTitle}`);
      doc.moveDown(0.5);
    }

    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown(2);
  }

  private addAmounts(doc: PDFKit.PDFDocument, invoice: any) {
    // Amount table
    doc.fontSize(14).text('Amount Details', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12);
    doc.text(`Amount HT: €${invoice.amountHT.toFixed(2)}`);
    doc.text(`TVA (${invoice.tva}%): €${(invoice.amountHT * invoice.tva / 100).toFixed(2)}`);
    doc.moveDown(0.5);
    
    // Total with emphasis
    doc.fontSize(16).text(`Total TTC: €${invoice.amountTTC.toFixed(2)}`, { underline: true });
    doc.moveDown(2);
  }

  private addFooter(doc: PDFKit.PDFDocument) {
    doc.fontSize(10).text('Thank you for your business!', { align: 'center' });
    doc.text('Generated by NimbusLance', { align: 'center' });
  }
}
```

> 🎨 **This creates professional-looking PDF invoices with proper formatting and branding.**

---

## 7.9 ⚙️ Invoice Service (Business Logic)

**File:** `apps/backend/src/invoice/invoice.service.ts`

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  async create(userId: string, dto: CreateInvoiceDto) {
    // Calculate tax and total
    const tva = dto.tva ?? 20.0;
    const amountTTC = dto.amountHT * (1 + tva / 100);

    // Create invoice in database
    const invoice = await this.prisma.invoice.create({
      data: {
        ...dto,
        amountTTC,
        tva,
        status: dto.status ?? 'DRAFT',
        userId,
      },
      include: {
        client: true,
        project: true,
      },
    });

    // Generate PDF
    const pdfPath = this.pdfService.generate({
      id: invoice.id,
      title: invoice.title,
      description: invoice.description,
      amountHT: invoice.amountHT,
      amountTTC: invoice.amountTTC,
      tva: invoice.tva,
      clientName: invoice.client?.name,
      projectTitle: invoice.project?.title,
    });

    // Update invoice with PDF path
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl: pdfPath },
      include: {
        client: true,
        project: true,
      },
    });

    return updatedInvoice;
  }

  async findAll(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      include: {
        client: true,
        project: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        client: true,
        project: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async update(userId: string, id: string, dto: UpdateInvoiceDto) {
    // Check if invoice exists and belongs to user
    const existingInvoice = await this.findOne(userId, id);

    // Recalculate amounts if amountHT or tva changed
    let amountTTC = existingInvoice.amountTTC;
    let tva = existingInvoice.tva;

    if (dto.amountHT !== undefined || dto.tva !== undefined) {
      const newAmountHT = dto.amountHT ?? existingInvoice.amountHT;
      const newTva = dto.tva ?? existingInvoice.tva;
      amountTTC = newAmountHT * (1 + newTva / 100);
      tva = newTva;
    }

    // Update invoice
    const updatedInvoice = await this.prisma.invoice.updateMany({
      where: { id, userId },
      data: {
        ...dto,
        amountTTC,
        tva,
      },
    });

    // Regenerate PDF if needed
    if (dto.amountHT !== undefined || dto.tva !== undefined || dto.title !== undefined) {
      const invoice = await this.findOne(userId, id);
      const pdfPath = this.pdfService.generate({
        id: invoice.id,
        title: invoice.title,
        description: invoice.description,
        amountHT: invoice.amountHT,
        amountTTC: invoice.amountTTC,
        tva: invoice.tva,
        clientName: invoice.client?.name,
        projectTitle: invoice.project?.title,
      });

      await this.prisma.invoice.update({
        where: { id },
        data: { pdfUrl: pdfPath },
      });
    }

    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    // Check if invoice exists and belongs to user
    await this.findOne(userId, id);

    // Delete PDF file if it exists
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      select: { pdfUrl: true },
    });

    if (invoice?.pdfUrl) {
      try {
        const fs = require('fs');
        if (fs.existsSync(invoice.pdfUrl)) {
          fs.unlinkSync(invoice.pdfUrl);
        }
      } catch (error) {
        console.error('Error deleting PDF file:', error);
      }
    }

    // Delete from database
    return this.prisma.invoice.deleteMany({
      where: { id, userId },
    });
  }

  async updateStatus(userId: string, id: string, status: string) {
    await this.findOne(userId, id);

    return this.prisma.invoice.updateMany({
      where: { id, userId },
      data: { status: status as any },
    });
  }
}
```

> 🔐 **All methods filter by `userId` to enforce ownership and include client/project data.**

---

## 7.10 🛡️ Invoice Controller (API Layer)

**File:** `apps/backend/src/invoice/invoice.controller.ts`

```typescript
import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Param, 
  Body, 
  UseGuards,
  ParseEnumPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto, UpdateInvoiceDto, InvoiceStatus } from './dto/create-invoice.dto';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { UserPayload } from '../auth/types/auth.types';

@Controller('invoices')
@UseGuards(AuthGuard('jwt'))
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  create(@Body() dto: CreateInvoiceDto, @GetUser() user: UserPayload) {
    return this.invoiceService.create(user.sub, dto);
  }

  @Get()
  findAll(@GetUser() user: UserPayload) {
    return this.invoiceService.findAll(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: UserPayload) {
    return this.invoiceService.findOne(user.sub, id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() dto: UpdateInvoiceDto, 
    @GetUser() user: UserPayload
  ) {
    return this.invoiceService.update(user.sub, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status', new ParseEnumPipe(InvoiceStatus)) status: InvoiceStatus,
    @GetUser() user: UserPayload
  ) {
    return this.invoiceService.updateStatus(user.sub, id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: UserPayload) {
    return this.invoiceService.remove(user.sub, id);
  }
}
```

> 🛡️ **All routes are protected with JWT and scoped to the authenticated user.**

---

## 7.11 🗺️ API Routes Summary

| Method | Path                    | Action                           |
|--------|-------------------------|----------------------------------|
| POST   | /invoices               | Create invoice & generate PDF    |
| GET    | /invoices               | List all invoices (owned)        |
| GET    | /invoices/:id           | Get one invoice                  |
| PATCH  | /invoices/:id           | Update invoice                   |
| PATCH  | /invoices/:id/status    | Update invoice status            |
| DELETE | /invoices/:id           | Delete invoice & PDF file        |

**All requests require:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 7.12 🧪 Testing Your Invoice API

### 7.12.1 Create an Invoice

```bash
# First, get a JWT token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "strongpassword123"}' \
  | jq -r '.access_token')

# Create an invoice
curl -X POST http://localhost:3000/invoices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Website Redesign",
    "description": "Complete website redesign and CMS setup",
    "clientId": "your-client-uuid",
    "projectId": "your-project-uuid",
    "amountHT": 1500,
    "tva": 20
  }'
```

**Expected Response:**
```json
{
  "id": "invoice-uuid",
  "title": "Website Redesign",
  "description": "Complete website redesign and CMS setup",
  "status": "DRAFT",
  "clientId": "client-uuid",
  "projectId": "project-uuid",
  "userId": "user-uuid",
  "amountHT": 1500,
  "tva": 20,
  "amountTTC": 1800,
  "pdfUrl": "/app/invoices/invoice-uuid.pdf",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "client": {
    "id": "client-uuid",
    "name": "Acme Corp",
    "email": "contact@acme.com"
  },
  "project": {
    "id": "project-uuid",
    "title": "Website Redesign",
    "status": "IN_PROGRESS"
  }
}
```

### 7.12.2 List All Invoices

```bash
curl -X GET http://localhost:3000/invoices \
  -H "Authorization: Bearer $TOKEN"
```

### 7.12.3 Update Invoice Status

```bash
curl -X PATCH http://localhost:3000/invoices/invoice-uuid/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "SENT"}'
```

### 7.12.4 Get Invoice PDF

```bash
# The PDF file is stored locally at the path returned in pdfUrl
# You can access it directly or implement a download endpoint later
ls -la apps/backend/invoices/
```

---

## 7.13 🔍 Understanding the Invoice Workflow

### 7.13.1 Invoice Status Flow

```
DRAFT → SENT → PAID
   ↓       ↓
OVERDUE ←──┘
```

- **DRAFT** - Invoice created, not sent to client
- **SENT** - Invoice sent to client, awaiting payment
- **PAID** - Client has paid the invoice
- **OVERDUE** - Invoice past due date (future feature)

### 7.13.2 Tax Calculation

```typescript
// Automatic calculation in service
const tva = dto.tva ?? 20.0; // Default 20% TVA
const amountTTC = dto.amountHT * (1 + tva / 100);

// Example: €1000 HT + 20% TVA = €1200 TTC
```

### 7.13.3 PDF Generation Process

1. **Create Invoice** → Database record created
2. **Generate PDF** → PDFKit creates professional document
3. **Store File** → PDF saved to local filesystem
4. **Update Record** → Database updated with PDF path
5. **Return Data** → Invoice data + PDF path returned

---

## 7.14 🛡️ Security & Best Practices

### 7.14.1 Data Security
- ✅ **Ownership enforced** - All queries filter by `userId`
- ✅ **JWT protection** - All routes require authentication
- ✅ **Input validation** - DTOs with `class-validator`
- ✅ **File cleanup** - PDF files deleted when invoice deleted

### 7.14.2 Business Logic
- ✅ **Automatic calculations** - Tax and totals computed server-side
- ✅ **Status management** - Proper workflow enforcement
- ✅ **PDF regeneration** - PDFs updated when invoice changes
- ✅ **Error handling** - Graceful handling of file operations

### 7.14.3 Code Organization
- ✅ **Separation of concerns** - Service handles business logic
- ✅ **Modular design** - PDF service separate from invoice logic
- ✅ **Type safety** - Full TypeScript integration
- ✅ **Database relations** - Proper foreign key relationships

---

## 7.15 🚨 Troubleshooting Common Issues

### Issue 1: "PDFKit module not found"

**Problem:** Error when importing PDFKit.

**Solution:**
```bash
# Install PDFKit and types
cd apps/backend
npm install pdfkit
npm install --save-dev @types/pdfkit

# Restart your backend
docker-compose restart backend
```

### Issue 2: "Cannot create directory" error

**Problem:** PDF generation fails due to missing directory.

**Solution:**
```bash
# Create invoices directory manually
mkdir -p apps/backend/invoices

# Or check permissions
chmod 755 apps/backend/invoices
```

### Issue 3: "Client not found" error

**Problem:** Cannot create invoice with invalid clientId.

**Solution:**
```bash
# Verify client exists and belongs to user
curl -X GET http://localhost:3000/clients \
  -H "Authorization: Bearer $TOKEN"

# Use a valid clientId from the response
```

### Issue 4: PDF file not generated

**Problem:** Invoice created but no PDF file.

**Solution:**
```bash
# Check backend logs for PDF generation errors
docker-compose logs backend

# Verify PDF service is properly injected
# Check if PdfModule is imported in InvoiceModule
```

### Issue 5: "Invalid status" error

**Problem:** Cannot update invoice status.

**Solution:**
```bash
# Use valid status values: DRAFT, SENT, PAID, OVERDUE
curl -X PATCH http://localhost:3000/invoices/invoice-uuid/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "SENT"}'
```

---

## 7.16 🎓 What You Learned

- 🏗️ **How to create a complex business module** with multiple relationships
- 🧾 **How to generate professional PDFs** using PDFKit
- 💰 **How to implement automatic calculations** for billing
- 🔄 **How to manage file operations** with database records
- 🛡️ **How to maintain security** across file and database operations
- 📊 **How to implement status workflows** for business processes

---

## 7.17 🚀 What's Next?

In the next chapter, you'll learn how to:

- 📊 **Build Dashboard & Statistics** - Revenue analytics, unpaid invoices, top clients
- 📧 **Email Integration** - Send invoices via email with PDF attachments
- ☁️ **AWS S3 Integration** - Store PDFs in the cloud instead of locally
- 🔄 **Payment Integration** - Connect to payment processors
- 📈 **Advanced Analytics** - Revenue trends, client performance metrics

---

## 7.18 🎉 Congratulations!

You've successfully implemented a **production-ready invoicing system** that:

- ✅ Generates professional PDF invoices automatically
- ✅ Calculates tax and totals correctly
- ✅ Manages invoice status workflow
- ✅ Maintains secure user ownership
- ✅ Stores files locally (ready for cloud migration)
- ✅ Follows enterprise-level best practices

Your invoicing system is now ready to handle real business transactions! 🚀

---

**Next Up:** Chapter 8 — Dashboard & Statistics (📊 Revenue Analytics, Unpaid Invoices, Top Clients…)