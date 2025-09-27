// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

// Declare global Cypress namespace to add custom commands
declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to login with email and password
     * @example cy.login('user@example.com', 'password')
     */
    login(email: string, password: string): Chainable<Element>;
    
    /**
     * Custom command to select a date in the datepicker
     * @example cy.selectDate('2025-05-15')
     */
    selectDate(date: string): Chainable<Element>;
    
    /**
     * Custom command to select a time slot
     * @example cy.selectTimeSlot('10:00 - 12:00')
     */
    selectTimeSlot(timeSlot: string): Chainable<Element>;
    
    /**
     * Custom command to complete a booking
     * @example cy.completeBooking('space-1', '2025-05-15', '10:00 - 12:00')
     */
    completeBooking(spaceId: string, date: string, timeSlot: string): Chainable<Element>;
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/auth/login');
  cy.get('[data-testid=email-input]').type(email);
  cy.get('[data-testid=password-input]').type(password);
  cy.get('[data-testid=login-button]').click();
  cy.url().should('include', '/dashboard');
});

// Select date command
Cypress.Commands.add('selectDate', (date: string) => {
  const dateObj = new Date(date);
  const day = dateObj.getDate();
  const month = dateObj.getMonth();
  const year = dateObj.getFullYear();
  
  cy.get('[data-testid=date-picker]').click();
  
  // Navigate to the correct month and year if needed
  cy.get('.react-datepicker__current-month').then(($month) => {
    const currentMonthYear = $month.text();
    const targetMonthYear = dateObj.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    
    if (currentMonthYear !== targetMonthYear) {
      // Navigate to the correct month/year
      // This is a simplified version - you may need to adjust based on your datepicker
      const monthDiff = month - new Date().getMonth();
      const yearDiff = year - new Date().getFullYear();
      const totalMonthDiff = yearDiff * 12 + monthDiff;
      
      const buttonSelector = totalMonthDiff > 0 
        ? '.react-datepicker__navigation--next' 
        : '.react-datepicker__navigation--previous';
      
      for (let i = 0; i < Math.abs(totalMonthDiff); i++) {
        cy.get(buttonSelector).click();
      }
    }
  });
  
  // Select the day
  cy.get(`.react-datepicker__day--0${day}`).not('.react-datepicker__day--outside-month').click();
});

// Select time slot command
Cypress.Commands.add('selectTimeSlot', (timeSlot: string) => {
  cy.get('[data-testid=time-slot]').contains(timeSlot).click();
});

// Complete booking command
Cypress.Commands.add('completeBooking', (spaceId: string, date: string, timeSlot: string) => {
  // Navigate to space page
  cy.visit(`/spaces/${spaceId}`);
  
  // Select date and time
  cy.get('[data-testid=date-picker]').click();
  const dateObj = new Date(date);
  const day = dateObj.getDate();
  cy.get(`.react-datepicker__day--0${day}`).not('.react-datepicker__day--outside-month').click();
  
  cy.get('[data-testid=time-slot]').contains(timeSlot).click();
  
  // Continue to summary
  cy.get('[data-testid=continue-button]').click();
  
  // Accept terms and confirm
  cy.get('[data-testid=terms-checkbox]').click();
  cy.get('[data-testid=confirm-booking]').click();
  
  // Complete payment
  cy.url().should('include', '/payment');
  cy.get('[data-testid=pay-button]').click();
  
  // Verify success
  cy.url().should('include', '/payment/success');
});

// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
