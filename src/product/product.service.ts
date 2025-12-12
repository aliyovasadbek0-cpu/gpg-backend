import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileUploadService } from '../common/services/file-upload.service';
import { BrandService } from '../brand/brand.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private fileUploadService: FileUploadService,
    private brandService: BrandService,
  ) {}

  async create(createProductDto: CreateProductDto, images?: any[]): Promise<Product> {
    // Verify brand exists
    await this.brandService.findOne(createProductDto.brandId);

    // Check if product with same nameRu and brandId already exists
    const existingProduct = await this.productRepository.findOne({
      where: {
        nameRu: createProductDto.nameRu,
        brandId: createProductDto.brandId,
      },
    });

    if (existingProduct) {
      throw new ConflictException(
        `Product with name "${createProductDto.nameRu}" already exists in this brand`,
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
      relations: ['brand', 'brand.category'],
      order: { id: 'DESC' },
    });
  }

  async findByBrand(brandId: number): Promise<Product[]> {
    return this.productRepository.find({
      where: { brandId },
      relations: ['brand', 'brand.category'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['brand', 'brand.category'],
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
    
    // Delete images if they exist
    if (product.images && product.images.length > 0) {
      try {
        await this.fileUploadService.deleteFiles(product.images);
      } catch (error) {
        console.error('Error deleting product images:', error);
        // Continue with entity deletion even if image deletion fails
      }
    }

    await this.productRepository.remove(product);
  }
}

