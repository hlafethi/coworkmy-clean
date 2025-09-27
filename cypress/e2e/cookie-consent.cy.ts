import { CookieConsent } from '@/components/common/CookieConsent';

describe('CookieConsent', () => {
  beforeEach(() => {
    // Réinitialiser les cookies avant chaque test
    cy.clearCookies();
    cy.visit('/');
  });

  it('devrait afficher la bannière de cookies par défaut', () => {
    cy.get('[data-testid="cookie-banner"]').should('be.visible');
    cy.get('[data-testid="cookie-banner"]').contains('Gestion des cookies');
  });

  it('devrait fermer la bannière lors du clic sur Accepter', () => {
    cy.get('[data-testid="cookie-banner"]').should('be.visible');
    cy.get('[data-testid="accept-cookies"]').click();
    cy.get('[data-testid="cookie-banner"]').should('not.exist');
  });

  it('devrait fermer la bannière lors du clic sur Refuser', () => {
    cy.get('[data-testid="cookie-banner"]').should('be.visible');
    cy.get('[data-testid="reject-cookies"]').click();
    cy.get('[data-testid="cookie-banner"]').should('not.exist');
  });

  it('devrait ouvrir les paramètres lors du clic sur Personnaliser', () => {
    cy.get('[data-testid="cookie-banner"]').should('be.visible');
    cy.get('[data-testid="customize-cookies"]').click();
    cy.get('[data-testid="cookie-settings-dialog"]').should('be.visible');
  });

  it('devrait gérer correctement la sélection lors du rejet', () => {
    // Simuler une sélection de texte
    cy.get('body').type('{selectall}');
    
    // Vérifier que la sélection existe
    cy.window().then((win) => {
      const selection = win.getSelection();
      expect(selection?.rangeCount).to.be.greaterThan(0);
    });

    // Cliquer sur Refuser
    cy.get('[data-testid="reject-cookies"]').click();

    // Vérifier que la bannière est fermée
    cy.get('[data-testid="cookie-banner"]').should('not.exist');

    // Vérifier que la sélection a été nettoyée
    cy.window().then((win) => {
      const selection = win.getSelection();
      expect(selection?.rangeCount).to.equal(0);
    });
  });

  it('devrait gérer les extensions de traduction', () => {
    // Simuler la présence d'une extension de traduction
    cy.window().then((win) => {
      win.google = {
        translate: {
          TranslateService: {}
        }
      };
    });

    // Vérifier que l'avertissement est affiché dans la console
    cy.window().then((win) => {
      const consoleSpy = cy.spy(win.console, 'warn');
      cy.get('[data-testid="reject-cookies"]').click();
      expect(consoleSpy).to.be.calledWith('🚨 Conflit détecté avec une extension - Focus réinitialisé');
    });
  });

  it('devrait sauvegarder les préférences personnalisées', () => {
    // Ouvrir les paramètres
    cy.get('[data-testid="customize-cookies"]').click();
    
    // Désactiver les cookies analytiques
    cy.get('[data-testid="analytics-cookies"]').click();
    
    // Sauvegarder les préférences
    cy.get('[data-testid="save-preferences"]').click();
    
    // Vérifier que la bannière est fermée
    cy.get('[data-testid="cookie-banner"]').should('not.exist');
    
    // Vérifier que les préférences sont sauvegardées
    cy.getCookie('cookie-preferences').should('exist');
  });

  it('devrait gérer les erreurs de sélection', () => {
    // Simuler une erreur de sélection
    cy.window().then((win) => {
      const originalGetSelection = win.getSelection;
      win.getSelection = () => {
        throw new Error('Erreur de sélection simulée');
      };
    });

    // Cliquer sur Refuser
    cy.get('[data-testid="reject-cookies"]').click();

    // Vérifier que la bannière est quand même fermée
    cy.get('[data-testid="cookie-banner"]').should('not.exist');

    // Restaurer la fonction getSelection
    cy.window().then((win) => {
      win.getSelection = originalGetSelection;
    });
  });

  // Tests de charge et performance
  describe('Tests de charge', () => {
    it('devrait gérer les clics rapides répétés', () => {
      // Simuler 10 clics rapides sur le bouton Refuser
      for (let i = 0; i < 10; i++) {
        cy.get('[data-testid="reject-cookies"]').click();
      }

      // Vérifier que la bannière est fermée
      cy.get('[data-testid="cookie-banner"]').should('not.exist');

      // Vérifier qu'aucune erreur n'est apparue dans la console
      cy.window().then((win) => {
        const consoleErrors = win.console.error;
        expect(consoleErrors).to.not.be.called;
      });
    });

    it('devrait gérer la navigation rapide pendant l\'animation', () => {
      // Simuler une sélection de texte
      cy.get('body').type('{selectall}');

      // Cliquer sur Refuser et naviguer rapidement
      cy.get('[data-testid="reject-cookies"]').click();
      cy.visit('/about');
      cy.visit('/contact');
      cy.visit('/');

      // Vérifier que la bannière est fermée
      cy.get('[data-testid="cookie-banner"]').should('not.exist');

      // Vérifier qu'aucune erreur n'est apparue dans la console
      cy.window().then((win) => {
        const consoleErrors = win.console.error;
        expect(consoleErrors).to.not.be.called;
      });
    });

    it('devrait gérer les changements de focus rapides', () => {
      // Simuler des changements de focus rapides
      for (let i = 0; i < 5; i++) {
        cy.get('body').focus();
        cy.get('[data-testid="cookie-banner"]').focus();
        cy.get('[data-testid="reject-cookies"]').focus();
      }

      // Cliquer sur Refuser
      cy.get('[data-testid="reject-cookies"]').click();

      // Vérifier que la bannière est fermée
      cy.get('[data-testid="cookie-banner"]').should('not.exist');

      // Vérifier qu'aucune erreur n'est apparue dans la console
      cy.window().then((win) => {
        const consoleErrors = win.console.error;
        expect(consoleErrors).to.not.be.called;
      });
    });

    it('devrait gérer les sélections multiples', () => {
      // Simuler plusieurs sélections de texte
      for (let i = 0; i < 5; i++) {
        cy.get('body').type('{selectall}');
        cy.wait(50); // Petit délai entre les sélections
      }

      // Cliquer sur Refuser
      cy.get('[data-testid="reject-cookies"]').click();

      // Vérifier que la bannière est fermée
      cy.get('[data-testid="cookie-banner"]').should('not.exist');

      // Vérifier que la sélection a été nettoyée
      cy.window().then((win) => {
        const selection = win.getSelection();
        expect(selection?.rangeCount).to.equal(0);
      });
    });
  });
}); 