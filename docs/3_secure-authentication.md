# 🔐 Chapter 3: Secure Authentication with JWT & Password Hashing

## 🎯 What You'll Build

In this chapter, you'll implement a **production-ready authentication system** that powers NimbusLance's user management. By the end, you'll have:

- ✅ **User Registration** - Secure signup with password hashing
- ✅ **User Login** - JWT-based authentication
- ✅ **Route Protection** - Guarded endpoints for authenticated users
- ✅ **Scalable Architecture** - Ready for OAuth2, 2FA, and role-based access

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│                 │    │                 │    │                 │
│ 1. User enters  │───▶│ 2. AuthService  │───▶│ 3. Prisma       │
│    credentials  │    │   validates &   │    │   stores user   │
│                 │    │   hashes pwd    │    │                 │
│ 4. Receives     │◀───│ 5. Returns JWT  │◀───│ 6. User data    │
│    JWT token    │    │   token         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Step-by-Step Implementation

### Step 1: Install Dependencies

```bash
cd apps/backend
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install --save-dev @types/bcrypt
```

**What each package does:**
- `@nestjs/jwt` - JWT token generation and validation
- `@nestjs/passport` - Authentication strategy integration
- `passport-jwt` - JWT strategy for Passport
- `bcrypt` - Password hashing (industry standard)

### Step 2: Generate Auth Module Structure

```bash
nest g module auth
nest g controller auth
nest g service auth
```

This creates the foundation for your authentication system.

### Step 3: Create Data Transfer Objects (DTOs)

**File:** `apps/backend/src/auth/dto/auth.dto.ts`

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class AuthDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;
}
```

**Why DTOs matter:**
- ✅ **Input Validation** - Ensures data integrity
- ✅ **Type Safety** - TypeScript catches errors early
- ✅ **Documentation** - Self-documenting API contracts
- ✅ **Security** - Prevents malicious input

### Step 4: Implement the Auth Service

**File:** `apps/backend/src/auth/auth.service.ts`

```typescript
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
    ) {}

    async signup(dto: AuthDto) {
        // Hash password with bcrypt (12 rounds = secure)
        const hash = await bcrypt.hash(dto.password, 12);

        try {
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    password: hash,
                },
            });

            return this.signToken(user.id, user.email);
        } catch (err) {
            throw new BadRequestException('Email already exists');
        }
    }

    async signin(dto: AuthDto) {
        // Find user by email
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) throw new BadRequestException('Invalid credentials');

        // Compare password with hash
        const pwMatch = await bcrypt.compare(dto.password, user.password);
        if (!pwMatch) throw new BadRequestException('Invalid credentials');

        return this.signToken(user.id, user.email);
    }

    async signToken(userId: string, email: string): Promise<{ access_token: string }> {
        const payload = { sub: userId, email };
        const token = await this.jwt.signAsync(payload, {
            expiresIn: '1h',
            secret: process.env.JWT_SECRET,
        });

        return {
            access_token: token,
        };
    }
}
```

**Key Security Features:**
- 🔒 **Password Hashing** - bcrypt with 12 rounds (industry standard)
- 🛡️ **Error Handling** - Generic "Invalid credentials" prevents user enumeration
- ⏰ **Token Expiration** - 1-hour JWT tokens for security
- 🔑 **Environment Secrets** - JWT secret stored in environment variables

### Step 5: Create the Auth Controller

**File:** `apps/backend/src/auth/auth.controller.ts`

```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('signup')
    signup(@Body() dto: AuthDto) {
        return this.authService.signup(dto);
    }

    @Post('signin')
    signin(@Body() dto: AuthDto) {
        return this.authService.signin(dto);
    }
}
```

**API Endpoints Created:**
- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login existing user

### Step 6: Implement JWT Strategy

**File:** `apps/backend/src/auth/strategy/jwt.strategy.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET,
        });
    }

    validate(payload: any) {
        return payload;
    }
}
```

**What this does:**
- 🔍 **Extracts JWT** from Authorization header (`Bearer <token>`)
- ✅ **Validates token** using your JWT secret
- 📦 **Injects payload** into request for route handlers

### Step 7: Configure Auth Module

**File:** `apps/backend/src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({}), // Secret configured in service
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
```

### Step 8: Environment Configuration

**Generate a secure JWT secret:**

```bash
# Method 1: Using OpenSSL (recommended)
openssl rand -base64 32

