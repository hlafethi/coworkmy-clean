describe('Booking Flow', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '**/auth/v1/token?grant_type=password', {
      statusCode: 200,
      body: {
        access_token: 'fake-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'fake-refresh-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User'
          }
        }
      }
    }).as('loginRequest');

    // Mock spaces data
    cy.intercept('GET', '**/rest/v1/spaces*', {
      statusCode: 200,
      body: [
        {
          id: 'space-1',
          name: 'Espace Canard',
          description: 'Un espace confortable pour travailler',
          capacity: 4,
          hourly_price: 15,
          daily_price: 80,
          pricing_type: 'hourly'
        },
        {
          id: 'space-2',
          name: 'Salle de réunion',
          description: 'Idéal pour les réunions d\'équipe',
          capacity: 8,
          hourly_price: 25,
          daily_price: 150,
          pricing_type: 'hourly'
        }
      ]
    }).as('getSpaces');

    // Mock availability check
    cy.intercept('GET', '**/rest/v1/bookings*', {
      statusCode: 200,
      body: []
    }).as('getBookings');

    // Mock booking creation
    cy.intercept('POST', '**/rest/v1/bookings', {
      statusCode: 201,
      body: {
        id: 'new-booking-id',
        user_id: 'test-user-id',
        space_id: 'space-1',
        start_time: '2025-05-15T10:00:00Z',
        end_time: '2025-05-15T12:00:00Z',
        total_price_ht: 30,
        total_price_ttc: 36,
        status: 'pending'
      }
    }).as('createBooking');

    // Mock payment session creation
    cy.intercept('POST', '**/functions/v1/create-payment-session', {
      statusCode: 200,
      body: {
        sessionId: 'test-session-id',
        url: '/payment/simulator'
      }
    }).as('createPaymentSession');

    // Login first
    cy.visit('/auth/login');
    cy.get('[data-testid=email-input]').type('test@example.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=login-button]').click();
    cy.wait('@loginRequest');
  });

  it('should complete a booking flow successfully', () => {
    // Navigate to spaces page
    cy.visit('/spaces');
    cy.wait('@getSpaces');

    // Select a space
    cy.contains('Espace Canard').click();
    
    // Select date
    cy.get('[data-testid=date-picker]').click();
    cy.get('.react-datepicker__day:not(.react-datepicker__day--disabled)').first().click();
    
    // Select time slot
    cy.get('[data-testid=time-slot]').first().click();
    
    // Proceed to booking summary
    cy.get('[data-testid=continue-button]').click();
    
    // Verify booking summary
    cy.get('[data-testid=booking-summary]').should('be.visible');
    cy.get('[data-testid=space-name]').should('contain', 'Espace Canard');
    cy.get('[data-testid=booking-price]').should('be.visible');
    
    // Accept terms
    cy.get('[data-testid=terms-checkbox]').click();
    
    // Confirm booking
    cy.get('[data-testid=confirm-booking]').click();
    cy.wait('@createBooking');
    cy.wait('@createPaymentSession');
    
    // Should be redirected to payment page
    cy.url().should('include', '/payment');
    
    // Simulate successful payment
    cy.get('[data-testid=pay-button]').click();
    
    // Should be redirected to success page
    cy.url().should('include', '/payment/success');
    cy.get('[data-testid=success-message]').should('be.visible');
    cy.get('[data-testid=view-bookings]').should('be.visible');
  });

  it('should show error when time slot is not available', () => {
    // Mock unavailable time slot
    cy.intercept('GET', '**/rest/v1/bookings*', {
      statusCode: 200,
      body: [
        {
          id: 'existing-booking',
          space_id: 'space-1',
          start_time: '2025-05-15T10:00:00Z',
          end_time: '2025-05-15T12:00:00Z'
        }
      ]
    }).as('getBookingsWithConflict');

    // Navigate to spaces page
    cy.visit('/spaces');
    cy.wait('@getSpaces');

    // Select a space
    cy.contains('Espace Canard').click();
    
    // Select date
    cy.get('[data-testid=date-picker]').click();
    cy.get('.react-datepicker__day:not(.react-datepicker__day--disabled)').first().click();
    
    // Time slot should be marked as unavailable
    cy.get('[data-testid=time-slot].unavailable').should('exist');
    
    // Try to select unavailable time slot
    cy.get('[data-testid=time-slot].unavailable').first().click();
    
    // Should show error message
    cy.get('[data-testid=error-message]').should('be.visible');
    cy.get('[data-testid=error-message]').should('contain', 'indisponible');
  });

  it('should allow user to cancel a booking', () => {
    // Mock user bookings
    cy.intercept('GET', '**/rest/v1/bookings?user_id=*', {
      statusCode: 200,
      body: [
        {
          id: 'booking-to-cancel',
          user_id: 'test-user-id',
          space_id: 'space-1',
          space_name: 'Espace Canard',
          start_time: '2025-05-20T14:00:00Z',
          end_time: '2025-05-20T16:00:00Z',
          total_price_ht: 30,
          total_price_ttc: 36,
          status: 'confirmed'
        }
      ]
    }).as('getUserBookings');

    // Mock booking cancellation
    cy.intercept('PATCH', '**/rest/v1/bookings?id=*', {
      statusCode: 200,
      body: {
        id: 'booking-to-cancel',
        status: 'cancelled'
      }
    }).as('cancelBooking');

    // Navigate to dashboard
    cy.visit('/dashboard');
    cy.wait('@getUserBookings');

    // Find and click cancel button
    cy.contains('Espace Canard').parent().find('[data-testid=cancel-booking]').click();
    
    // Confirm cancellation in modal
    cy.get('[data-testid=confirm-cancel]').click();
    cy.wait('@cancelBooking');
    
    // Should show success message
    cy.get('[data-testid=success-message]').should('be.visible');
    cy.get('[data-testid=success-message]').should('contain', 'annulée');
  });
});
