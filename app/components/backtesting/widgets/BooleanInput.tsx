import type { ParameterDefinition } from "~/types/schema";

interface BooleanInputProps {
  name: string;
  parameter: ParameterDefinition;
  value: boolean;
  onChange: (value: boolean) => void;
}

/**
 * Boolean checkbox widget for indicator parameters
 */
export function BooleanInput({
  name,
  parameter,
  value,
  onChange,
}: BooleanInputProps) {
  return (
    <div className="form-group mb-4">
      <label htmlFor={name} className="flex items-center cursor-pointer">
        <input
          id={name}
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="ml-2 text-sm font-medium">
          {parameter.label}
          {parameter.required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
      {parameter.description && (
        <small className="block mt-1 ml-6 text-xs text-gray-500">
          {parameter.description}
        </small>
      )}
    </div>
  );
}
