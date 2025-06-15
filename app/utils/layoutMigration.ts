import { loadLayout, clearLayout } from './layoutPersistence';
import { convertFromChartPanelLayout } from './layoutConverter';
import { getRepository } from '~/services/repository';
import type { PanelLayout } from '~/components/ChartPanel';
import type { ChartConfig } from '~/types';

/**
 * Migration utility to transition from localStorage-based layout persistence
 * to the new repository system
 */

export interface MigrationResult {
  success: boolean;
  layoutsMigrated: number;
  errors: string[];
  warnings: string[];
}

/**
 * Migrates a single layout from localStorage to repository
 */
export async function migrateLayoutFromStorage(
  userId: string,
  layoutName: string = 'Migrated Layout'
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    layoutsMigrated: 0,
    errors: [],
    warnings: []
  };

  try {
    // Check if there's a layout in localStorage
    const oldLayout = loadLayout();

    if (!oldLayout) {
      result.warnings.push('No layout found in localStorage to migrate');
      result.success = true;
      return result;
    }

    // Get repository instance
    const repository = getRepository(userId);

    if (!repository) {
      result.errors.push('Repository not available for migration');
      return result;
    }

    // Convert layout format
    const charts = new Map<string, ChartConfig>();
    const repositoryLayout = convertFromChartPanelLayout(oldLayout, charts);

    // Save to repository
    const savedLayout = await repository.saveLayout({
      name: layoutName,
      userId,
      layout: repositoryLayout
    });

    // Save individual charts
    for (const [, chart] of charts) {
      try {
        await repository.saveChart(chart);
      } catch (error) {
        result.warnings.push(`Failed to save chart ${chart.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    result.layoutsMigrated = 1;
    result.success = true;

    // Clear old layout from localStorage
    clearLayout();

    console.log('Successfully migrated layout:', savedLayout.name);

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown migration error');
  }

  return result;
}

/**
 * Checks if there's a layout in localStorage that needs migration
 */
export function hasLayoutToMigrate(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const layout = loadLayout();
    return layout !== null;
  } catch (error) {
    console.warn('Error checking for legacy layout:', error);
    return false;
  }
}

/**
 * Creates a default layout name based on the current date
 */
export function generateMigrationLayoutName(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  return `Legacy Layout - ${dateStr}`;
}

/**
 * Automatic migration that runs on app startup
 */
export async function autoMigrateLegacyLayout(userId: string): Promise<MigrationResult | null> {
  if (!hasLayoutToMigrate()) {
    return null;
  }

  try {
    const layoutName = generateMigrationLayoutName();
    const result = await migrateLayoutFromStorage(userId, layoutName);

    if (result.success) {
      console.log('Auto-migration completed:', result);
    } else {
      console.error('Auto-migration failed:', result.errors);
    }

    return result;
  } catch (error) {
    console.error('Auto-migration error:', error);
    return {
      success: false,
      layoutsMigrated: 0,
      errors: [error instanceof Error ? error.message : 'Auto-migration failed'],
      warnings: []
    };
  }
}

/**
 * Validates that a layout can be migrated
 */
export function validateLayoutForMigration(layout: PanelLayout): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check basic structure
  if (!layout.id) {
    issues.push('Layout missing ID');
  }

  if (!layout.type || !['chart', 'group'].includes(layout.type)) {
    issues.push('Invalid layout type');
  }

  // Recursively validate children
  if (layout.type === 'group' && layout.children) {
    layout.children.forEach((child, index) => {
      const childValidation = validateLayoutForMigration(child);
      if (!childValidation.valid) {
        issues.push(`Child ${index}: ${childValidation.issues.join(', ')}`);
      }
    });
  }

  // Validate chart configuration
  if (layout.type === 'chart' && layout.chart) {
    if (!layout.chart.symbol) {
      issues.push('Chart missing symbol');
    }
    if (!layout.chart.granularity) {
      issues.push('Chart missing granularity');
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Preview what would be migrated without actually performing the migration
 */
export function previewMigration(): {
  hasLayout: boolean;
  layout: PanelLayout | null;
  chartCount: number;
  validation: { valid: boolean; issues: string[] };
} {
  const layout = loadLayout();

  if (!layout) {
    return {
      hasLayout: false,
      layout: null,
      chartCount: 0,
      validation: { valid: false, issues: ['No layout to migrate'] }
    };
  }

  // Count charts in layout
  function countCharts(l: PanelLayout): number {
    if (l.type === 'chart') return 1;
    if (l.type === 'group' && l.children) {
      return l.children.reduce((count, child) => count + countCharts(child), 0);
    }
    return 0;
  }

  const chartCount = countCharts(layout);
  const validation = validateLayoutForMigration(layout);

  return {
    hasLayout: true,
    layout,
    chartCount,
    validation
  };
}

/**
 * Clean up any remaining localStorage data after migration
 */
export function cleanupPostMigration(): void {
  try {
    clearLayout();

    // Clear any other legacy keys if they exist
    const legacyKeys = [
      'chartPanelLayout',
      'chartPreferences',
      'layoutHistory'
    ];

    legacyKeys.forEach(key => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to clean up legacy key ${key}:`, error);
        }
      }
    });

    console.log('Post-migration cleanup completed');
  } catch (error) {
    console.warn('Post-migration cleanup error:', error);
  }
}

/**
 * Export all migration functions for use in components
 */
export const layoutMigration = {
  migrate: migrateLayoutFromStorage,
  hasLayoutToMigrate,
  autoMigrate: autoMigrateLegacyLayout,
  preview: previewMigration,
  validate: validateLayoutForMigration,
  cleanup: cleanupPostMigration,
  generateName: generateMigrationLayoutName
};
