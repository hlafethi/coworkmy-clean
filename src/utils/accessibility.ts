import axe from 'axe-core';

/**
 * Accessibility testing utilities
 * This module provides functions for testing and improving accessibility
 * based on WCAG guidelines
 */

/**
 * Initialize accessibility testing in development mode
 * This will run axe-core to check for accessibility issues
 */
export function initAccessibilityTesting() {
  if (import.meta.env.DEV) {
    // Only run in development mode
    setTimeout(() => {
      axe.run(document.body, {
        rules: {
          // Include specific rules or customize existing ones
          'color-contrast': { enabled: true },
          'html-has-lang': { enabled: true },
          'image-alt': { enabled: true },
          'label': { enabled: true },
          'link-name': { enabled: true },
          'list': { enabled: true },
          'listitem': { enabled: true },
          'meta-viewport': { enabled: true },
        }
      }, (err, results) => {
        if (err) {
          console.error('Error running accessibility tests:', err);
          return;
        }
        
        // Log results to console
        if (results.violations.length) {
          console.warn('Accessibility issues found:');
          
          results.violations.forEach((violation) => {
            const nodes = violation.nodes.map(node => node.html).join('\n');
            console.warn(`${violation.impact} impact: ${violation.help}`);
            console.warn(`WCAG: ${violation.tags.filter(tag => tag.includes('wcag')).join(', ')}`);
            console.warn(`Affected elements:\n${nodes}`);
            console.warn(`More info: ${violation.helpUrl}`);
            console.warn('---');
          });
          
          console.warn(`${results.violations.length} accessibility issues found. See above for details.`);
        } else {
          console.log('No accessibility issues found!');
        }
      });
    }, 3000); // Wait for the app to fully render
  }
}

/**
 * Check if an element meets WCAG contrast requirements
 * @param element The element to check
 * @returns A promise that resolves to the test results
 */
export function checkContrast(element: HTMLElement) {
  return new Promise((resolve) => {
    axe.run(element, {
      rules: {
        'color-contrast': { enabled: true }
      }
    }, (err, results) => {
      if (err) {
        console.error('Error checking contrast:', err);
        resolve({ passed: false, error: err });
        return;
      }
      
      resolve({
        passed: results.violations.length === 0,
        violations: results.violations
      });
    });
  });
}

/**
 * WCAG Success Criteria
 * These are the main criteria for WCAG 2.1 AA compliance
 */
export const WCAG_CRITERIA = {
  // Perceivable
  '1.1.1': 'Non-text Content: Provide text alternatives for non-text content',
  '1.2.1': 'Audio-only and Video-only: Provide alternatives for time-based media',
  '1.2.2': 'Captions: Provide captions for videos with audio',
  '1.2.3': 'Audio Description or Media Alternative: Provide alternatives for time-based media',
  '1.2.4': 'Captions (Live): Provide captions for live audio content',
  '1.2.5': 'Audio Description: Provide audio description for video content',
  '1.3.1': 'Info and Relationships: Information, structure, and relationships can be programmatically determined',
  '1.3.2': 'Meaningful Sequence: Present content in a meaningful order',
  '1.3.3': 'Sensory Characteristics: Don\'t rely solely on sensory characteristics',
  '1.3.4': 'Orientation: Content not restricted to specific orientation',
  '1.3.5': 'Identify Input Purpose: Input fields have appropriate autocomplete attributes',
  '1.4.1': 'Use of Color: Don\'t use color as the only visual means of conveying information',
  '1.4.2': 'Audio Control: Provide user controls for audio that plays automatically',
  '1.4.3': 'Contrast (Minimum): Text has sufficient contrast against its background',
  '1.4.4': 'Resize Text: Text can be resized without loss of content or function',
  '1.4.5': 'Images of Text: Use text rather than images of text',
  '1.4.10': 'Reflow: Content can be presented without scrolling in two dimensions',
  '1.4.11': 'Non-text Contrast: UI components and graphical objects have sufficient contrast',
  '1.4.12': 'Text Spacing: No loss of content when text spacing is adjusted',
  '1.4.13': 'Content on Hover or Focus: Additional content is dismissable, hoverable, and persistent',
  
  // Operable
  '2.1.1': 'Keyboard: All functionality is available from a keyboard',
  '2.1.2': 'No Keyboard Trap: Users can navigate away from components using a keyboard',
  '2.1.4': 'Character Key Shortcuts: Shortcuts can be turned off or remapped',
  '2.2.1': 'Timing Adjustable: Users can adjust time limits',
  '2.2.2': 'Pause, Stop, Hide: Users can control moving, blinking, or auto-updating content',
  '2.3.1': 'Three Flashes or Below: Content doesn\'t flash more than three times per second',
  '2.4.1': 'Bypass Blocks: Users can bypass repeated blocks of content',
  '2.4.2': 'Page Titled: Pages have titles that describe their topic or purpose',
  '2.4.3': 'Focus Order: Components receive focus in an order that preserves meaning',
  '2.4.4': 'Link Purpose (In Context): The purpose of each link can be determined from the link text',
  '2.4.5': 'Multiple Ways: Multiple ways are available to find pages',
  '2.4.6': 'Headings and Labels: Headings and labels describe topic or purpose',
  '2.4.7': 'Focus Visible: Keyboard focus indicator is visible',
  '2.5.1': 'Pointer Gestures: Complex gestures have alternatives',
  '2.5.2': 'Pointer Cancellation: Functions don\'t execute on the down-event',
  '2.5.3': 'Label in Name: The accessible name contains the visible text label',
  '2.5.4': 'Motion Actuation: Functionality triggered by motion can also be operated by UI components',
  
  // Understandable
  '3.1.1': 'Language of Page: The default human language of the page can be programmatically determined',
  '3.1.2': 'Language of Parts: The human language of passages can be programmatically determined',
  '3.2.1': 'On Focus: Elements don\'t change context when they receive focus',
  '3.2.2': 'On Input: Changing a setting doesn\'t automatically change context',
  '3.2.3': 'Consistent Navigation: Navigation is consistent across pages',
  '3.2.4': 'Consistent Identification: Components with the same functionality are identified consistently',
  '3.3.1': 'Error Identification: Errors are identified and described to the user',
  '3.3.2': 'Labels or Instructions: Labels or instructions are provided for user input',
  '3.3.3': 'Error Suggestion: Suggestions for error correction are provided',
  '3.3.4': 'Error Prevention: Users can check, confirm, and correct information before submission',
  
  // Robust
  '4.1.1': 'Parsing: Markup is valid and well-formed',
  '4.1.2': 'Name, Role, Value: UI components have appropriate names, roles, and values',
  '4.1.3': 'Status Messages: Status messages can be programmatically determined',
};

/**
 * Common accessibility issues and how to fix them
 */
export const ACCESSIBILITY_TIPS = {
  'color-contrast': 'Ensure text has a contrast ratio of at least 4.5:1 against its background',
  'image-alt': 'Add alt text to images that convey information',
  'link-name': 'Ensure links have descriptive text that indicates their purpose',
  'button-name': 'Buttons should have text that describes their action',
  'label': 'Form controls should have associated label elements',
  'heading-order': 'Headings should be properly nested (h1, then h2, etc.)',
  'html-lang': 'The <html> element should have a lang attribute',
  'document-title': 'The page should have a descriptive title',
  'aria-roles': 'ARIA roles should be used appropriately',
  'aria-properties': 'ARIA properties should be used correctly',
  'focus-order': 'Tab order should follow a logical sequence',
  'keyboard-nav': 'All interactive elements should be keyboard accessible',
};
