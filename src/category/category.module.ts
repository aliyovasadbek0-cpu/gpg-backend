import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { Category } from './entities/category.entity';
import { Brand } from '../brand/entities/brand.entity';
import { Product } from '../product/entities/product.entity';
import { FileUploadService } from '../common/services/file-upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Brand, Product])],
  controllers: [CategoryController],
  providers: [CategoryService, FileUploadService],
  exports: [CategoryService],
})
export class CategoryModule {}


