# 📘 NimbusLance – Building a Fullstack Cloud-Ready Freelance SaaS Platform

# 7️⃣ Chapter 7 — Building the Project Module (🔗 Client Linking & Secure CRUD)

## 7.1 ✨ Overview

In this chapter, you’ll build the **Project** module—the heart of NimbusLance’s workflow! Projects are linked to both a client and the authenticated user, and will later connect to invoices, timelines, and dashboards.

> 💡 **You’ll learn how to:**
> - Model project data with user and client ownership
> - Create a secure CRUD module
> - Use enums for workflow status
> - Join client data in project queries
> - Apply the same secure, modular structure as before

---

## 7.2 🧩 Why Projects?

Projects are the bridge between clients and billing. By linking each project to both a user and a client, you ensure:
- 🧑‍💻 Clean, isolated data access
- 📊 Useful dashboards
- 🧾 Automated invoicing (coming soon!)

---

## 7.3 🗃️ Prisma Schema

**In `prisma/schema.prisma`:**

```prisma
model Project {
  id          String   @id @default(uuid())
  title       String
  description String?
  status      Status   @default(TODO)
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum Status {
  TODO
  IN_PROGRESS
  COMPLETED
}

model Client {
  // ...existing fields...
  projects Project[]
}

model User {
  // ...existing fields...
  projects Project[]
}
```
> 🔗 **Each project belongs to a user and a client.**

---

## 7.4 🏗️ Migration

After updating your schema, run (inside your backend container):

```bash
npx prisma migrate dev --name add-project-model
npx prisma generate
```

---

## 7.5 🗂️ Module Structure

```
apps/backend/src/
└── project/
    ├── dto/
    │   ├── create-project.dto.ts
    │   └── update-project.dto.ts
    ├── project.module.ts
    ├── project.controller.ts
    └── project.service.ts
```

---

## 7.6 📦 DTOs & Enum

**`create-project.dto.ts`:**
```typescript
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum Status {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export class CreateProjectDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  clientId: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
```

**`update-project.dto.ts`:**
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
```

---

## 7.7 ⚙️ Service Layer

**`project.service.ts`:**
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: { ...dto, userId },
    });
  }

  findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(userId: string, id: string) {
    return this.prisma.project.findFirst({
      where: { id, userId },
      include: { client: true },
    });
  }

  update(userId: string, id: string, dto: UpdateProjectDto) {
    return this.prisma.project.updateMany({
      where: { id, userId },
      data: dto,
    });
  }

  remove(userId: string, id: string) {
    return this.prisma.project.deleteMany({
      where: { id, userId },
    });
  }
}
```
> 🔐 **All methods filter by `userId` to enforce ownership.**

---

## 7.8 🛡️ Controller & Protection

**`project.controller.ts`:**
```typescript
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { UserPayload } from '../auth/types/auth.types';

@Controller('projects')
@UseGuards(AuthGuard('jwt'))
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() dto: CreateProjectDto, @GetUser() user: UserPayload) {
    return this.projectService.create(user.sub, dto);
  }

  @Get()
  findAll(@GetUser() user: UserPayload) {
    return this.projectService.findAll(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: UserPayload) {
    return this.projectService.findOne(user.sub, id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @GetUser() user: UserPayload) {
    return this.projectService.update(user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: UserPayload) {
    return this.projectService.remove(user.sub, id);
  }
}
```
> 🛡️ **All routes are protected with JWT and scoped to the authenticated user.**

---

## 7.9 🗺️ API Routes

| Method | Path             | Action                    |
|--------|------------------|--------------------------|
| POST   | /projects        | Create a new project      |
| GET    | /projects        | List all projects (owned) |
| GET    | /projects/:id    | Get one project           |
| PATCH  | /projects/:id    | Update a project          |
| DELETE | /projects/:id    | Delete a project          |

All requests require:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 7.10 🧪 Example Request: Create Project

```http
POST http://localhost:3000/projects
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "title": "New Website",
  "description": "Landing + CMS setup",
  "clientId": "uuid-of-client",
  "status": "IN_PROGRESS"
}
```

---

## 7.11 🖼️ Screenshots to Include

- ✅ POST /projects with `clientId`
- ✅ GET /projects showing client info joined
- 🗺️ Prisma schema visualization (optional)

---

## 7.12 🛡️ Security & Best Practices

- 🏷️ **Ownership enforced:** All queries filter by `userId`.
- 🔒 **JWT protection:** All routes require authentication.
- 🧹 **Input validation:** DTOs with `class-validator`.
- 🔗 **Relations:** Projects always include their client.
- 🧩 **Modular code:** Service handles business logic, controller handles HTTP.

---

## 7.13 🧰 Troubleshooting

- **Project table not found?**
  - Run migrations inside your backend container: `npx prisma migrate dev --name add-project-model`
- **Cannot create project?**
  - Make sure the `clientId` exists and belongs to the authenticated user.
- **JWT errors?**
  - Ensure you include a valid `Authorization: Bearer ...` header.
- **No projects returned?**
  - Make sure you have created projects for the current user.

---

## 7.14 🎓 What You Learned

- 🏗️ How to create a secure, relational module linked to both client and user
- 🧩 How to use enums to model workflow
- 🔗 How to expand your Prisma schema safely with relations
- 🧹 How to continue using DTOs, guards, and service/controller separation

With projects in place, you’re ready to link them to invoices, track their billing, and present them on the dashboard.

**Next up:** Chapter 8 — Invoice & Quote Module (🧾 PDF Generation + Project Billing)