import { 
  Controller, 
  Post, 
  UploadedFile, 
  UploadedFiles, 
  UseGuards, 
  UseInterceptors, 
  BadRequestException,
  Req
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('File Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single image file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File successfully uploaded, returns image secure URL' })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadSingleFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.uploadService.uploadFile(file, req);
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 5)) // Max 5 files
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload up to 5 image files' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Files successfully uploaded, returns array of secure URLs' })
  @ApiResponse({ status: 400, description: 'No files provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[], @Req() req: any) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return this.uploadService.uploadMultipleFiles(files, req);
  }
}
