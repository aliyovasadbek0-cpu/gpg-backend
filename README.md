# GPG Backend API

NestJS, TypeORM, PostgreSQL bilan yozilgan GPG sayti uchun backend API.

## O'rnatish

1. Dependencies o'rnatish:
```bash
npm install
```

2. PostgreSQL ma'lumotlar bazasini yaratish va `.env` faylini yaratish:
```bash
# .env faylini yarating va quyidagi ma'lumotlarni kiriting:
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=gpg_db
PORT=3000
BASE_URL=http://localhost:3000
UPLOAD_DEST=./upload
```

3. Ilovani ishga tushirish:
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Endpoints

### Categories (Kategoriyalar)

- `POST /categories` - Yangi kategoriya yaratish (image bilan)
- `GET /categories` - Barcha kategoriyalarni olish
- `GET /categories/:id` - Bitta kategoriyani olish (products bilan)
- `PATCH /categories/:id` - Kategoriyani yangilash (image bilan)
- `DELETE /categories/:id` - Kategoriyani o'chirish

**POST /categories example:**
```json
{
  "nameRu": "Антифриз",
  "nameEn": "Antifreeze",
  "descriptionRu": "Описание категории",
  "descriptionEn": "Category description"
}
```
Form-data bilan `image` faylini yuborish kerak.

### Brands (Brendlar)

- `POST /brands` - Yangi brend yaratish (image bilan)
- `GET /brands` - Barcha brendlarni olish
- `GET /brands/:id` - Bitta brendni olish
- `PATCH /brands/:id` - Brendni yangilash (image bilan)
- `DELETE /brands/:id` - Brendni o'chirish

**POST /brands example:**
```json
{
  "name": "ATLANT",
  "nameRu": "АТЛАНТ",
  "nameEn": "ATLANT"
}
```
Form-data bilan `image` faylini yuborish kerak.

### Products (Mahsulotlar)

- `POST /products` - Yangi mahsulot yaratish (image bilan)
- `GET /products` - Barcha mahsulotlarni olish
- `GET /products?categoryId=1` - Kategoriya bo'yicha mahsulotlarni olish
- `GET /products?brandId=1` - Brend bo'yicha mahsulotlarni olish
- `GET /products/:id` - Bitta mahsulotni olish
- `PATCH /products/:id` - Mahsulotni yangilash (image bilan)
- `DELETE /products/:id` - Mahsulotni o'chirish

**POST /products example:**
```json
{
  "nameRu": "ATLANT Yellow 5kg",
  "nameEn": "ATLANT Yellow 5kg",
  "descriptionRu": "Описание продукта",
  "descriptionEn": "Product description",
  "categoryId": 1,
  "brandId": 1,
  "price": 150000
}
```
Form-data bilan `image` faylini yuborish kerak.

## Fayl yuklash

Barcha rasmlar `upload` papkasida saqlanadi:
- `upload/categories/` - Kategoriya rasmlari
- `upload/brands/` - Brend rasmlari
- `upload/products/` - Mahsulot rasmlari

Rasmlarni ko'rish uchun: `http://localhost:3000/upload/categories/filename.jpg`

## Ma'lumotlar bazasi struktura

- **categories** - Kategoriyalar (nameRu, nameEn, descriptionRu, descriptionEn, image)
- **brands** - Brendlar (name, nameRu, nameEn, image)
- **products** - Mahsulotlar (nameRu, nameEn, descriptionRu, descriptionEn, image, price, categoryId, brandId)

## Eslatmalar

- Barcha POST va PATCH so'rovlarida `image` faylini `multipart/form-data` formatida yuborish kerak
- Update qilganda, agar yangi rasm yuborilsa, eski rasm avtomatik o'chiriladi
- Delete qilganda, rasm ham avtomatik o'chiriladi
- TypeORM `synchronize: true` rejimida ishlaydi (productionda `false` qiling)

