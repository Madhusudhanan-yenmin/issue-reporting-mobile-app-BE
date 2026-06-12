import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../common/enums/role.enum';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User> & { password?: string }): Promise<User> {
    const id = userData.id || crypto.randomBytes(12).toString('hex');
    const newUser = this.userRepository.create({
      ...userData,
      id,
      email: userData.email!.toLowerCase(),
    });
    return this.userRepository.save(newUser);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    // We explicitly select the password field for login verification
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email: email.toLowerCase() })
      .addSelect('user.password')
      .getOne();
  }

  async findOneById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findAllOfficers(): Promise<User[]> {
    return this.userRepository.find({ where: { role: Role.OFFICER } });
  }

  async findOfficerByDistrict(district: string): Promise<User | null> {
    if (!district) return null;
    return this.userRepository.findOne({
      where: {
        role: Role.OFFICER,
        district,
      },
    });
  }

  async findAllUsersAndOfficers(): Promise<User[]> {
    return this.userRepository.find({
      where: {
        role: In([Role.USER, Role.OFFICER]),
      },
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.userRepository.update(id, { password: passwordHash });
  }
}
