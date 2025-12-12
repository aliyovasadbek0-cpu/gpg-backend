import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  nameRu?: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsNumber()
  @IsNotEmpty()
  categoryId: number;
}

