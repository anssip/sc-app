import { useState } from "react";
import { useIndicatorSchemas } from "~/hooks/useIndicatorSchemas";
import { schemaService } from "~/services/indicators/schemaService";
import { DynamicEvaluatorForm } from "./DynamicEvaluatorForm";
import type { EvaluatorConfig } from "~/types/trading";
import type { IndicatorSchema } from "~/types/schema";

interface IndicatorSelectorProps {
  selectedEvaluators: EvaluatorConfig[];
  onChange: (evaluators: EvaluatorConfig[]) => void;
}

/**
 * Component for selecting and configuring indicators
 * Displays available indicators grouped by category
 * Allows adding, removing, and configuring indicator parameters
 */
export function IndicatorSelector({
  selectedEvaluators,
  onChange,
}: IndicatorSelectorProps) {
  const { schemas, loading, error } = useIndicatorSchemas();
  const [selectedId, setSelectedId] = useState<string>("");

  const handleAdd = () => {
    if (!selectedId) return;

    const newEvaluator: EvaluatorConfig = {
      id: selectedId,
      params: schemaService.getDefaultParams(selectedId),
    };

    onChange([...selectedEvaluators, newEvaluator]);
    setSelectedId("");
  };

  const handleRemove = (index: number) => {
    onChange(selectedEvaluators.filter((_, i) => i !== index));
  };

  const handleParamsChange = (index: number, params: Record<string, any>) => {
    const updated = [...selectedEvaluators];
    updated[index] = { ...updated[index], params };
    onChange(updated);
  };

  if (loading) {
    return (
      <div className="indicator-selector">
        <h3 className="text-lg font-semibold mb-4">Indicators</h3>
        <div className="text-gray-500">Loading indicators...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="indicator-selector">
        <h3 className="text-lg font-semibold mb-4">Indicators</h3>
        <div className="text-red-500">Error loading indicators: {error.message}</div>
      </div>
    );
  }

  // Group schemas by category
  const schemasByCategory = schemas.reduce((acc, schema) => {
    if (!acc[schema.category]) acc[schema.category] = [];
    acc[schema.category].push(schema);
    return acc;
  }, {} as Record<string, IndicatorSchema[]>);

  return (
    <div className="indicator-selector">
      <h3 className="text-lg font-semibold mb-4">Indicators</h3>

      {/* Add indicator dropdown */}
      <div className="add-indicator flex gap-2 mb-4">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select indicator to add...</option>
          {Object.entries(schemasByCategory).map(
            ([category, categorySchemas]) => (
              <optgroup key={category} label={category.toUpperCase()}>
                {categorySchemas.map((schema) => (
                  <option key={schema.id} value={schema.id}>
                    {schema.name}
                  </option>
                ))}
              </optgroup>
            )
          )}
        </select>
        <button
          onClick={handleAdd}
          disabled={!selectedId}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Add Indicator
        </button>
      </div>

      {/* Selected indicators with dynamic forms */}
      <div className="selected-indicators space-y-4">
        {selectedEvaluators.length === 0 && (
          <div className="text-gray-500 text-sm italic">
            No indicators selected. Add indicators to visualize and use in strategies.
          </div>
        )}

        {selectedEvaluators.map((evaluator, index) => {
          const schema = schemaService.getSchema(evaluator.id);
          if (!schema) return null;

          return (
            <div key={index} className="evaluator-config relative">
              <DynamicEvaluatorForm
                schema={schema}
                values={evaluator.params || {}}
                onChange={(params) => handleParamsChange(index, params)}
              />
              <button
                onClick={() => handleRemove(index)}
                className="absolute top-4 right-4 px-3 py-1 text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
