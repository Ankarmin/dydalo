import { Module } from '@nestjs/common';
import { AdminSuppliersController } from './admin-suppliers.controller';
import { SuppliersRepository } from './suppliers.repository';
import { SuppliersService } from './suppliers.service';

@Module({
  controllers: [AdminSuppliersController],
  providers: [SuppliersRepository, SuppliersService],
  exports: [SuppliersService, SuppliersRepository],
})
export class SuppliersModule {}
