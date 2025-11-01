import type { ParameterDefinition } from "~/types/schema";

interface NumberInputProps {
  name: string;
  parameter: ParameterDefinition;
  value: number;
  onChange: (value: number) => void;
}

/**
 * Number input widget for indicator parameters
 * Supports min, max, and step constraints
 */
export function NumberInput({
  name,
  parameter,
  value,
  onChange,
}: NumberInputProps) {
  return (
    <div className="form-group mb-4">
      <label htmlFor={name} className="block text-sm font-medium mb-1">
        {parameter.label}
        {parameter.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={parameter.min}
        max={parameter.max}
        step={parameter.step || 1}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {parameter.description && (
        <small className="block mt-1 text-xs text-gray-500">
          {parameter.description}
        </small>
      )}
    </div>
  );
}
