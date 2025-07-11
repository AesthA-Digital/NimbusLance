# 🔒 Chapter 4: Protecting Routes & User Context

## 🎯 What You'll Learn

In this chapter, you'll learn how to **practically apply** the authentication system we built in Chapter 3. You'll discover how to:

- ✅ **Protect API endpoints** with JWT authentication
- ✅ **Extract user context** in your controllers
- ✅ **Build user-specific features** (profile, dashboard, etc.)
- ✅ **Handle authentication errors** gracefully
- ✅ **Test protected routes** with real JWT tokens

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│                 │    │                 │    │                 │
│ 1. Send request │───▶│ 2. AuthGuard    │───▶│ 3. JWT Strategy │
│    with JWT     │    │   validates     │    │   extracts user │
│                 │    │   token         │    │                 │
│ 4. Receive      │◀───│ 5. Controller   │◀───│ 6. User data    │
│    user data    │    │   processes     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Building Protected Routes

### Step 1: Understanding Route Protection

Since we already implemented the JWT Strategy and GetUser decorator in Chapter 3, let's focus on **how to use them** to build secure features.

**What we have:**
- ✅ JWT Strategy (`apps/backend/src/auth/strategy/jwt.strategy.ts`)
- ✅ GetUser decorator (`apps/backend/src/auth/decorator/get-user.decorator.ts`)
- ✅ AuthGuard integration

**What we'll build:**
- 🔒 Protected user profile endpoint
- 🔒 User-specific data access
- 🔒 Authentication error handling

### Step 2: Creating the User Profile Endpoint

**File:** `apps/backend/src/user/user.controller.ts`

```typescript
import { Controller, Get, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';

// Define the user payload type for better TypeScript support
interface UserPayload {
    sub: string;
    email: string;
    iat?: number;
    exp?: number;
}

@Controller('users')
@UseGuards(AuthGuard('jwt')) // Protects ALL routes in this controller
export class UserController {
    
    @Get('me')
    getMe(@GetUser() user: UserPayload) {
        // user contains: { sub: "user-id", email: "user@example.com" }
        return {
            id: user.sub,
            email: user.email,
            message: 'Profile retrieved successfully'
        };
    }

    @Get('profile')
    getProfile(@GetUser() user: UserPayload) {
        // You can add more user-specific logic here
        return {
            id: user.sub,
            email: user.email,
            profile: {
                // Add more profile fields as needed
                lastLogin: new Date().toISOString(),
                status: 'active'
            }
        };
    }
}
```

**Key Points:**
- 🔒 `@UseGuards(AuthGuard('jwt'))` protects all routes in the controller
- 👤 `@GetUser()` decorator extracts the authenticated user
- 📝 TypeScript interface provides better type safety
- 🎯 Multiple endpoints can use the same user context

### Step 3: Testing Protected Routes

Let's test our protected endpoints step by step:

**Step 3.1: Get a JWT Token**

```bash
# First, sign in to get a token
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

**Step 3.2: Test Protected Endpoint**

```bash
# Use the token to access protected route
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Expected Response:**
```json
{
  "id": "user-uuid-here",
  "email": "user@example.com",
  "message": "Profile retrieved successfully"
}
```

**Step 3.3: Test Without Token (Should Fail)**

```bash
# This should return 401 Unauthorized
curl -X GET http://localhost:3000/users/me
```

**Expected Response:**
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

### Step 4: Building User-Specific Features

Now let's create more advanced user-specific functionality:

**File:** `apps/backend/src/user/user.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async findUserById(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                createdAt: true,
                // Don't select password for security
            }
        });
    }

    async getUserStats(userId: string) {
        // This is where you'd add business logic
        // For now, return mock data
        return {
            totalProjects: 0,
            totalInvoices: 0,
            totalRevenue: 0,
            activeClients: 0
        };
    }
}
```

**File:** `apps/backend/src/user/user.controller.ts` (Updated)

```typescript
import { Controller, Get, UseGuards, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { UserService } from './user.service';

interface UserPayload {
    sub: string;
    email: string;
    iat?: number;
    exp?: number;
}

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UserController {
    
    constructor(private userService: UserService) {}

    @Get('me')
    async getMe(@GetUser() user: UserPayload) {
        const userData = await this.userService.findUserById(user.sub);
        
        if (!userData) {
            throw new NotFoundException('User not found');
        }

        return {
            ...userData,
            message: 'Profile retrieved successfully'
        };
    }

    @Get('stats')
    async getUserStats(@GetUser() user: UserPayload) {
        const stats = await this.userService.getUserStats(user.sub);
        
        return {
            userId: user.sub,
            stats,
            message: 'User statistics retrieved'
        };
    }

    @Get('profile')
    async getProfile(@GetUser() user: UserPayload) {
        const userData = await this.userService.findUserById(user.sub);
        const stats = await this.userService.getUserStats(user.sub);

        return {
            profile: userData,
            stats,
            lastAccessed: new Date().toISOString()
        };
    }
}
```

### Step 5: Testing Advanced Features

**Test the new endpoints:**

