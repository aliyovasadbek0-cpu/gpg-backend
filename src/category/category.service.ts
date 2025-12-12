import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FileUploadService } from '../common/services/file-upload.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
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
      relations: ['products'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<any> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['products', 'products.brand'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Extract unique brands from products
    const brandsMap = new Map();
    if (category.products) {
      category.products.forEach((product) => {
        if (product.brand && !brandsMap.has(product.brand.id)) {
          brandsMap.set(product.brand.id, product.brand);
        }
      });
    }

    // Return category with brands instead of products
    return {
      id: category.id,
      nameRu: category.nameRu,
      nameEn: category.nameEn,
      descriptionRu: category.descriptionRu,
      descriptionEn: category.descriptionEn,
      images: category.images,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      brands: Array.from(brandsMap.values()),
    };
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    images?: any[],
  ): Promise<Category> {
    const category = await this.findOne(id);

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
    const category = await this.findOne(id);
    
    if (category.images && category.images.length > 0) {
      await this.fileUploadService.deleteFiles(category.images);
    }

    await this.categoryRepository.remove(category);
  }
}

