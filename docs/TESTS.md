# Guide des Tests - Canard Coworking Space

## Table des matières

1. [Introduction](#introduction)
2. [Types de tests](#types-de-tests)
3. [Tests unitaires](#tests-unitaires)
4. [Tests d'intégration](#tests-dintégration)
5. [Tests d'accessibilité](#tests-daccessibilité)
6. [Tests de performance](#tests-de-performance)
7. [Tests de sécurité](#tests-de-sécurité)
8. [Tests manuels](#tests-manuels)
9. [Intégration continue](#intégration-continue)
10. [Bonnes pratiques](#bonnes-pratiques)

## Introduction

Ce document décrit la stratégie de tests mise en place pour le projet Canard Coworking Space. Il détaille les différents types de tests, les outils utilisés, et les bonnes pratiques à suivre pour maintenir une qualité de code optimale.

Les tests sont une partie essentielle du processus de développement, permettant de garantir la fiabilité, la performance et la sécurité de l'application.

## Types de tests

Notre stratégie de tests comprend plusieurs niveaux :

- **Tests unitaires** : Vérifient le bon fonctionnement des composants individuels
- **Tests d'intégration** : Vérifient les interactions entre les différents composants
- **Tests d'accessibilité** : Assurent la conformité aux normes d'accessibilité
- **Tests de performance** : Évaluent les performances de l'application
- **Tests de sécurité** : Identifient les vulnérabilités potentielles
- **Tests manuels** : Complètent les tests automatisés pour les scénarios complexes

## Tests unitaires

### Outils

- **Jest** : Framework de test principal
- **React Testing Library** : Pour tester les composants React
- **MSW (Mock Service Worker)** : Pour simuler les appels API

### Structure des tests

Les tests unitaires sont organisés en suivant la structure du code source :

```
src/
  components/
    Button/
      Button.tsx
      Button.test.tsx
  hooks/
    useAuth.ts
    useAuth.test.ts
  utils/
    dateUtils.ts
    dateUtils.test.ts
```

### Exécution des tests

Pour exécuter les tests unitaires :

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests avec couverture
npm test -- --coverage

# Exécuter les tests en mode watch
npm test -- --watch

# Exécuter un fichier de test spécifique
npm test -- src/components/Button/Button.test.tsx
```

### Exemples de tests

#### Test d'un composant React

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

#### Test d'un hook personnalisé

```typescript
// useAuth.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('returns isAuthenticated=false initially', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('sets isAuthenticated=true after login', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

#### Test d'une fonction utilitaire

```typescript
// dateUtils.test.ts
import { formatDate, isDateInPast } from './dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2025-05-01T12:00:00Z');
      expect(formatDate(date)).toBe('01/05/2025');
    });
  });

  describe('isDateInPast', () => {
    it('returns true for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isDateInPast(pastDate)).toBe(true);
    });

    it('returns false for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isDateInPast(futureDate)).toBe(false);
    });
  });
});
```

## Tests d'intégration

### Outils

- **Cypress** : Pour les tests end-to-end
- **Supertest** : Pour tester les API

### Structure des tests

Les tests d'intégration sont organisés par fonctionnalité :

```
cypress/
  integration/
    auth/
      login.spec.ts
      register.spec.ts
    booking/
      create-booking.spec.ts
      cancel-booking.spec.ts
```

### Exécution des tests

Pour exécuter les tests d'intégration :

```bash
# Exécuter tous les tests Cypress en mode headless
npm run cypress:run

# Ouvrir l'interface Cypress
npm run cypress:open

# Exécuter les tests API
npm run test:api
```

### Exemples de tests

#### Test d'intégration avec Cypress

```typescript
// cypress/integration/auth/login.spec.ts
describe('Login', () => {
  beforeEach(() => {
    cy.visit('/auth/login');
  });

  it('should login successfully with valid credentials', () => {
    cy.get('[data-testid=email-input]').type('user@example.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=login-button]').click();
    
    // Vérifier la redirection vers le tableau de bord
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid=user-greeting]').should('contain', 'Bienvenue');
  });

  it('should show error with invalid credentials', () => {
    cy.get('[data-testid=email-input]').type('user@example.com');
    cy.get('[data-testid=password-input]').type('wrongpassword');
    cy.get('[data-testid=login-button]').click();
    
    cy.get('[data-testid=error-message]').should('be.visible');
    cy.url().should('include', '/auth/login');
  });
});
```

#### Test d'API avec Supertest

```typescript
// tests/api/bookings.test.ts
import request from 'supertest';
import { app } from '../../src/server';
import { createTestUser, createTestSpace } from '../helpers';

describe('Bookings API', () => {
  let authToken;
  let spaceId;

  beforeAll(async () => {
    // Créer un utilisateur de test et obtenir un token
    const user = await createTestUser();
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'password123' });
    
    authToken = loginResponse.body.token;
    
    // Créer un espace de test
    const space = await createTestSpace();
    spaceId = space.id;
  });

  it('should create a booking', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        spaceId,
        startTime: tomorrow.toISOString(),
        endTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString()
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.spaceId).toBe(spaceId);
  });
});
```

## Tests d'accessibilité

### Outils

- **axe-core** : Bibliothèque pour les tests d'accessibilité automatisés
- **jest-axe** : Intégration d'axe avec Jest
- **Cypress-axe** : Intégration d'axe avec Cypress

### Exécution des tests

```bash
# Exécuter les tests d'accessibilité
npm run test:a11y
```

### Exemples de tests

#### Test d'accessibilité avec jest-axe

```typescript
// Button.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from './Button';

expect.extend(toHaveNoViolations);

describe('Button accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have appropriate ARIA attributes when loading', async () => {
    const { container } = render(<Button isLoading>Loading</Button>);
    expect(container.querySelector('button')).toHaveAttribute('aria-busy', 'true');
  });
});
```

#### Test d'accessibilité avec Cypress-axe

```typescript
// cypress/integration/a11y/homepage.spec.ts
describe('Homepage Accessibility', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
  });

  it('should not have accessibility violations', () => {
    cy.checkA11y();
  });

  it('should not have accessibility violations when menu is open', () => {
    cy.get('[data-testid=menu-button]').click();
    cy.checkA11y();
  });
});
```

## Tests de performance

### Outils

- **Lighthouse** : Pour mesurer les performances web
- **WebPageTest** : Pour des tests de performance détaillés
- **React Profiler** : Pour analyser les performances des composants React

### Métriques surveillées

- **Largest Contentful Paint (LCP)** : < 2.5s
- **First Input Delay (FID)** : < 100ms
- **Cumulative Layout Shift (CLS)** : < 0.1
- **Time to Interactive (TTI)** : < 3.8s
- **Total Blocking Time (TBT)** : < 300ms

### Exécution des tests

```bash
# Exécuter Lighthouse en ligne de commande
npx lighthouse https://staging.canard-cowork.com --output=html --output-path=./lighthouse-report.html

# Exécuter les tests de performance personnalisés
npm run test:performance
```

## Tests de sécurité

### Outils

- **OWASP ZAP** : Pour les tests de sécurité automatisés
- **npm audit** : Pour vérifier les vulnérabilités des dépendances
- **ESLint avec règles de sécurité** : Pour détecter les problèmes de sécurité dans le code

### Exécution des tests

```bash
# Vérifier les vulnérabilités des dépendances
npm audit

# Exécuter les tests de sécurité
npm run test:security
```

### Exemple de configuration ESLint pour la sécurité

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'plugin:security/recommended',
    // autres extensions...
  ],
  plugins: [
    'security',
    // autres plugins...
  ],
  rules: {
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    // autres règles...
  }
};
```

## Tests manuels

Certains aspects de l'application nécessitent des tests manuels, notamment :

- **Tests d'utilisabilité** : Évaluer l'expérience utilisateur
- **Tests de compatibilité navigateur** : Vérifier le fonctionnement sur différents navigateurs
- **Tests de responsive design** : Vérifier l'affichage sur différents appareils

### Liste de contrôle pour les tests manuels

- [ ] Vérifier le processus de réservation complet
- [ ] Tester le processus de paiement
- [ ] Vérifier les e-mails de confirmation
- [ ] Tester l'interface d'administration
- [ ] Vérifier l'affichage sur mobile, tablette et desktop
- [ ] Tester sur Chrome, Firefox, Safari et Edge
- [ ] Vérifier l'accessibilité avec un lecteur d'écran

## Intégration continue

Les tests sont automatiquement exécutés dans notre pipeline CI/CD à chaque push et pull request.

### Configuration GitHub Actions

```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run linter
        run: npm run lint
      - name: Run tests
        run: npm test
      - name: Run accessibility tests
        run: npm run test:a11y
```

## Bonnes pratiques

### Pour les tests unitaires

1. **Isoler les tests** : Chaque test doit être indépendant des autres
2. **Tester les comportements, pas l'implémentation** : Concentrez-vous sur ce que le code fait, pas sur comment il le fait
3. **Utiliser des données de test réalistes** : Évitez les données trop simplistes
4. **Nommer les tests clairement** : Le nom du test doit décrire ce qui est testé
5. **Suivre le pattern AAA** : Arrange, Act, Assert

### Pour les tests d'intégration

1. **Tester les flux critiques** : Prioriser les parcours utilisateurs importants
2. **Utiliser des données de test isolées** : Éviter d'interférer avec d'autres tests
3. **Nettoyer après les tests** : Restaurer l'état initial après chaque test
4. **Minimiser les dépendances externes** : Utiliser des mocks quand c'est possible

### Pour les tests d'accessibilité

1. **Tester tôt et souvent** : Intégrer les tests d'accessibilité dès le début
2. **Compléter les tests automatisés par des tests manuels** : Certains problèmes ne peuvent être détectés que manuellement
3. **Tester avec des technologies d'assistance** : Utiliser des lecteurs d'écran pour vérifier l'expérience utilisateur

---

*Dernière mise à jour : 2 mai 2025*
