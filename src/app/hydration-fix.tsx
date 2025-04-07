// src/app/hydration-fix.tsx
"use client";

import { ReactNode, useEffect } from "react";

interface HydrationFixProps {
  children: ReactNode;
}

export function HydrationFix({ children }: HydrationFixProps) {
  useEffect(() => {
    // Only run in development mode
    if (process.env.NODE_ENV !== "production") {
      // Store the original console.error
      const originalConsoleError = console.error;

      // Override console.error to filter out specific hydration warnings
      console.error = (...args) => {
        // Check for various forms of the hydration error message
        const errorMsg = args[0]?.toString() || '';

        if (
          (errorMsg.includes("Hydration failed") ||
           errorMsg.includes("hydrated but some attributes")) &&
          (errorMsg.includes("cz-shortcut-listen") ||
           errorMsg.includes("browser extension"))
        ) {
          // Ignore this specific error
          return;
        }

        // Pass through all other errors to the original console.error
        originalConsoleError.apply(console, args);
      };

      // Cleanup function to restore original console.error when component unmounts
      return () => {
        console.error = originalConsoleError;
      };
    }
  }, []);

  // Just render children
  return children;
}

export default HydrationFix;
