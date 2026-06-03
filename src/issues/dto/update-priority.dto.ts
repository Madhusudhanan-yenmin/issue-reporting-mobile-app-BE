import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Priority } from '../../common/enums/priority.enum';

export class UpdatePriorityDto {
  @ApiProperty({ example: 'CRITICAL', enum: Priority, description: 'New priority level' })
  @IsEnum(Priority, { message: 'Invalid priority specified' })
  @IsNotEmpty({ message: 'Priority is required' })
  priority: Priority;
}
