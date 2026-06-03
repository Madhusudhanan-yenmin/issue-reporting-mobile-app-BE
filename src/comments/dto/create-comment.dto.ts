import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85', description: 'Issue ID to comment on' })
  @IsString()
  @IsNotEmpty({ message: 'Issue ID is required' })
  @Matches(/^[0-9a-fA-F]{24}$/, { message: 'Issue ID must be a valid 24-character hex MongoDB ObjectId' })
  issueId: string;

  @ApiProperty({ example: 'I will check this issue tomorrow morning.', description: 'The text message of the comment' })
  @IsString()
  @IsNotEmpty({ message: 'Message is required' })
  message: string;
}
