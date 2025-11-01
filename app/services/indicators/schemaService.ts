import { collection, getDocs } from "firebase/firestore";
import { db } from "~/lib/firebase";
import type {
  IndicatorSchema,
  ValidationResult,
  ParameterDefinition,
} from "~/types/schema";

/**
 * Service for managing indicator schemas from Firestore
 * Provides schema loading, validation, and parameter management
 */
class IndicatorSchemaService {
  private schemas = new Map<string, IndicatorSchema>();
  private loading: Promise<void> | null = null;

  /**
   * Load all indicator schemas from Firestore
   * Caches results and ensures single load operation
   */
  async loadSchemas(): Promise<void> {
    if (this.loading) return this.loading;

    this.loading = (async () => {
      try {
        const schemasRef = collection(db, "indicators");
        const snapshot = await getDocs(schemasRef);

        this.schemas.clear();
        snapshot.forEach((doc) => {
          const schema = doc.data() as IndicatorSchema;
          this.schemas.set(doc.id, schema);
        });
      } catch (error) {
        console.error("Failed to load indicator schemas:", error);
        throw error;
      }
    })();

    return this.loading;
  }

  /**
   * Get a specific indicator schema by ID
   */
  getSchema(evaluatorId: string): IndicatorSchema | null {
    return this.schemas.get(evaluatorId) || null;
  }

  /**
   * Get all loaded indicator schemas
   */
  getAllSchemas(): IndicatorSchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Get schemas filtered by category
   */
  getSchemasByCategory(category: string): IndicatorSchema[] {
    return this.getAllSchemas().filter((s) => s.category === category);
  }

  /**
   * Validate parameters against schema
   */
  validateParams(
    evaluatorId: string,
    params: Record<string, any>
  ): ValidationResult {
    const schema = this.getSchema(evaluatorId);
    if (!schema) {
      return {
        valid: false,
        errors: [`Unknown indicator: ${evaluatorId}`],
      };
    }

    const errors: string[] = [];

    // Check required params
    Object.entries(schema.parameters).forEach(([key, def]) => {
      if (def.required && !(key in params)) {
        errors.push(`Missing required parameter: ${def.label}`);
      }
    });

    // Validate param values
    Object.entries(params).forEach(([key, value]) => {
      const def = schema.parameters[key];
      if (!def) {
        errors.push(`Unknown parameter: ${key}`);
        return;
      }

      // Type validation
      this.validateParamType(def, key, value, errors);

      // Custom validation expressions
      if (def.validation) {
        this.validateCustomRule(def.validation, params, errors);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate parameter type constraints
   */
  private validateParamType(
    def: ParameterDefinition,
    key: string,
    value: any,
    errors: string[]
  ): void {
    if (def.type === "number") {
      if (typeof value !== "number" || isNaN(value)) {
        errors.push(`${def.label} must be a number`);
      } else {
        if (def.min !== undefined && value < def.min) {
          errors.push(`${def.label} must be >= ${def.min}`);
        }
        if (def.max !== undefined && value > def.max) {
          errors.push(`${def.label} must be <= ${def.max}`);
        }
      }
    } else if (def.type === "boolean") {
      if (typeof value !== "boolean") {
        errors.push(`${def.label} must be true or false`);
      }
    } else if (def.type === "select") {
      const validValues = def.options?.map((o) => o.value) || [];
      if (!validValues.includes(value)) {
        errors.push(
          `${def.label} must be one of: ${validValues.join(", ")}`
        );
      }
    }
  }

  /**
   * Validate custom validation expressions
   * Example: "slowPeriod > fastPeriod"
   */
  private validateCustomRule(
    expression: string,
    params: Record<string, any>,
    errors: string[]
  ): void {
    try {
      const isValid = this.evaluateValidation(expression, params);
      if (!isValid) {
        errors.push(`Validation failed: ${expression}`);
      }
    } catch (e) {
      // If evaluation fails, log but don't add error
      // This prevents breaking on malformed validation expressions
      console.warn(`Failed to evaluate validation expression: ${expression}`, e);
    }
  }

  /**
   * Evaluate a validation expression
   * Creates a function with parameter names as variables
   */
  private evaluateValidation(
    expression: string,
    params: Record<string, any>
  ): boolean {
    try {
      const paramNames = Object.keys(params);
      const paramValues = Object.values(params);
      const fn = new Function(...paramNames, `return ${expression};`);
      return fn(...paramValues);
    } catch {
      return true; // If evaluation fails, assume valid
    }
  }

  /**
   * Get default parameter values for an indicator
   */
  getDefaultParams(evaluatorId: string): Record<string, any> {
    const schema = this.getSchema(evaluatorId);
    if (!schema) return {};

    const defaults: Record<string, any> = {};
    Object.entries(schema.parameters).forEach(([key, def]) => {
      defaults[key] = def.default;
    });
    return defaults;
  }

  /**
   * Check if schemas are loaded
   */
  isLoaded(): boolean {
    return this.schemas.size > 0;
  }

  /**
   * Clear cached schemas (useful for testing or refresh)
   */
  clear(): void {
    this.schemas.clear();
    this.loading = null;
  }
}

// Export singleton instance
export const schemaService = new IndicatorSchemaService();
