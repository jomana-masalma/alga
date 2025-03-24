"use client";

import { useEffect } from "react";

export function HydrationFix({ children }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const originalError = console.error;
      console.error = (...args) => {
        if (
          typeof args[0] === "string" &&
          args[0].includes("Hydration failed because") &&
          args[0].includes("cz-shortcut-listen")
        ) {
          return;
        }
        originalError(...args);
      };
      return () => {
        console.error = originalError;
      };
    }
  }, []);

  return children;
}
