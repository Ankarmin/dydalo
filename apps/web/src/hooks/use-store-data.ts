import { useState, useEffect } from "react";

export function useStoreData<T>(getData: () => T, fallback: T): T {
  const [data, setData] = useState<T>(fallback);

  useEffect(() => {
    setData(getData());
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, []);

  return data;
}
