import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { mapDbResponse } from '../common/utils/db-mapper';

import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.usersService.findOneByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email address is already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const userToCreate = {
      ...registerDto,
      password: hashedPassword,
    };

    return this.usersService.create(userToCreate);
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: User }> {
    const user = await this.usersService.findOneByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password || '');
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    // Map database response to include _id and automatically strip password
    const userObject = mapDbResponse(user);

    return {
      accessToken,
      user: userObject as User,
    };
  }

  async generateAndSendOtp(email: string): Promise<{ mocked: boolean; otp?: string; previewUrl?: string }> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }

    // Generate a secure random 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    // Expiry: 15 minutes from now
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await this.usersService.setOtp(user.id, otp, expiry);
    const mailResult = await this.mailService.sendOtpEmail(user.email, otp);
    return {
      mocked: mailResult.mocked,
      otp: mailResult.mocked ? otp : undefined,
      previewUrl: mailResult.previewUrl,
    };
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.otp || !user.otpExpiry) {
      throw new BadRequestException('No password reset OTP was requested');
    }

    if (user.otp !== otp) {
      throw new BadRequestException('Invalid OTP provided');
    }

    if (new Date() > user.otpExpiry) {
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);
    await this.usersService.clearOtp(user.id);
  }

  async changePassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password || '');
    if (!isPasswordValid) {
      throw new BadRequestException('Incorrect current password');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);
  }
}
