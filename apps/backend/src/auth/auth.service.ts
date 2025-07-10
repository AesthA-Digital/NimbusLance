import {
    BadRequestException,
    Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
    ) { }

    async signup(dto: AuthDto) {
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
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) throw new BadRequestException('Invalid credentials');

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