import { PanelLayout } from '~/components/ChartPanel';

const LAYOUT_STORAGE_KEY = 'chartPanelLayout';

export const saveLayout = (layout: PanelLayout): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    } catch (error) {
      console.warn('Failed to save layout to localStorage:', error);
    }
  }
};

export const loadLayout = (): PanelLayout | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as PanelLayout;
    }
  } catch (error) {
    console.warn('Failed to load layout from localStorage:', error);
  }
  
  return null;
};

export const clearLayout = (): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LAYOUT_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear layout from localStorage:', error);
    }
  }
};