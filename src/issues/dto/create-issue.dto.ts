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

  @ApiProperty({ example: 'Cuddalore', description: 'District of the issue' })
  @IsString()
  @IsNotEmpty({ message: 'District is required' })
  district: string;

  @ApiProperty({ example: 'Panruti', description: 'Town or area of the issue' })
  @IsString()
  @IsNotEmpty({ message: 'Town is required' })
  town: string;

  @ApiProperty({ example: 'Near Bus Stand', description: 'Address description' })
  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  address: string;

  @ApiProperty({ example: 11.7680, required: false, description: 'Latitude coordinate' })
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: 79.5502, required: false, description: 'Longitude coordinate' })
  @IsOptional()
  longitude?: number;

  @ApiProperty({ example: 'Central Park, Sector 4', required: false, description: 'Location address or description' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: ['http://res.cloudinary.com/...'], required: false, description: 'Array of uploaded image URLs' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ example: 'http://res.cloudinary.com/...', required: false, description: 'Optional uploaded voice message URL' })
  @IsString()
  @IsOptional()
  voiceUrl?: string;

  @ApiProperty({ example: 'http://res.cloudinary.com/...', required: false, description: 'Optional uploaded video attachment URL' })
  @IsString()
  @IsOptional()
  videoUrl?: string;
}
