import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'Name of the user' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'Unique email address' })
  @IsEmail({}, { message: 'Invalid email address format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: '9876543210', description: 'Mobile number of the user' })
  @IsString()
  @IsNotEmpty({ message: 'Mobile number is required' })
  @Matches(/^\d{10,15}$/, { message: 'Mobile number must be between 10 and 15 digits' })
  mobile: string;

  @ApiProperty({ example: 'password123', description: 'User password (min 6 characters)' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @Length(6, 50, { message: 'Password must be between 6 and 50 characters' })
  password: string;

  @ApiProperty({ example: 'USER', enum: Role, required: false, description: 'Role of the user (defaults to USER)' })
  @IsEnum(Role, { message: 'Invalid role specified' })
  @IsOptional()
  role?: Role;
}
