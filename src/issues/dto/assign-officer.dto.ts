import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class AssignOfficerDto {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85', description: 'User ID of the Officer' })
  @IsString()
  @IsNotEmpty({ message: 'Officer ID is required' })
  @Matches(/^[0-9a-fA-F]{24}$/, { message: 'Officer ID must be a valid 24-character hex MongoDB ObjectId' })
  officerId: string;
}
