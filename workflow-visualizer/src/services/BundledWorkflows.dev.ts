/**
 * Development version of bundled workflow definitions
 * Loads workflows directly from the source location for development
 */

// Import workflow files as raw text from source location
import waterfallYaml from '../../../resources/workflows/waterfall.yaml?raw';
import epccYaml from '../../../resources/workflows/epcc.yaml?raw';
import bugfixYaml from '../../../resources/workflows/bugfix.yaml?raw';
import minorYaml from '../../../resources/workflows/minor.yaml?raw';
import greenfieldYaml from '../../../resources/workflows/greenfield.yaml?raw';

export const BUNDLED_WORKFLOWS: Record<string, string> = {
  waterfall: waterfallYaml,
  epcc: epccYaml,
  bugfix: bugfixYaml,
  minor: minorYaml,
  greenfield: greenfieldYaml
};

export function getBundledWorkflow(name: string): string | null {
  return BUNDLED_WORKFLOWS[name] || null;
}

export function getBundledWorkflowNames(): string[] {
  return Object.keys(BUNDLED_WORKFLOWS);
}
