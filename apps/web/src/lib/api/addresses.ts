// Direcciones del usuario contra el backend (checkout en modo API).
// El tipo Address del frontend ya es compatible con la respuesta:
// GET devuelve la lista propia ordenada (default primero).
import { apiFetch } from "./client";
import type { Address } from "@/lib/stores/data-store.types";

export type ApiCreateAddressInput = {
  label: string;
  fullName: string;
  street: string;
  district: string;
  city: string;
  state: string;
  zip?: string;
  country?: string;
  phone: string;
  isDefault?: boolean;
};

export async function apiGetAddresses(): Promise<Address[]> {
  return apiFetch<Address[]>("/addresses");
}

export async function apiCreateAddress(
  input: ApiCreateAddressInput,
): Promise<Address> {
  return apiFetch<Address>("/addresses", { method: "POST", body: input });
}