# Method 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Method 3: Quick setup
echo "JWT_SECRET=\"$(openssl rand -base64 32)\"" >> apps/backend/.env
```

**Add to your `.env` file:**
```env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/nimbuslance"
JWT_SECRET="your-generated-secret-here"
```

### Step 9: Update App Module

**File:** `apps/backend/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
    imports: [PrismaModule, UserModule, AuthModule],
})
export class AppModule {}
```

## 🧪 Testing Your Authentication System

### Test 1: User Registration

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "strongpassword123"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Test 2: User Login

```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "strongpassword123"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Test 3: Invalid Credentials

```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "wrongpassword"
  }'
```

**Expected Response:**
```json
{
  "message": "Invalid credentials",
  "error": "Bad Request",
  "statusCode": 400
}
```

## 🔍 Understanding JWT Tokens

Your JWT tokens contain:

```json
{
  "sub": "user-uuid-here",
  "email": "user@example.com",
  "iat": 1640995200,
  "exp": 1640998800
}
```

- **`sub`** - Subject (user ID)
- **`email`** - User's email address
- **`iat`** - Issued at timestamp
- **`exp`** - Expiration timestamp

**Decode your token at:** https://jwt.io

## 🛡️ Security Best Practices Implemented

1. **Password Security**
   - ✅ bcrypt hashing (12 rounds)
   - ✅ Minimum 6 character requirement
   - ✅ Email validation

2. **Token Security**
   - ✅ 1-hour expiration
   - ✅ Secure random secret
   - ✅ Environment variable storage

3. **Error Handling**
   - ✅ Generic error messages (prevents user enumeration)
   - ✅ Proper HTTP status codes
   - ✅ Input validation

4. **Architecture**
   - ✅ Separation of concerns
   - ✅ Dependency injection
   - ✅ Modular design

## 🚀 What's Next?

In the next chapter, you'll learn how to:

- 🔒 **Protect Routes** - Use JWT guards on sensitive endpoints
- 👥 **User Profiles** - Extend user data with additional fields
- 🔄 **Token Refresh** - Implement refresh token rotation
- 📧 **Email Verification** - Add email confirmation flow

## 🔧 Troubleshooting Common Issues

### Issue 1: "JWT_SECRET is not defined" Error

**Problem:** You get an error about JWT_SECRET being undefined.

**Solution:**
```bash
# Check if JWT_SECRET exists in your .env file
cat apps/backend/.env | grep JWT_SECRET

# If missing, generate and add it
echo "JWT_SECRET=\"$(openssl rand -base64 32)\"" >> apps/backend/.env

# Restart your backend
docker-compose restart backend
```

**Prevention:** Always verify your `.env` file has all required variables before starting the application.

### Issue 2: "Invalid credentials" on Valid Login

**Problem:** Users can't log in even with correct credentials.

**Possible Causes & Solutions:**

**A. Database connection issues:**
```bash
# Check if database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Restart database if needed
docker-compose restart postgres
```

**B. Password hashing mismatch:**
```bash
# Check if bcrypt is properly installed
cd apps/backend
npm list bcrypt

# Reinstall if needed
npm uninstall bcrypt
npm install bcrypt
npm install --save-dev @types/bcrypt
```

**C. User not found in database:**
```bash
# Connect to database and check users
docker-compose exec postgres psql -U postgres -d nimbuslance
# Then run: SELECT * FROM "User";
```

### Issue 3: "Cannot resolve dependencies" Error

**Problem:** NestJS can't resolve AuthService dependencies.

