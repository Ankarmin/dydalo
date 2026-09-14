import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { FulfillmentType, ShipmentStatus } from '@prisma/client';
import type { AuditActor } from '../audit/audit.service';
import { AuditService } from '../audit/audit.service';
import { OrdersRepository } from '../orders/orders.repository';
import { orderLabel } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { ShipmentsRepository } from './shipments.repository';
import type { AdvanceShipmentDto } from './dto/shipment.dto';

// Paridad con `SHIPMENT_TRANSITIONS` del frontend.
const SHIPMENT_TRANSITIONS: Record<
  FulfillmentType,
  Partial<Record<ShipmentStatus, ShipmentStatus[]>>
> = {
  LIMA_APP: {
    pendiente: ['conductor_asignado', 'cancelado'],
    conductor_asignado: ['en_camino', 'cancelado'],
    en_camino: ['entregado', 'cancelado'],
  },
  PROVINCIA_OLVA: {
    pendiente: ['en_agencia', 'cancelado'],
    en_agencia: ['en_transito', 'cancelado'],
    en_transito: ['entregado', 'fallido'],
    fallido: ['en_transito', 'devuelto_agencia'],
  },
  RECOJO: {
    pendiente: ['coordinado', 'cancelado'],
    coordinado: ['listo_para_recojo', 'cancelado'],
    listo_para_recojo: ['entregado', 'no_show', 'cancelado'],
    no_show: ['coordinado', 'cancelado'],
  },
};

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersRepository,
    private readonly shipments: ShipmentsRepository,
    private readonly audit: AuditService,
  ) {}

  timeline(orderId: string) {
    return this.shipments.listByOrder(orderId);
  }

  async advance(orderId: string, dto: AdvanceShipmentDto, actor: AuditActor) {
    return this.prisma.$transaction(async (tx) => {
      const order = await this.orders.findById(orderId, tx);
      if (!order) {
        throw new NotFoundException('Pedido no encontrado');
      }
      const fulfillment = dto.fulfillmentType ?? order.fulfillmentType;
      const current = order.shipmentStatus;
      const allowed = SHIPMENT_TRANSITIONS[fulfillment][current] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new ConflictException(
          `No se puede pasar de "${current}" a "${dto.status}" en ${fulfillment}`,
        );
      }
      if (
        fulfillment === 'PROVINCIA_OLVA' &&
        dto.status === 'en_agencia' &&
        !dto.trackingCode?.trim() &&
        !order.trackingCode
      ) {
        throw new BadRequestException(
          'Olva exige código de guía para marcar en agencia.',
        );
      }
      if (
        fulfillment === 'LIMA_APP' &&
        dto.status === 'entregado' &&
        !dto.evidence?.trim()
      ) {
        throw new BadRequestException(
          'App exige evidencia de entrega (captura o foto).',
        );
      }
      if (fulfillment === 'RECOJO' && dto.status === 'entregado') {
        const dni = dto.pickupDni ?? order.pickupDni;
        if (!dni?.trim()) {
          throw new BadRequestException(
            'Recojo exige DNI verificado para entregar.',
          );
        }
      }
      const updated = await this.orders.update(
        orderId,
        {
          fulfillmentType: fulfillment,
          shipmentStatus: dto.status,
          ...(dto.courier !== undefined && { courier: dto.courier }),
          ...(dto.trackingCode !== undefined && {
            trackingCode: dto.trackingCode,
          }),
          ...(dto.realShippingCost !== undefined && {
            realShippingCost: dto.realShippingCost,
          }),
          ...(dto.pickupName !== undefined && { pickupName: dto.pickupName }),
          ...(dto.pickupDni !== undefined && { pickupDni: dto.pickupDni }),
        },
        tx,
      );
      const event = await tx.shipmentEvent.create({
        data: {
          orderId,
          status: dto.status,
          courier: dto.courier ?? order.courier,
          trackingCode: dto.trackingCode ?? order.trackingCode,
          note: dto.note,
          evidence: dto.evidence,
          actorId: actor.id,
          actorName: actor.name,
        },
      });
      await this.audit.log(
        {
          entityType: 'order',
          entityId: orderId,
          entityLabel: orderLabel(orderId),
          action: 'status_change',
          summary: `Envío ${fulfillment}: ${dto.status}${dto.trackingCode ? ` · ${dto.trackingCode}` : ''}${dto.note ? ` — ${dto.note}` : ''}`,
          after: {
            shipmentStatus: dto.status,
            trackingCode: dto.trackingCode,
          },
          changes: [
            { field: 'shipmentStatus', before: current, after: dto.status },
          ],
          actor,
        },
        tx,
      );
      return { order: updated, event };
    });
  }
}
