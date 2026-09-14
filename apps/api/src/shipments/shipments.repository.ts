import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShipmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrder(orderId: string) {
    return this.prisma.shipmentEvent.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
