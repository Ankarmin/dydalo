import { read, write, generateId, KEYS } from "./data-store.utils";
import type { FulfillmentType, ShipmentEvent, ShipmentStatus } from "./data-store.types";
import { auditStore } from "./data-store.audit";

const SHIPMENTS_KEY = (KEYS as Record<string, string>).shipments ?? "dydalo_shipments";

function getAllEvents(): ShipmentEvent[] {
  return read<ShipmentEvent[]>(SHIPMENTS_KEY, []);
}

function getByOrderId(orderId: string): ShipmentEvent[] {
  return getAllEvents()
    .filter((e) => e.orderId === orderId)
    .toSorted((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function recordEvent(input: {
  orderId: string;
  status: ShipmentStatus;
  fulfillmentType: FulfillmentType;
  courier?: string;
  trackingCode?: string;
  note?: string;
  evidence?: string;
  actorId: string;
  actorName: string;
}): ShipmentEvent {
  const event: ShipmentEvent = {
    id: generateId(),
    orderId: input.orderId,
    status: input.status,
    courier: input.courier,
    trackingCode: input.trackingCode,
    note: input.note,
    evidence: input.evidence,
    actorId: input.actorId,
    actorName: input.actorName,
    createdAt: new Date().toISOString(),
  };
  write(SHIPMENTS_KEY, [...getAllEvents(), event]);
  auditStore.create({
    actor: { id: input.actorId, name: input.actorName },
    entityType: "order",
    entityId: input.orderId,
    entityLabel: `#${input.orderId.slice(0, 8)}`,
    action: "status_change",
    summary: `Envío ${input.fulfillmentType}: ${input.status}${input.trackingCode ? ` · ${input.trackingCode}` : ""}${input.note ? ` — ${input.note}` : ""}`,
    before: undefined,
    after: { shipmentStatus: input.status, trackingCode: input.trackingCode },
    changes: [{ field: "shipmentStatus", before: "previo", after: input.status }],
  });
  return event;
}

export const shipmentsStore = {
  getByOrderId,
  recordEvent,
};
