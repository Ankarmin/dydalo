import { useState } from "react";

export function useStoreData<T>(getData: () => T): T {
  const [data] = useState<T>(getData);
  return data;
}
