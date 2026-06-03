import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Category } from '../../common/enums/category.enum';
import { Priority } from '../../common/enums/priority.enum';

export class CreateIssueDto {
  @ApiProperty({ example: 'Water Leakage in Main Street', description: 'Title of the issue' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @ApiProperty({ example: 'There is a major pipe burst near central park.', description: 'Detailed description' })
  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @ApiProperty({ example: 'WATER', enum: Category, description: 'Category of the issue' })
  @IsEnum(Category, { message: 'Invalid category specified' })
  category: Category;

  @ApiProperty({ example: 'HIGH', enum: Priority, description: 'Priority level of the issue' })
  @IsEnum(Priority, { message: 'Invalid priority specified' })
  priority: Priority;

  @ApiProperty({ example: 'Central Park, Sector 4', description: 'Location address or description' })
  @IsString()
  @IsNotEmpty({ message: 'Location is required' })
  location: string;

  @ApiProperty({ example: ['http://res.cloudinary.com/...'], required: false, description: 'Array of uploaded image URLs' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
