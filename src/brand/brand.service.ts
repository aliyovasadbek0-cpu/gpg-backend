import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { FileUploadService } from '../common/services/file-upload.service';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    private fileUploadService: FileUploadService,
  ) {}

  async create(createBrandDto: CreateBrandDto, images?: any[]): Promise<Brand> {
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
      relations: ['products'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Brand> {
    const brand = await this.brandRepository.findOne({
      where: { id },
      relations: ['products', 'products.category'],
    });

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
    const brand = await this.findOne(id);

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
    const brand = await this.findOne(id);
    
    if (brand.images && brand.images.length > 0) {
      await this.fileUploadService.deleteFiles(brand.images);
    }

    await this.brandRepository.remove(brand);
  }
}

