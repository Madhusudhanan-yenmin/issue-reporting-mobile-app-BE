import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Status } from '../../common/enums/status.enum';

export class UpdateStatusDto {
  @ApiProperty({ example: 'IN_PROGRESS', enum: Status, description: 'Target transition status' })
  @IsEnum(Status, { message: 'Invalid status specified' })
  @IsNotEmpty({ message: 'Status is required' })
  status: Status;

  @ApiProperty({ example: 'The pipe burst has been repaired.', required: false, description: 'Resolution notes (required if status is RESOLVED)' })
  @IsString()
  @IsOptional()
  resolutionNotes?: string;

  @ApiProperty({ example: ['http://res.cloudinary.com/...'], required: false, description: 'Resolution images (required if status is RESOLVED)' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  resolutionImages?: string[];
}
