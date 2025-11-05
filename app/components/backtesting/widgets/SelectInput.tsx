import type { ParameterDefinition } from "~/types/schema";

interface SelectInputProps {
  name: string;
  parameter: ParameterDefinition;
  value: string | number;
  onChange: (value: string | number) => void;
}

/**
 * Select dropdown widget for indicator parameters
 * Displays options from parameter definition
 */
export function SelectInput({
  name,
  parameter,
  value,
  onChange,
}: SelectInputProps) {
  return (
    <div className="form-group mb-3">
      <label
        htmlFor={name}
        className="block text-xs font-medium text-gray-300 mb-1"
      >
        {parameter.label}
        {parameter.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <select
        id={name}
        value={value}
        onChange={(e) => {
          // Convert to number if the original option value was number
          const selectedOption = parameter.options?.find(
            (opt) => String(opt.value) === e.target.value
          );
          onChange(selectedOption?.value || e.target.value);
        }}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
      >
        {parameter.options?.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {parameter.description && (
        <small className="block mt-1 text-xs text-gray-500">
          {parameter.description}
        </small>
      )}
    </div>
  );
}
