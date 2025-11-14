/**
 * Accessibility Testing Helper
 *
 * Utility functions for axe-core accessibility testing
 */

import axe, { type AxeResults, type RunOptions } from 'axe-core';

/**
 * Create an axe instance configured for WCAG 2.2 AA testing
 */
export async function createAxeInstance() {
  return axe;
}

/**
 * Default axe configuration for WCAG 2.2 AA compliance
 */
export const axeConfig: RunOptions = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
  },
};

/**
 * Format axe violation results for readable output
 */
export function formatViolations(results: AxeResults): string {
  if (results.violations.length === 0) {
    return 'No accessibility violations found';
  }

  return results.violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => {
          return `  - ${node.html}\n    ${node.failureSummary}`;
        })
        .join('\n');

      return `${violation.id}: ${violation.description}\n${nodes}`;
    })
    .join('\n\n');
}

/**
 * Check specific accessibility rules
 */
export async function checkA11y(
  element: HTMLElement,
  rules?: string[]
): Promise<AxeResults> {
  const options: RunOptions = rules
    ? { runOnly: { type: 'rule', values: rules } }
    : axeConfig;

  return await axe.run(element, options);
}

/**
 * Common accessibility test assertions
 */
export const a11yAssertions = {
  hasNoViolations: (results: AxeResults) => {
    if (results.violations.length > 0) {
      throw new Error(
        `Accessibility violations found:\n${formatViolations(results)}`
      );
    }
  },

  hasNoColorContrastViolations: async (element: HTMLElement) => {
    const results = await checkA11y(element, ['color-contrast']);
    a11yAssertions.hasNoViolations(results);
  },

  hasProperHeadingOrder: async (element: HTMLElement) => {
    const results = await checkA11y(element, ['heading-order']);
    a11yAssertions.hasNoViolations(results);
  },

  hasAccessibleLabels: async (element: HTMLElement) => {
    const results = await checkA11y(element, ['label', 'label-title-only']);
    a11yAssertions.hasNoViolations(results);
  },

  hasKeyboardAccess: async (element: HTMLElement) => {
    const results = await checkA11y(element, [
      'button-name',
      'link-name',
      'focus-order-semantics',
    ]);
    a11yAssertions.hasNoViolations(results);
  },
};
