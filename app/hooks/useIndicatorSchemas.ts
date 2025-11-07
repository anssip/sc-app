import { useState, useEffect } from "react";
import { schemaService } from "~/services/indicators/schemaService";
import type { IndicatorSchema } from "~/types/schema";

/**
 * React hook for loading and accessing indicator schemas from Firestore
 * Loads schemas on mount and provides loading/error states
 */
export function useIndicatorSchemas() {
  const [schemas, setSchemas] = useState<IndicatorSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log("[useIndicatorSchemas] Hook initializing...");

    // If already loaded, use cached schemas
    if (schemaService.isLoaded()) {
      const loadedSchemas = schemaService.getAllSchemas();
      console.log(
        "[useIndicatorSchemas] Using cached schemas:",
        loadedSchemas.length
      );
      setSchemas(loadedSchemas);
      setLoading(false);
      return;
    }

    console.log("[useIndicatorSchemas] Loading schemas from Firestore...");

    // Load schemas from Firestore
    schemaService
      .loadSchemas()
      .then(() => {
        const loadedSchemas = schemaService.getAllSchemas();
        console.log(
          "[useIndicatorSchemas] Schemas loaded:",
          loadedSchemas.length
        );
        console.log(
          "[useIndicatorSchemas] Schema IDs:",
          loadedSchemas.map((s) => s.id)
        );
        setSchemas(loadedSchemas);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[useIndicatorSchemas] Error loading schemas:", err);
        setError(err);
        setLoading(false);
      });
  }, []);

  return { schemas, loading, error };
}

/**
 * React hook for loading a specific indicator schema
 */
export function useIndicatorSchema(evaluatorId: string) {
  const { schemas, loading, error } = useIndicatorSchemas();
  const schema = schemas.find((s) => s.id === evaluatorId) || null;

  return { schema, loading, error };
}
