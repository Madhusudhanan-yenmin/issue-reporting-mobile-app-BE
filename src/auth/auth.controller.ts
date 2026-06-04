import { Body, Controller, Get, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { mapDbResponse } from '../common/utils/db-mapper';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    const data = await this.authService.register(registerDto);
    return mapDbResponse(data);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and receive JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset instructions (Mock)' })
  @ApiResponse({ status: 200, description: 'Reset instructions successfully sent' })
  @ApiResponse({ status: 400, description: 'No email provided' })
  async forgotPassword(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return { message: `Password reset instructions sent to ${email}` };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset user password with mock OTP validation' })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  @ApiResponse({ status: 400, description: 'Invalid OTP or parameters' })
  async resetPassword(
    @Body('email') email: string,
    @Body('otp') otp: string,
    @Body('newPassword') newPassword: string,
  ) {
    if (!email || !otp || !newPassword) {
      throw new BadRequestException('All fields are required');
    }
    if (otp !== '1234') {
      throw new BadRequestException('Invalid OTP. Please use mock code 1234');
    }
    await this.authService.resetPassword(email, newPassword);
    return { message: 'Password reset successfully' };
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change user password with current password verification' })
  @ApiResponse({ status: 200, description: 'Password successfully changed' })
  @ApiResponse({ status: 400, description: 'Missing fields' })
  @ApiResponse({ status: 401, description: 'Incorrect current password or user not found' })
  async changePassword(
    @Body('email') email: string,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    if (!email || !currentPassword || !newPassword) {
      throw new BadRequestException('All fields are required');
    }
    await this.authService.changePassword(email, currentPassword, newPassword);
    return { message: 'Password changed successfully' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@GetUser() user: any) {
    return mapDbResponse(user);
  }
}
