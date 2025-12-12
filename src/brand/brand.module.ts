import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { Brand } from './entities/brand.entity';
import { Product } from '../product/entities/product.entity';
import { FileUploadService } from '../common/services/file-upload.service';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Brand, Product]),
    forwardRef(() => CategoryModule),
  ],
  controllers: [BrandController],
  providers: [BrandService, FileUploadService],
  exports: [BrandService],
})
export class BrandModule {}


