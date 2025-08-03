import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        ...dto,
        userId,
      },
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
      where: {
        id,
        userId,
      },
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
