import { NumberInput } from "./NumberInput";
import { SelectInput } from "./SelectInput";
import { BooleanInput } from "./BooleanInput";
import type { ParameterType } from "~/types/schema";

/**
 * Get the appropriate widget component for a parameter type
 */
export function getWidgetComponent(type: ParameterType) {
  switch (type) {
    case "number":
      return NumberInput;
    case "select":
      return SelectInput;
    case "boolean":
      return BooleanInput;
    case "color":
      // TODO: Implement ColorInput widget
      return NumberInput; // Fallback for now
    default:
      return NumberInput;
  }
}

export { NumberInput, SelectInput, BooleanInput };
