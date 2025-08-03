import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
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
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @GetUser() user: UserPayload,
  ) {
    return this.clientService.update(user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: UserPayload) {
    return this.clientService.remove(user.sub, id);
  }
}
