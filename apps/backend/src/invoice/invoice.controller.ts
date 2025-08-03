import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceService } from './invoice.service';
import { UserPayload } from '../auth/types/auth.types';

@UseGuards(AuthGuard('jwt'))
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  create(@Body() dto: CreateInvoiceDto, @GetUser() user: UserPayload) {
    return this.invoiceService.create(user.sub, dto);
  }

  @Get()
  findAll(@GetUser() user: UserPayload) {
    return this.invoiceService.findAll(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: UserPayload) {
    return this.invoiceService.findOne(user.sub, id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
    @GetUser() user: UserPayload,
  ) {
    return this.invoiceService.update(user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: UserPayload) {
    return this.invoiceService.remove(user.sub, id);
  }
}
