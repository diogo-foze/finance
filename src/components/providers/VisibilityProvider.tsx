"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type VisibilityContextType = {
  isVisible: boolean;
  toggleVisibility: () => void;
};

const VisibilityContext = createContext<VisibilityContextType | undefined>(undefined);

export function VisibilityProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = sessionStorage.getItem("financial_visibility");
    if (saved !== null) {
      setIsVisible(saved === "true");
    }
  }, []);

  const toggleVisibility = () => {
    setIsVisible((prev) => {
      const next = !prev;
      sessionStorage.setItem("financial_visibility", String(next));
      return next;
    });
  };

  // Prevent hydration mismatch by defaulting to false until mounted, but since default is false it's mostly fine anyway
  return (
    <VisibilityContext.Provider value={{ isVisible: mounted ? isVisible : false, toggleVisibility }}>
      {children}
    </VisibilityContext.Provider>
  );
}

export function useVisibility() {
  const context = useContext(VisibilityContext);
  if (context === undefined) {
    throw new Error("useVisibility must be used within a VisibilityProvider");
  }
  return context;
}
