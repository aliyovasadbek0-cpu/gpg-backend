import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Brand } from '../brand/entities/brand.entity';
import { Category } from '../category/entities/category.entity';

@Injectable()
export class MigrationService implements OnModuleInit {
  constructor(
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async onModuleInit() {
    // Wait a bit for database to be fully ready
    setTimeout(async () => {
      await this.migrateBrandsCategoryId();
    }, 2000);
  }

  async migrateBrandsCategoryId() {
    try {
      // Find all brands without categoryId
      const brandsWithoutCategory = await this.brandRepository.find({
        where: { categoryId: IsNull() },
      });

      if (brandsWithoutCategory.length === 0) {
        console.log('✅ No brands need migration');
        return;
      }

      // Get the first category or create a default one
      let defaultCategory = await this.categoryRepository.findOne({
        order: { id: 'ASC' },
      });

      if (!defaultCategory) {
        // Create a default category if none exists
        defaultCategory = this.categoryRepository.create({
          nameRu: 'Default Category',
          nameEn: 'Default Category',
          images: [],
        });
        defaultCategory = await this.categoryRepository.save(defaultCategory);
        console.log('✅ Created default category for migration');
      }

      // Assign all brands without categoryId to the default category
      await this.brandRepository.update(
        { categoryId: IsNull() },
        { categoryId: defaultCategory.id },
      );

      console.log(
        `✅ Migrated ${brandsWithoutCategory.length} brands to category ${defaultCategory.id}`,
      );
    } catch (error) {
      console.error('❌ Error migrating brands:', error);
      // Don't throw error, just log it
    }
  }
}

