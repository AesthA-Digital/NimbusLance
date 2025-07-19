import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectService {
    constructor(private prisma: PrismaService) { }

    create(userId: string, dto: CreateProjectDto) {
        return this.prisma.project.create({
            data: {
                ...dto,
                userId,
            },
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