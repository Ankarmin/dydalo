import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function useStoreData<T>(getData: () => T, fallback: T): T {
  return useSyncExternalStore(
    subscribe,
    getData,
    () => fallback
  );
}
