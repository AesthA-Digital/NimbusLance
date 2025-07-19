import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserPayload } from '../auth/types/auth.types';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    // Only allow admins to fetch all users
    async findAll(requestingUser: UserPayload) {
        if (requestingUser.role !== 'admin') {
            throw new ForbiddenException('Only admins can access all users');
        }
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                createdAt: true,
                role: true, // Add more fields as needed
                // Do not select password
            }
        });
    }

    async findUserById(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                createdAt: true,
                role: true, // Add more fields as needed
                // Do not select password
            }
        });
    }

    async validateAndGetUser(userId: string) {
        const user = await this.findUserById(userId);
        if (!user) throw new NotFoundException('User not found');
        return user;
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