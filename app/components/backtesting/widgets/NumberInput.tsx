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
  // Determine unit display based on parameter name
  const getUnit = () => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("period")) {
      return "candles";
    }
    if (lowerName.includes("percent") || lowerName.includes("level")) {
      return "%";
    }
    return "";
  };

  const unit = getUnit();

  return (
    <div className="form-group mb-3">
      <label
        htmlFor={name}
        className="block text-xs font-medium text-gray-300 mb-1"
      >
        {parameter.label}
        {unit && <span className="text-gray-500 ml-1">({unit})</span>}
        {parameter.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        id={name}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={parameter.min}
        max={parameter.max}
        step={parameter.step || 1}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
      />
      {parameter.description && (
        <small className="block mt-1 text-xs text-gray-500">
          {parameter.description}
        </small>
      )}
    </div>
  );
}
