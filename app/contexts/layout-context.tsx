import React, { createContext, useContext, useState, ReactNode } from "react";

interface LayoutContextType {
  currentLayoutId: string | null;
  setCurrentLayoutId: (layoutId: string | null) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);

  return (
    <LayoutContext.Provider value={{ currentLayoutId, setCurrentLayoutId }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayoutContext() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayoutContext must be used within a LayoutProvider");
  }
  return context;
}
