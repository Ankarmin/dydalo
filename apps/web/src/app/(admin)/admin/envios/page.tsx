import type { Metadata } from "next";
import { EnviosClient } from "./envios-client";

export const metadata: Metadata = {
  title: "Envíos",
};

export default function EnviosPage() {
  return <EnviosClient />;
}
