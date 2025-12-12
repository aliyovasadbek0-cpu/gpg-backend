import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  nameRu: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsString()
  @IsOptional()
  descriptionRu?: string;

  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @IsNumber()
  @IsNotEmpty()
  brandId: number;

  @IsNumber()
  @IsOptional()
  price?: number;
}