**Solution:**
```bash
# Check if PrismaModule is properly exported
cat apps/backend/src/prisma/prisma.module.ts

# Ensure PrismaModule exports PrismaService
# File should contain:
# exports: [PrismaService]

# Check if AuthModule imports PrismaModule
cat apps/backend/src/auth/auth.module.ts

# Restart the application
docker-compose restart backend
```

### Issue 4: CORS Errors in Frontend

**Problem:** Frontend can't connect to backend due to CORS.

**Solution:**
```typescript
// In apps/backend/src/main.ts, ensure CORS is enabled:
app.enableCors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
});
```

### Issue 5: JWT Token Expires Too Quickly

**Problem:** Users are logged out after 1 hour.

**Solutions:**

**A. Increase token expiration (development):**
```typescript
// In auth.service.ts, change expiresIn:
const token = await this.jwt.signAsync(payload, {
    expiresIn: '7d', // 7 days for development
    secret: process.env.JWT_SECRET,
});
```

**B. Implement refresh tokens (production):**
```typescript
// Add refresh token logic to auth.service.ts
async refreshToken(refreshToken: string) {
    // Validate refresh token and issue new access token
}
```

### Issue 6: "Email already exists" on First Signup

**Problem:** Getting duplicate email error on first user registration.

**Solution:**
```bash
# Check if user already exists
docker-compose exec postgres psql -U postgres -d nimbuslance -c "SELECT * FROM \"User\";"

# Clear database if needed (WARNING: deletes all data)
docker-compose down
docker volume rm nimbuslance_postgres_data
docker-compose up -d
```

### Issue 7: bcrypt Installation Fails

**Problem:** npm install fails on bcrypt.

**Solutions:**

**A. On Linux/WSL:**
```bash
# Install build dependencies
sudo apt-get update
sudo apt-get install python3 make g++

# Then install bcrypt
npm install bcrypt
```

**B. On Windows:**
```bash
# Use pre-compiled binary
npm install bcrypt --build-from-source
```

**C. Alternative approach:**
```bash
# Use bcryptjs instead (pure JavaScript, no compilation needed)
npm uninstall bcrypt
npm install bcryptjs
npm install --save-dev @types/bcryptjs

# Update imports in auth.service.ts:
import * as bcrypt from 'bcryptjs';
```

### Issue 8: Environment Variables Not Loading

**Problem:** Environment variables aren't being read by the application.

**Solutions:**

**A. Check .env file location:**
```bash
# Ensure .env is in the correct location
ls -la apps/backend/.env

# If missing, create it
touch apps/backend/.env
```

**B. Verify .env content:**
```bash
# Check .env file content
cat apps/backend/.env

# Should contain:
# DATABASE_URL="postgresql://postgres:postgres@postgres:5432/nimbuslance"
# JWT_SECRET="your-secret-here"
```

**C. Restart with fresh environment:**
```bash
# Stop and restart containers
docker-compose down
docker-compose up -d
```

### Issue 9: Database Migration Errors

**Problem:** Prisma migrations fail or database schema is out of sync.

**Solution:**
```bash
# Reset database and run migrations
cd apps/backend
npx prisma migrate reset --force
npx prisma generate
npx prisma db push

# Or if using Docker:
docker-compose exec backend npx prisma migrate reset --force
docker-compose exec backend npx prisma generate
docker-compose exec backend npx prisma db push
```

### Issue 10: Performance Issues with bcrypt

**Problem:** User registration/login is slow due to bcrypt hashing.

**Solutions:**

**A. Reduce bcrypt rounds (development only):**
```typescript
// In auth.service.ts, change from 12 to 10 rounds
const hash = await bcrypt.hash(dto.password, 10);
```

**B. Use async/await properly:**
```typescript
// Ensure you're not blocking the event loop
const hash = await bcrypt.hash(dto.password, 12);
```

## 🎉 Congratulations!

You've successfully implemented a **production-ready authentication system** that:

- ✅ Securely handles user registration and login
- ✅ Uses industry-standard security practices
- ✅ Is scalable and maintainable
- ✅ Follows NestJS best practices

Your authentication foundation is now ready to power the rest of NimbusLance! 🚀