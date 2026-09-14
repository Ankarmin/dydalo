import { Controller, Get, Param } from '@nestjs/common';
import { BlogService } from './blog.service';

@Controller('blog')
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Get()
  list() {
    return this.blog.listPublic();
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.blog.getPublicOrFail(slug);
  }
}
