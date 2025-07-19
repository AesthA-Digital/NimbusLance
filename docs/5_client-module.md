# 📘 NimbusLance – Building a Fullstack Cloud-Ready Freelance SaaS Platform

# 6️⃣ Chapter 6 — Building the Client Module (🔐 Secure CRUD with Ownership)

## 6.1 ✨ Overview

In this chapter, you’ll implement the first real business feature of NimbusLance: **managing clients**. Each authenticated user will be able to:

- 🆕 Create new clients
- 👀 View their own clients
- ✏️ Edit and delete their clients
- 🚫 Never access other users’ data

> 💡 The client entity is foundational: it will later link to projects, invoices, and payments. We’ll apply the same architectural and security principles as in authentication to keep everything clean, modular, and secure.

---

## 6.2 🛠️ Features Covered

- 📝 Full CRUD operations on the Client model
- 🏷️ Ownership enforcement: each client belongs to a user
- 🔒 Route protection via JWT (AuthGuard)
- 👤 User injection using the `@GetUser()` decorator
- 🧹 Input validation with class-validator and DTOs
- 🗄️ Database access via Prisma

---

## 6.3 🗃️ Client Model (Prisma Schema)

**prisma/schema.prisma**
```prisma
model Client {
  id        String   @id @default(uuid())
  name      String
  email     String?
  phone     String?
  company   String?
  notes     String?
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      String   @default("user")
  clients   Client[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```
> 🧑‍💼 **Each client is owned by exactly one user.**

---

## 6.4 🏗️ Database Migration

After updating the schema, run (inside your backend container):

```bash
npx prisma migrate dev --name add-client-model
npx prisma generate
```

---

## 6.5 🗂️ Module Structure

```
apps/backend/src/
└── client/
    ├── dto/
    │   ├── create-client.dto.ts
    │   └── update-client.dto.ts
    ├── client.module.ts
    ├── client.controller.ts
    └── client.service.ts
```

---

## 6.6 📦 DTO Definitions

### 6.6.1 📝 CreateClientDto
```typescript
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateClientDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

### 6.6.2 📝 UpdateClientDto
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateClientDto } from './create-client.dto';

export class UpdateClientDto extends PartialType(CreateClientDto) {}
```

---

## 6.7 ⚙️ ClientService (Business Logic)

**apps/backend/src/client/client.service.ts**
```typescript
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: { ...dto, userId },
    });
  }

  findAll(userId: string) {
    return this.prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(userId: string, id: string) {
    return this.prisma.client.findFirst({
      where: { id, userId },
    });
  }

  update(userId: string, id: string, dto: UpdateClientDto) {
    return this.prisma.client.updateMany({
      where: { id, userId },
      data: dto,
    });
  }

  remove(userId: string, id: string) {
    return this.prisma.client.deleteMany({
      where: { id, userId },
    });
  }
}
```
> 🔐 **All methods filter by `userId` to enforce ownership.**

---

## 6.8 🛡️ ClientController (API Layer)

**apps/backend/src/client/client.controller.ts**
```typescript
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { UserPayload } from '../auth/types/auth.types';

@Controller('clients')
@UseGuards(AuthGuard('jwt'))
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  create(@Body() dto: CreateClientDto, @GetUser() user: UserPayload) {
    return this.clientService.create(user.sub, dto);
  }

  @Get()
  findAll(@GetUser() user: UserPayload) {
    return this.clientService.findAll(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: UserPayload) {
    return this.clientService.findOne(user.sub, id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto, @GetUser() user: UserPayload) {
    return this.clientService.update(user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: UserPayload) {
    return this.clientService.remove(user.sub, id);
  }
}
```
> 🛡️ **All routes are protected with JWT. All actions are scoped to the authenticated user.**

---

## 6.9 🗺️ API Route Summary

| Method | Path           | Action                  |
|--------|----------------|------------------------|
| GET    | /clients       | Get all clients (owned) |
| GET    | /clients/:id   | Get one client         |
| POST   | /clients       | Create a new client    |
| PATCH  | /clients/:id   | Update a client        |
| DELETE | /clients/:id   | Delete a client        |

---

## 6.10 🧪 Testing the Client API

**All requests must include:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Example curl:**
```bash
# 🚀 Create a client
curl -X POST http://localhost:3000/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp","email":"client@acme.com"}'

# 📋 List clients
curl -X GET http://localhost:3000/clients -H "Authorization: Bearer $TOKEN"

# 🔍 Get one client
curl -X GET http://localhost:3000/clients/CLIENT_ID -H "Authorization: Bearer $TOKEN"

# ✏️ Update a client
curl -X PATCH http://localhost:3000/clients/CLIENT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"VIP client"}'

# 🗑️ Delete a client
curl -X DELETE http://localhost:3000/clients/CLIENT_ID -H "Authorization: Bearer $TOKEN"
```
> 🚦 **You can only access your own clients, even with a valid ID.**

---

## 6.11 🛡️ Security & Best Practices

- 🏷️ **Ownership enforced:** All queries filter by `userId`.
- 🔒 **JWT protection:** All routes require authentication.
- 🧹 **Input validation:** DTOs with `class-validator`.
- 🚫 **No sensitive data exposed:** Only client fields are returned.
- 🧩 **Modular code:** Service handles business logic, controller handles HTTP.

---

## 6.12 🎓 What You Learned

- 🏗️ How to create your first business domain module
- 🔗 How to link entities with user ownership using Prisma
- 🔒 How to build protected CRUD routes using JWT + NestJS
- 🧹 How to validate input data with DTOs
- 🧠 How to isolate business logic inside a service

---

## 6.13 🚀 Next Up

You now have a scalable and secure base for all resource-based modules: projects, invoices, payments… They will follow a very similar structure.

**Next up:** Chapter 7 — Projects Module (🔗 Linked to Clients, Status, Timeline)