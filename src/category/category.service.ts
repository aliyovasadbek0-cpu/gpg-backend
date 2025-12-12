import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FileUploadService } from '../common/services/file-upload.service';
import { Brand } from '../brand/entities/brand.entity';
import { Product } from '../product/entities/product.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private fileUploadService: FileUploadService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, images?: any[]): Promise<Category> {
    // Check if category with same nameRu already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { nameRu: createCategoryDto.nameRu },
    });

    if (existingCategory) {
      throw new ConflictException(`Category with name "${createCategoryDto.nameRu}" already exists`);
    }

    const category = this.categoryRepository.create(createCategoryDto);
    
    if (images && images.length > 0) {
      category.images = await this.fileUploadService.saveFiles(images, 'categories');
    } else {
      category.images = [];
    }

    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      relations: ['brands'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number, includeBrands: boolean = true): Promise<Category> {
    const options: any = {
      where: { id },
    };
    
    if (includeBrands) {
      options.relations = ['brands'];
    }
    
    const category = await this.categoryRepository.findOne(options);

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    images?: any[],
  ): Promise<Category> {
    const category = await this.findOne(id, false);

    Object.assign(category, updateCategoryDto);

    if (images && images.length > 0) {
      // Delete old images
      if (category.images && category.images.length > 0) {
        await this.fileUploadService.deleteFiles(category.images);
      }
      // Save new images
      category.images = await this.fileUploadService.saveFiles(images, 'categories');
    }

    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id, false);
    
    // Get all brands for this category
    const brands = await this.brandRepository.find({
      where: { categoryId: id },
      relations: ['products'],
    });
    
    // Delete all brands and their products (cascade delete)
    for (const brand of brands) {
      // Get all products for this brand
      const products = await this.productRepository.find({
        where: { brandId: brand.id },
      });
      
      // Delete brand's products first
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
      
      // Delete brand images
      if (brand.images && brand.images.length > 0) {
        try {
          await this.fileUploadService.deleteFiles(brand.images);
        } catch (error) {
          console.error('Error deleting brand images:', error);
        }
      }
      
      // Delete brand
      await this.brandRepository.remove(brand);
    }
    
    // Delete category images if they exist
    if (category.images && category.images.length > 0) {
      try {
        await this.fileUploadService.deleteFiles(category.images);
      } catch (error) {
        console.error('Error deleting category images:', error);
        // Continue with entity deletion even if image deletion fails
      }
    }

    await this.categoryRepository.remove(category);
  }
}

