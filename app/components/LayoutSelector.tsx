import React from 'react';
import { PanelLayout, LAYOUT_PRESETS } from './ChartPanel';

interface LayoutSelectorProps {
  currentLayout: PanelLayout;
  onLayoutChange: (layout: PanelLayout) => void;
  className?: string;
}

const LayoutButton: React.FC<{
  name: string;
  layout: PanelLayout;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}> = ({ name, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`
      flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-200
      ${isActive 
        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-300' 
        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
      }
    `}
    title={`Switch to ${name} layout`}
  >
    {icon}
    <span className="text-xs font-medium">{name}</span>
  </button>
);

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  currentLayout,
  onLayoutChange,
  className = "",
}) => {
  const layoutConfigs = [
    {
      name: 'Single',
      key: 'single',
      layout: LAYOUT_PRESETS.single,
      icon: (
        <div className="w-8 h-6 border border-current rounded-sm" />
      ),
    },
    {
      name: 'Horizontal',
      key: 'horizontal',
      layout: LAYOUT_PRESETS.horizontal,
      icon: (
        <div className="flex gap-1">
          <div className="w-3 h-6 border border-current rounded-sm" />
          <div className="w-3 h-6 border border-current rounded-sm" />
        </div>
      ),
    },
    {
      name: 'Vertical',
      key: 'vertical',
      layout: LAYOUT_PRESETS.vertical,
      icon: (
        <div className="flex flex-col gap-1">
          <div className="w-8 h-2 border border-current rounded-sm" />
          <div className="w-8 h-2 border border-current rounded-sm" />
        </div>
      ),
    },
    {
      name: 'Quad',
      key: 'quad',
      layout: LAYOUT_PRESETS.quad,
      icon: (
        <div className="grid grid-cols-2 gap-1">
          <div className="w-3 h-2 border border-current rounded-sm" />
          <div className="w-3 h-2 border border-current rounded-sm" />
          <div className="w-3 h-2 border border-current rounded-sm" />
          <div className="w-3 h-2 border border-current rounded-sm" />
        </div>
      ),
    },
    {
      name: 'Triple',
      key: 'triple',
      layout: LAYOUT_PRESETS.triple,
      icon: (
        <div className="flex gap-1">
          <div className="w-3 h-6 border border-current rounded-sm" />
          <div className="flex flex-col gap-1">
            <div className="w-3 h-2 border border-current rounded-sm" />
            <div className="w-3 h-2 border border-current rounded-sm" />
          </div>
        </div>
      ),
    },
  ];

  const isLayoutActive = (presetLayout: PanelLayout) => {
    return JSON.stringify(currentLayout) === JSON.stringify(presetLayout);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
        Layout:
      </span>
      <div className="flex gap-2">
        {layoutConfigs.map((config) => (
          <LayoutButton
            key={config.key}
            name={config.name}
            layout={config.layout}
            isActive={isLayoutActive(config.layout)}
            onClick={() => onLayoutChange(config.layout)}
            icon={config.icon}
          />
        ))}
      </div>
    </div>
  );
};