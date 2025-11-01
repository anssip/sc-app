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
    // If already loaded, use cached schemas
    if (schemaService.isLoaded()) {
      setSchemas(schemaService.getAllSchemas());
      setLoading(false);
      return;
    }

    // Load schemas from Firestore
    schemaService
      .loadSchemas()
      .then(() => {
        setSchemas(schemaService.getAllSchemas());
        setLoading(false);
      })
      .catch((err) => {
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
