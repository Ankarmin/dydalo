import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { RequestUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { BlogService } from './blog.service';
import { CreateBlogDto, UpdateBlogDto } from './dto/blog.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/blog')
export class AdminBlogController {
  constructor(private readonly blog: BlogService) {}

  @Get()
  list() {
    return this.blog.listAdmin();
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateBlogDto) {
    return this.blog.create(dto, { id: user.id, name: user.name });
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateBlogDto,
  ) {
    return this.blog.update(id, dto, { id: user.id, name: user.name });
  }

  @Patch(':id/publish')
  publish(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.blog.setPublished(id, true, { id: user.id, name: user.name });
  }

  @Patch(':id/unpublish')
  unpublish(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.blog.setPublished(id, false, { id: user.id, name: user.name });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.blog.remove(id, { id: user.id, name: user.name });
  }
}
