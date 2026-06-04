import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { mapDbResponse } from '../common/utils/db-mapper';

@ApiTags('Users Management')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all users and officers (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'List of users and officers retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllUsersAndOfficers() {
    const data = await this.usersService.findAllUsersAndOfficers();
    return mapDbResponse(data);
  }

  @Get('officers')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all officer accounts (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'List of officers retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getOfficers() {
    const data = await this.usersService.findAllOfficers();
    return mapDbResponse(data);
  }
}
