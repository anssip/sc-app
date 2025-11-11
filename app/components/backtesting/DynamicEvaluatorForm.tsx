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
    <div className="evaluator-form">
      <div className="evaluator-header mb-3 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-white">{schema.name}</h4>
          <span className="inline-block px-2 py-0.5 text-xs font-medium text-blue-400 bg-blue-900/30 rounded mt-1">
            {schema.category}
          </span>
        </div>
      </div>

      <p className="description text-xs text-gray-400 mb-3">
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
