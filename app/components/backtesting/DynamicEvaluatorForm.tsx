import { getWidgetComponent } from "./widgets";
import type { IndicatorSchema } from "~/types/schema";

interface DynamicEvaluatorFormProps {
  schema: IndicatorSchema;
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
}

/**
 * Dynamically generates a form for indicator parameters based on schema
 * Renders appropriate input widgets for each parameter type
 */
export function DynamicEvaluatorForm({
  schema,
  values,
  onChange,
}: DynamicEvaluatorFormProps) {
  const handleParamChange = (key: string, value: any) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="evaluator-form bg-white rounded-lg p-4 border border-gray-200">
      <div className="evaluator-header mb-4 flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold">{schema.name}</h4>
          <span className="inline-block px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
            {schema.category}
          </span>
        </div>
      </div>

      <p className="description text-sm text-gray-600 mb-4">
        {schema.description}
      </p>

      <div className="parameters">
        {Object.entries(schema.parameters).map(([key, param]) => {
          const Widget = getWidgetComponent(param.type);
          return (
            <Widget
              key={key}
              name={key}
              parameter={param}
              value={values[key] ?? param.default}
              onChange={(val) => handleParamChange(key, val)}
            />
          );
        })}
      </div>
    </div>
  );
}
