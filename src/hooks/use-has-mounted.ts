"use client";

import { useEffect, useState } from "react";

/**
 * Returns true only after the component has mounted on the client.
 *
 * Use this to guard any render output that depends on state hydrated
 * from localStorage (e.g. Zustand `persist` stores like cart/wishlist).
 * Without it, the server renders with empty/default state while the
 * client can render with restored state, causing a hydration mismatch.
 */
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}
