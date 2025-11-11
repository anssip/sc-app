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
    <div className="form-group mb-3">
      <label htmlFor={name} className="flex items-center cursor-pointer">
        <input
          id={name}
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 text-accent-primary bg-gray-800 border-gray-700 rounded focus:ring-accent-primary focus:ring-offset-gray-900"
        />
        <span className="ml-2 text-xs font-medium text-gray-300">
          {parameter.label}
          {parameter.required && <span className="text-red-400 ml-1">*</span>}
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
