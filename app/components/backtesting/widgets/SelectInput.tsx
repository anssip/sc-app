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
    <div className="form-group mb-4">
      <label htmlFor={name} className="block text-sm font-medium mb-1">
        {parameter.label}
        {parameter.required && <span className="text-red-500 ml-1">*</span>}
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
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
