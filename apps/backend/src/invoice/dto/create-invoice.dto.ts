import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsNumber()
  amountHT: number;

  @IsOptional()
  @IsNumber()
  tva?: number;
}
