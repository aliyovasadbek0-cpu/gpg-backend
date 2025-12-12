import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../product/entities/product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  nameRu: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nameEn: string;

  @Column({ type: 'text', nullable: true })
  descriptionRu: string;

  @Column({ type: 'text', nullable: true })
  descriptionEn: string;

  @Column({ type: 'text', array: true, default: [] })
  images: string[];

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