```bash
# Get user profile with database data
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get user statistics
curl -X GET http://localhost:3000/users/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get complete profile
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔍 Understanding Authentication Flow

### How JWT Protection Works:

1. **Request Arrives** → Frontend sends request with `Authorization: Bearer <token>`
2. **AuthGuard Intercepts** → NestJS checks for JWT token
3. **JWT Strategy Validates** → Decodes and verifies token signature
4. **User Context Injected** → Token payload becomes `request.user`
5. **Controller Executes** → Your code runs with user context
6. **Response Sent** → User-specific data returned

### Token Payload Structure:

```json
{
  "sub": "user-uuid-here",
  "email": "user@example.com",
  "iat": 1640995200,
  "exp": 1640998800
}
```

- **`sub`** → User ID (subject)
- **`email`** → User's email address
- **`iat`** → Issued at timestamp
- **`exp`** → Expiration timestamp

## 🛡️ Security Best Practices

### 1. Always Validate User Context

```typescript
@Get('protected-data')
async getProtectedData(@GetUser() user: UserPayload) {
    // Always verify the user has access to the requested data
    const userData = await this.userService.findUserById(user.sub);
    
    if (!userData) {
        throw new UnauthorizedException('Invalid user context');
    }
    
    return userData;
}
```

### 2. Don't Expose Sensitive Data

```typescript
// ✅ Good - Only return necessary fields
async findUserById(userId: string) {
    return this.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            createdAt: true,
            // password is NOT selected
        }
    });
}

// ❌ Bad - Exposes password hash
async findUserById(userId: string) {
    return this.prisma.user.findUnique({
        where: { id: userId }
        // This would include password field
    });
}
```

### 3. Handle Token Expiration Gracefully

```typescript
// The JWT Strategy automatically handles expired tokens
// But you can add custom logic if needed
@Get('me')
async getMe(@GetUser() user: UserPayload) {
    // Check if token is about to expire
    const now = Math.floor(Date.now() / 1000);
    const tokenExp = user.exp || 0;
    
    if (tokenExp - now < 300) { // 5 minutes
        // Token expires soon, you could refresh it here
        console.log('Token expires soon');
    }
    
    return { id: user.sub, email: user.email };
}
```

## 🧪 Testing Your Protected Routes

### Test Suite for Protected Endpoints:

```bash
#!/bin/bash

# 1. Get authentication token
echo "Getting authentication token..."
TOKEN=$(curl -s -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "strongpassword123"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"

# 2. Test protected endpoints
echo "Testing /users/me..."
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\nTesting /users/stats..."
curl -X GET http://localhost:3000/users/stats \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\nTesting /users/profile..."
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer $TOKEN"

# 3. Test unauthorized access
echo -e "\n\nTesting unauthorized access (should fail)..."
curl -X GET http://localhost:3000/users/me
```

## 🚀 What's Next?

In the next chapter, you'll learn how to:

- 👥 **Build the Clients Module** - CRUD operations with user ownership
- 🔐 **Implement Resource-Level Security** - Users can only access their own data
- 📊 **Create Dashboard Endpoints** - Aggregate user-specific data
- 🎯 **Add Role-Based Access Control** - Different permissions for different users

## 🎉 Congratulations!

You've successfully implemented **route protection and user context** in NimbusLance! You now have:

- ✅ **Secure API endpoints** that require authentication
- ✅ **User-specific data access** with proper context
- ✅ **Professional error handling** for authentication failures
- ✅ **Scalable architecture** ready for more features

Your authentication system is now production-ready and can handle real user data securely! 🚀

## 🔧 Troubleshooting Common Issues

### Issue 1: "Cannot GET /users/me" - Route Not Found

**Problem:** The `/users/me` endpoint returns 404.

**Solutions:**

**A. Check if UserModule is imported:**
```typescript
// In apps/backend/src/app.module.ts
@Module({
    imports: [PrismaModule, UserModule, AuthModule], // Make sure UserModule is here
})
export class AppModule {}
```

**B. Verify controller compilation:**
```bash
# Rebuild the backend
sudo docker exec docker-backend-1 npm run build
sudo docker restart docker-backend-1
```

**C. Check route mapping in logs:**
```bash
sudo docker logs docker-backend-1 | grep "Mapped"
# Should show: Mapped {/users/me, GET} route
```

### Issue 2: "Unauthorized" on Valid Token

**Problem:** Getting 401 even with a valid JWT token.

**Solutions:**

**A. Check JWT_SECRET consistency:**
```bash
# Verify JWT_SECRET is the same in .env and running container
cat apps/backend/.env | grep JWT_SECRET
sudo docker exec docker-backend-1 env | grep JWT_SECRET
```

**B. Verify token format:**
```bash
# Check if token is properly formatted
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -v
```

**C. Check token expiration:**
```bash
# Decode token at jwt.io to check expiration
# Or use command line:
echo "YOUR_TOKEN_HERE" | cut -d'.' -f2 | base64 -d | jq .
```

### Issue 3: User Data Not Found in Database

**Problem:** User exists in JWT but not found in database.

**Solutions:**

**A. Check database connection:**
```bash
# Verify database is accessible
sudo docker exec docker-backend-1 npx prisma db pull
```

**B. Check user exists:**
```bash
# Connect to database and check users
sudo docker exec nimbuslance_db psql -U postgres -d nimbuslance -c "SELECT id, email FROM \"User\";"
```

**C. Verify user ID format:**
```typescript
// In user.service.ts, add logging
async findUserById(userId: string) {
    console.log('Looking for user:', userId);
    const user = await this.prisma.user.findUnique({
        where: { id: userId }
    });
    console.log('Found user:', user);
    return user;
}
```

### Issue 4: CORS Errors in Frontend

**Problem:** Frontend can't access protected endpoints due to CORS.

**Solution:**
```typescript
// In apps/backend/src/main.ts
app.enableCors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### Issue 5: TypeScript Errors with User Payload

**Problem:** TypeScript complains about user type.

**Solution:**
```typescript
// Create a shared types file: apps/backend/src/auth/types/auth.types.ts
export interface UserPayload {
    sub: string;
    email: string;
    iat?: number;
    exp?: number;
}

// Then import in your controllers:
import { UserPayload } from '../auth/types/auth.types';
```