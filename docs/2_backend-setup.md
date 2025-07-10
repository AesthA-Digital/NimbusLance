# 🚀 Chapter 2: Backend Setup with NestJS, PostgreSQL & Prisma

## 🎯 What You'll Build

In this chapter, you'll create a **production-ready backend foundation** for NimbusLance using modern, scalable technologies. By the end, you'll have:

- ✅ **NestJS API** - Modular, dependency-injected backend framework
- ✅ **PostgreSQL Database** - Robust relational database in Docker
- ✅ **Prisma ORM** - Type-safe database operations
- ✅ **Docker Setup** - Containerized development environment
- ✅ **First API Endpoint** - Working `/users` route

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │    │   (NestJS)      │    │   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ 1. HTTP Request │───▶│ 2. Controller   │───▶│ 3. Prisma       │
│    /users       │    │   handles req   │    │   queries DB    │
│                 │    │                 │    │                 │
│ 4. JSON Response│◀───│ 5. Service      │◀───│ 6. User data    │
│    []           │    │   processes     │    │   returned      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Step-by-Step Implementation

### Step 1: Scaffold the NestJS Application

**Install NestJS CLI globally:**
```bash
npm install -g @nestjs/cli
```

**Create the backend application:**
```bash
nest new apps/backend
```

**Choose these options when prompted:**
- ✅ **Project name:** `backend`
- ✅ **Package manager:** `npm` (or your preference)
- ✅ **Structure:** Monolith application

**Clean up generated files:**
```bash
cd apps/backend
rm src/app.controller.ts src/app.service.ts
rm -rf test/
```

**Update the main module:**
```typescript
// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';

@Module({
  imports: [],
})
export class AppModule {}
```

**Why NestJS?**
- 🏗️ **Modular Architecture** - Easy to scale and maintain
- 🔧 **Dependency Injection** - Built-in IoC container
- 🛡️ **TypeScript First** - Type safety and better DX
- 📚 **Rich Ecosystem** - Extensive decorators and utilities

### Step 2: Setup PostgreSQL with Docker

**Create the Docker Compose file:**
```bash
mkdir -p docker
```

**File:** `docker/docker-compose.yml`
```yaml
services:
  postgres:
    image: postgres:14
    container_name: nimbuslance_db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: nimbuslance
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ../apps/backend
    env_file:
      - ../apps/backend/.env
    ports:
      - "3000:3000"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

**Start the database:**
```bash
cd docker
docker compose up -d postgres
```

**Verify it's running:**
```bash
docker compose ps
```

**Expected output:**
```
NAME               IMAGE            COMMAND                  SERVICE    CREATED             STATUS              PORTS
nimbuslance_db     postgres:14      "docker-entrypoint.s…"   postgres   About a minute ago   Up About a minute   0.0.0.0:5432->5432/tcp
```

### Step 3: Initialize Prisma ORM

**Install Prisma dependencies:**
```bash
cd apps/backend
npm install prisma --save-dev
npm install @prisma/client
```

**Initialize Prisma:**
```bash
npx prisma init
```

**This creates:**
- 📁 `prisma/schema.prisma` - Database schema definition
- 📁 `.env` - Environment variables (already exists)

**Configure the database connection:**
```env
# apps/backend/.env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/nimbuslance"
```

⚠️ **Important Environment Configuration:**
- **For Docker Compose:** use `postgres` as hostname
- **For local development:** use `localhost` as hostname

**Define your first database model:**
```prisma
// apps/backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Run your first migration:**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

**What these commands do:**
- `migrate dev` - Creates and applies database migrations
- `generate` - Generates Prisma Client for TypeScript

### Step 4: Connect Prisma to NestJS

**Install NestJS Prisma integration:**
```bash
npm install @nestjs/config @nestjs/prisma
```

**Generate Prisma module and service:**
```bash
nest g module prisma
nest g service prisma
```

**Implement the Prisma service:**
```typescript
// apps/backend/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

**Configure the Prisma module:**
```typescript
// apps/backend/src/prisma/prisma.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**Import in the main app module:**
```typescript
// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
})
export class AppModule {}
```

### Step 5: Create Your First API Route

**Generate user module components:**
```bash
nest g module user
nest g service user
nest g controller user
```

**Implement the user service:**
```typescript
// apps/backend/src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }
}
```

**Implement the user controller:**
```typescript
// apps/backend/src/user/user.controller.ts
import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }
}
```

**Configure the user module:**
```typescript
// apps/backend/src/user/user.module.ts
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

**Update the main app module:**
```typescript
// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [PrismaModule, UserModule],
})
export class AppModule {}
```

### Step 6: Setup Docker for Backend

**Create the Dockerfile:**
```dockerfile
# apps/backend/Dockerfile
FROM node:22

WORKDIR /app

COPY package*.json ./
COPY . .

RUN npm install
RUN npm run build

COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh
CMD ["/wait-for-it.sh", "postgres:5432", "--", "npm", "run", "start:prod"]
```

**Download the wait-for-it script:**
```bash
cd apps/backend
curl -o wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh
chmod +x wait-for-it.sh
```

**What wait-for-it.sh does:**
- ⏳ **Waits for PostgreSQL** to be ready before starting the backend
- 🔄 **Prevents startup failures** due to database connection issues
- 🛡️ **Ensures proper startup order** in containerized environments

### Step 7: Start and Test Your Backend

**Option A: Run with Docker Compose (Production-like)**
```bash
cd docker
docker compose up --build -d
```

**Option B: Run Locally (Development)**
```bash
cd apps/backend
npm run start:dev
```

**Test your API endpoint:**
```bash
curl http://localhost:3000/users
```

**Expected response:**
```json
[]
```

**Why an empty array?**
- ✅ **No users exist yet** - This is expected for a fresh database
- ✅ **API is working** - The endpoint responds correctly
- ✅ **Database connection** - Prisma successfully queries PostgreSQL

## 🧪 Testing Your Setup

### Test 1: Database Connection
```bash
# Check if PostgreSQL is running
docker compose ps

# View database logs
docker compose logs postgres
```

### Test 2: API Endpoint
```bash
# Test the users endpoint
curl -X GET http://localhost:3000/users

# Expected: []
```

### Test 3: Health Check
```bash
# Check if backend is responding
curl -I http://localhost:3000/users

# Expected: HTTP/1.1 200 OK
```

## 🔍 Understanding the Architecture

### **NestJS Module System**
```
AppModule
├── PrismaModule (Database connection)
└── UserModule (User operations)
    ├── UserController (HTTP endpoints)
    └── UserService (Business logic)
```

### **Data Flow**
1. **HTTP Request** → `UserController`
2. **Controller** → `UserService`
3. **Service** → `PrismaService`
4. **Prisma** → PostgreSQL Database
5. **Response** flows back through the chain

### **Docker Services**
- **PostgreSQL** - Database server
- **Backend** - NestJS application
- **Shared Network** - Services can communicate

## 🛡️ Security & Best Practices

### **Environment Variables**
- ✅ **Never commit secrets** to version control
- ✅ **Use different configurations** for dev/staging/prod
- ✅ **Validate environment** on startup

### **Database Security**
- ✅ **Strong passwords** (change default in production)
- ✅ **Network isolation** (Docker networks)
- ✅ **Regular backups** (volume persistence)

### **Code Organization**
- ✅ **Separation of concerns** (modules, services, controllers)
- ✅ **Dependency injection** (loose coupling)
- ✅ **Type safety** (TypeScript + Prisma)

## 🚨 Troubleshooting Common Issues

### 1. **"Can't reach database server at postgres:5432"**
```bash
# Check if containers are running
docker compose ps

# Check database logs
docker compose logs postgres

# Verify DATABASE_URL in .env
cat apps/backend/.env
```

**Solutions:**
- Ensure PostgreSQL container is running
- Check DATABASE_URL hostname (postgres vs localhost)
- Verify Docker network connectivity

### 2. **"Nest can't resolve dependencies"**
```bash
# Check module imports
cat apps/backend/src/app.module.ts

# Verify service exports
cat apps/backend/src/prisma/prisma.module.ts
```

**Solutions:**
- Ensure PrismaModule exports PrismaService
- Check UserModule imports PrismaModule
- Verify all modules are imported in AppModule

### 3. **"Docker build fails"**
```bash
# Check if wait-for-it.sh exists
ls -la apps/backend/wait-for-it.sh

# Verify Dockerfile paths
cat apps/backend/Dockerfile
```

**Solutions:**
- Download wait-for-it.sh script
- Check file paths in docker-compose.yml
- Ensure all files are in correct locations

### 4. **"Permission denied" errors**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Or use sudo for Docker commands
sudo docker compose up -d
```

## 🎯 What You've Accomplished

✅ **Production-Ready Backend** - Scalable NestJS application
✅ **Database Integration** - PostgreSQL with Prisma ORM
✅ **Containerized Environment** - Docker for consistency
✅ **API Endpoint** - Working `/users` route
✅ **Modular Architecture** - Extensible code structure
✅ **Type Safety** - Full TypeScript integration

## 🚀 What's Next?

In the next chapter, you'll learn how to:

- 🔐 **Secure Authentication** - JWT-based user authentication
- 🛡️ **Route Protection** - Guarded endpoints for authenticated users
- 👥 **User Management** - Registration, login, and profile management
- 🔄 **Token Management** - JWT token generation and validation

## 🎉 Congratulations!

You've successfully built a **solid foundation** for NimbusLance that:

- ✅ Follows industry best practices
- ✅ Is production-ready and scalable
- ✅ Uses modern, maintainable technologies
- ✅ Provides a great developer experience

Your backend is now ready to power the authentication system and all future features! 🚀