import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrdersService } from './orders.service';

// Libera reservas vencidas sin pago cada 15 minutos (idempotente).
// TTL: 24h pedidos online, 48h manuales (Modelo A del backlog).
@Injectable()
export class ReservationsWorker {
  private readonly logger = new Logger(ReservationsWorker.name);

  constructor(private readonly orders: OrdersService) {}

  @Cron('*/15 * * * *')
  async handleCron(): Promise<void> {
    const processed = await this.orders.expireStaleReservations();
    if (processed.length > 0) {
      this.logger.log(`Reservas expiradas liberadas: ${processed.length}`);
    }
  }
}
