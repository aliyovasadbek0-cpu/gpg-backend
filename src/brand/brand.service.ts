import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { FileUploadService } from '../common/services/file-upload.service';
import { CategoryService } from '../category/category.service';
import { Product } from '../product/entities/product.entity';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private fileUploadService: FileUploadService,
    private categoryService: CategoryService,
  ) {}

  async create(createBrandDto: CreateBrandDto, images?: any[]): Promise<Brand> {
    // Verify category exists
    await this.categoryService.findOne(createBrandDto.categoryId);

    // Check if brand with same name already exists
    const existingBrand = await this.brandRepository.findOne({
      where: { name: createBrandDto.name },
    });

    if (existingBrand) {
      throw new ConflictException(`Brand with name "${createBrandDto.name}" already exists`);
    }

    const brand = this.brandRepository.create(createBrandDto);
    
    if (images && images.length > 0) {
      brand.images = await this.fileUploadService.saveFiles(images, 'brands');
    } else {
      brand.images = [];
    }

    return this.brandRepository.save(brand);
  }

  async findAll(): Promise<Brand[]> {
    return this.brandRepository.find({
      relations: ['category', 'products'],
      order: { id: 'ASC' },
    });
  }

  async findByCategory(categoryId: number): Promise<Brand[]> {
    return this.brandRepository.find({
      where: { categoryId },
      relations: ['category', 'products'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number, includeProducts: boolean = true): Promise<Brand> {
    const options: any = {
      where: { id },
      relations: ['category'],
    };
    
    if (includeProducts) {
      options.relations.push('products');
    }
    
    const brand = await this.brandRepository.findOne(options);

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }

  async update(
    id: number,
    updateBrandDto: UpdateBrandDto,
    images?: any[],
  ): Promise<Brand> {
    const brand = await this.findOne(id, false);

    // Verify category exists if being updated
    if (updateBrandDto.categoryId) {
      await this.categoryService.findOne(updateBrandDto.categoryId);
    }

    Object.assign(brand, updateBrandDto);

    if (images && images.length > 0) {
      // Delete old images
      if (brand.images && brand.images.length > 0) {
        await this.fileUploadService.deleteFiles(brand.images);
      }
      // Save new images
      brand.images = await this.fileUploadService.saveFiles(images, 'brands');
    }

    return this.brandRepository.save(brand);
  }

  async remove(id: number): Promise<void> {
    const brand = await this.findOne(id, false);
    
    // Get all products for this brand
    const products = await this.productRepository.find({
      where: { brandId: id },
    });
    
    // Delete all products (cascade delete)
    for (const product of products) {
      // Delete product images
      if (product.images && product.images.length > 0) {
        try {
          await this.fileUploadService.deleteFiles(product.images);
        } catch (error) {
          console.error('Error deleting product images:', error);
        }
      }
      await this.productRepository.remove(product);
    }
    
    // Delete brand images if they exist
    if (brand.images && brand.images.length > 0) {
      try {
        await this.fileUploadService.deleteFiles(brand.images);
      } catch (error) {
        console.error('Error deleting brand images:', error);
        // Continue with entity deletion even if image deletion fails
      }
    }

    await this.brandRepository.remove(brand);
  }
}

