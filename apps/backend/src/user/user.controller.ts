import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { UserService } from './user.service';
import { UserPayload } from '../auth/types/auth.types';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  async getMe(@GetUser() user: UserPayload) {
    const userData = await this.userService.validateAndGetUser(user.sub);

    return {
      ...userData,
      message: 'Profile retrieved successfully',
    };
  }

  @Get('stats')
  async getUserStats(@GetUser() user: UserPayload) {
    await this.userService.validateAndGetUser(user.sub);
    const stats = this.userService.getUserStats();

    return {
      userId: user.sub,
      stats,
      message: 'User statistics retrieved',
    };
  }

  @Get('profile')
  async getProfile(@GetUser() user: UserPayload) {
    const userData = await this.userService.validateAndGetUser(user.sub);
    const stats = this.userService.getUserStats();

    return {
      profile: userData,
      stats,
      lastAccessed: new Date().toISOString(),
    };
  }
}
