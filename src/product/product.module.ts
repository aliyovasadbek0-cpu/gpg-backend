import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from './entities/product.entity';
import { FileUploadService } from '../common/services/file-upload.service';
import { BrandModule } from '../brand/brand.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    BrandModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, FileUploadService],
  exports: [ProductService],
})
export class ProductModule {}


