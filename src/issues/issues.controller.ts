import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  Patch, 
  Post, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { AssignOfficerDto } from './dto/assign-officer.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdatePriorityDto } from './dto/update-priority.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Role } from '../common/enums/role.enum';
import { Status } from '../common/enums/status.enum';
import { User } from '../users/entities/user.entity';
import { mapDbResponse } from '../common/utils/db-mapper';

@ApiTags('Issues Management')
@Controller('issues')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Create a new issue (USER only)' })
  @ApiResponse({ status: 201, description: 'Issue successfully registered' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Body() createIssueDto: CreateIssueDto,
    @GetUser() user: any,
  ) {
    const data = await this.issuesService.create(createIssueDto, user.id);
    return mapDbResponse(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all issues (Role-filtered: USER views own, OFFICER views assigned, ADMIN views all)' })
  @ApiResponse({ status: 200, description: 'List of issues retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @GetUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: Status,
    @Query('category') category?: string,
  ) {
    const data = await this.issuesService.findAll({ page, limit, search, status, category }, user);
    return mapDbResponse(data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get issue details by ID (Access restricted to authorized roles)' })
  @ApiResponse({ status: 200, description: 'Issue details retrieved' })
  @ApiResponse({ status: 400, description: 'Invalid format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Issue not found' })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    const data = await this.issuesService.findOne(id, user);
    return mapDbResponse(data);
  }

  @Patch(':id/assign')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign an officer to an issue (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Officer successfully assigned' })
  @ApiResponse({ status: 400, description: 'Invalid format or target user role' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Issue not found' })
  async assignOfficer(
    @Param('id') id: string,
    @Body() assignOfficerDto: AssignOfficerDto,
    @GetUser() user: any,
  ) {
    const data = await this.issuesService.assignOfficer(id, assignOfficerDto.officerId, user.id);
    return mapDbResponse(data);
  }

  @Patch(':id/priority')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update issue priority (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Priority level updated' })
  @ApiResponse({ status: 400, description: 'Validation or ID format error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Issue not found' })
  async updatePriority(
    @Param('id') id: string,
    @Body() updatePriorityDto: UpdatePriorityDto,
    @GetUser() user: any,
  ) {
    const data = await this.issuesService.updatePriority(id, updatePriorityDto, user.id);
    return mapDbResponse(data);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update issue status (Performs transition validations and logging)' })
  @ApiResponse({ status: 200, description: 'Status successfully updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition or missing fields' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Issue not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @GetUser() user: any,
  ) {
    const data = await this.issuesService.updateStatus(id, updateStatusDto, user);
    return mapDbResponse(data);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get activity logs timeline for a specific issue' })
  @ApiResponse({ status: 200, description: 'Timeline retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getActivities(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    const data = await this.issuesService.findActivities(id, user);
    return mapDbResponse(data);
  }
}
