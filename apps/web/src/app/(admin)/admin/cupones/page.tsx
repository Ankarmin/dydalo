import type { Metadata } from "next";
import { CuponesClient } from "./cupones-client";

export const metadata: Metadata = {
  title: "Cupones",
};

export default function CuponesPage() {
  return <CuponesClient />;
}
