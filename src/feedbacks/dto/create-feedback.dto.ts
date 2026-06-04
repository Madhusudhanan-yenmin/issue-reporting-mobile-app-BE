import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, Min, Matches } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85', description: 'Issue ID being rated' })
  @IsString()
  @IsNotEmpty({ message: 'Issue ID is required' })
  issueId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5, description: 'Rating score from 1 to 5' })
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot exceed 5' })
  @IsNotEmpty({ message: 'Rating is required' })
  rating: number;

  @ApiProperty({ example: 'Excellent and quick resolution!', description: 'Additional comment' })
  @IsString()
  @IsNotEmpty({ message: 'Comment is required' })
  comment: string;
}
