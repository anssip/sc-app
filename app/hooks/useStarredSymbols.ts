import { useState, useEffect } from "react";
import { useRepository } from "./useRepository";

interface UseStarredSymbolsReturn {
  starredSymbols: string[];
  isLoading: boolean;
  error: string | null;
  updateStarredSymbols: (symbols: string[]) => Promise<void>;
  isSymbolStarred: (symbol: string) => boolean;
}

export function useStarredSymbols(layoutId?: string): UseStarredSymbolsReturn {
  const { repository, isLoading: repoLoading, error: repoError } = useRepository();
  const [starredSymbols, setStarredSymbols] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repository || repoLoading || !layoutId) return;

    async function loadStarredSymbols() {
      if (!repository || !layoutId) return;

      try {
        setIsLoading(true);
        setError(null);
        const symbols = await repository.getLayoutStarredSymbols(layoutId);
        setStarredSymbols(symbols);
      } catch (err) {
        console.error("Failed to load starred symbols:", err);
        setError(err instanceof Error ? err.message : "Failed to load starred symbols");
      } finally {
        setIsLoading(false);
      }
    }

    loadStarredSymbols();

    // Listen for layout changes
    const unsubscribe = repository?.addEventListener((event) => {
      if (event.type === "layout_updated" && event.data.id === layoutId) {
        // Reload starred symbols when layout is updated
        loadStarredSymbols();
      }
    });

    return unsubscribe || (() => {});
  }, [repository, repoLoading, layoutId]);

  const updateStarredSymbols = async (symbols: string[]): Promise<void> => {
    if (!repository || !layoutId) {
      throw new Error("Repository or layoutId not available");
    }
    await repository.updateLayoutStarredSymbols(layoutId, symbols);
    // Update local state immediately
    setStarredSymbols(symbols);
  };

  const isSymbolStarred = (symbol: string): boolean => {
    return starredSymbols.includes(symbol);
  };

  return {
    starredSymbols,
    isLoading: isLoading || repoLoading || !layoutId,
    error: error || repoError,
    updateStarredSymbols,
    isSymbolStarred,
  };
}