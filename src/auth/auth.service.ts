import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../user/entities/user.entity';
import { LoginDto } from '../user/dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(login: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { login } });
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.login, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid login or password');
    }

    const payload = { sub: user.id, login: user.login, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(createUserDto: CreateUserDto, currentUser?: User) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { login: createUserDto.login },
    });

    if (existingUser) {
      throw new ConflictException(`User with login "${createUserDto.login}" already exists`);
    }

    // Only superAdmin can create admin
    if (createUserDto.role === UserRole.ADMIN && currentUser?.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Only super admin can create admin users');
    }

    if (createUserDto.role === UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Cannot create super admin');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || UserRole.ADMIN,
    });

    const savedUser = await this.userRepository.save(user);
    const { password, ...result } = savedUser;
    return result;
  }

  async createSuperAdmin(login: string, password: string) {
    const existingSuperAdmin = await this.userRepository.findOne({
      where: { role: UserRole.SUPER_ADMIN },
    });

    if (existingSuperAdmin) {
      return null; // Super admin already exists
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const superAdmin = this.userRepository.create({
      login,
      password: hashedPassword,
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
    });

    return this.userRepository.save(superAdmin);
  }

  async findAll(currentUser: User) {
    const users = await this.userRepository.find({
      order: { id: 'ASC' },
    });

    return users.map((user) => {
      const { password, ...result } = user;
      return result;
    });
  }

  async findOne(id: number, currentUser: User) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...result } = user;
    return result;
  }

  async update(id: number, updateUserDto: UpdateUserDto, currentUser: User) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Only superAdmin can update admin
    if (user.role === UserRole.ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Only super admin can update admin users');
    }

    // Users can update themselves
    if (currentUser.id !== id && currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('You can only update your own profile');
    }

    // Prevent changing role unless superAdmin
    if (updateUserDto.role && currentUser.role !== UserRole.SUPER_ADMIN) {
      delete updateUserDto.role;
    }

    // Hash password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    const savedUser = await this.userRepository.save(user);
    const { password, ...result } = savedUser;
    return result;
  }

  async remove(id: number, currentUser: User) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Cannot delete super admin
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Cannot delete super admin');
    }

    // Only superAdmin can delete admin
    if (user.role === UserRole.ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Only super admin can delete admin users');
    }

    // Users cannot delete themselves
    if (currentUser.id === id) {
      throw new UnauthorizedException('Cannot delete yourself');
    }

    await this.userRepository.remove(user);
    return { message: 'User deleted successfully' };
  }

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password, ...result } = user;
    return result;
  }
}

