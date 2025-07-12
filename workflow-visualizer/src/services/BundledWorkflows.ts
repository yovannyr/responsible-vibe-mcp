/**
 * Bundled workflow definitions
 * Contains all built-in workflows as string constants to avoid runtime file loading
 */

// Import workflow files as raw text (Vite will handle this)
import waterfallYaml from '../../public/workflows/waterfall.yaml?raw';
import epccYaml from '../../public/workflows/epcc.yaml?raw';
import bugfixYaml from '../../public/workflows/bugfix.yaml?raw';
import minorYaml from '../../public/workflows/minor.yaml?raw';
import greenfieldYaml from '../../public/workflows/greenfield.yaml?raw';

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
