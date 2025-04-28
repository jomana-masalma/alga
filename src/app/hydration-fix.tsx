// src/app/hydration-fix.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";

interface HydrationFixProps {
  children: ReactNode;
}

export function HydrationFix({ children }: HydrationFixProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Return null on first render to avoid hydration mismatch
  if (!isClient) {
    return null;
  }

  return <>{children}</>;
}

export default HydrationFix;
