import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 20))
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() images?: any[],
  ) {
    return this.productService.create(createProductDto, images);
  }

  @Get()
  findAll(@Query('categoryId') categoryId?: string, @Query('brandId') brandId?: string) {
    if (categoryId) {
      return this.productService.findByCategory(+categoryId);
    }
    if (brandId) {
      return this.productService.findByBrand(+brandId);
    }
    return this.productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 20))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() images?: any[],
  ) {
    return this.productService.update(id, updateProductDto, images);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}

