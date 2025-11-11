import type { Timestamp } from "firebase/firestore";

/**
 * Parameter types supported in indicator schemas
 */
export type ParameterType = "number" | "boolean" | "select" | "color";

/**
 * Definition for a single parameter in an indicator schema
 */
export interface ParameterDefinition {
  type: ParameterType;
  label: string;
  description: string;
  default: any;

  // Type-specific constraints
  min?: number; // For number
  max?: number; // For number
  step?: number; // For number
  options?: Array<{
    // For select
    value: string | number;
    label: string;
  }>;

  // Validation
  required?: boolean;
  validation?: string; // Custom validation expression (e.g., "slowPeriod > fastPeriod")
}

/**
 * Category classification for indicators
 */
export type IndicatorCategory =
  | "trend"
  | "momentum"
  | "volatility"
  | "volume"
  | "other";

/**
 * Output type for indicator visualization
 */
export type OutputType = "line" | "histogram" | "area";

/**
 * Definition of what an indicator produces (for chart display)
 */
export interface IndicatorOutput {
  name: string; // e.g., "ma50", "rsi", "macd_line"
  label: string; // e.g., "Fast MA", "RSI Value", "MACD Line"
  type: OutputType;
  overlay: boolean; // true = overlay on price chart, false = separate panel
}

/**
 * Complete schema for an indicator
 * Stored in Firestore /indicators/{id}
 */
export interface IndicatorSchema {
  id: string; // Must match Market API evaluator ID
  name: string; // Display name
  description: string; // User-friendly description
  category: IndicatorCategory;

  // Parameter definitions
  parameters: Record<string, ParameterDefinition>;

  // Output definitions (what the indicator produces)
  outputs: IndicatorOutput[];

  // Metadata
  version: number;
  tags: string[];
  isPublic: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Result of parameter validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
