import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileUploadService } from '../common/services/file-upload.service';
import { CategoryService } from '../category/category.service';
import { BrandService } from '../brand/brand.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private fileUploadService: FileUploadService,
    private categoryService: CategoryService,
    private brandService: BrandService,
  ) {}

  async create(createProductDto: CreateProductDto, images?: any[]): Promise<Product> {
    // Verify category exists
    await this.categoryService.findOne(createProductDto.categoryId);

    // Verify brand exists if provided
    if (createProductDto.brandId) {
      await this.brandService.findOne(createProductDto.brandId);
    }

    // Check if product with same nameRu and categoryId already exists
    const existingProduct = await this.productRepository.findOne({
      where: {
        nameRu: createProductDto.nameRu,
        categoryId: createProductDto.categoryId,
      },
    });

    if (existingProduct) {
      throw new ConflictException(
        `Product with name "${createProductDto.nameRu}" already exists in this category`,
      );
    }

    const product = this.productRepository.create(createProductDto);
    
    if (images && images.length > 0) {
      product.images = await this.fileUploadService.saveFiles(images, 'products');
    } else {
      product.images = [];
    }

    return this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['category', 'brand'],
      order: { id: 'DESC' },
    });
  }

  async findByCategory(categoryId: number): Promise<Product[]> {
    return this.productRepository.find({
      where: { categoryId },
      relations: ['category', 'brand'],
      order: { id: 'DESC' },
    });
  }

  async findByBrand(brandId: number): Promise<Product[]> {
    return this.productRepository.find({
      where: { brandId },
      relations: ['category', 'brand'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'brand'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    images?: any[],
  ): Promise<Product> {
    const product = await this.findOne(id);

    // Verify category exists if being updated
    if (updateProductDto.categoryId) {
      await this.categoryService.findOne(updateProductDto.categoryId);
    }

    // Verify brand exists if being updated
    if (updateProductDto.brandId) {
      await this.brandService.findOne(updateProductDto.brandId);
    }

    Object.assign(product, updateProductDto);

    if (images && images.length > 0) {
      // Delete old images
      if (product.images && product.images.length > 0) {
        await this.fileUploadService.deleteFiles(product.images);
      }
      // Save new images
      product.images = await this.fileUploadService.saveFiles(images, 'products');
    }

    return this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    
    if (product.images && product.images.length > 0) {
      await this.fileUploadService.deleteFiles(product.images);
    }

    await this.productRepository.remove(product);
  }
}

