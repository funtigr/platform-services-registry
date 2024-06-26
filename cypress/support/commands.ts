/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
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
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

declare global {
  module Cypress {
    interface Chainable<Subject = any> {
      loginToRegistry(user: string, pass: string): void;
      loginToRegistryThroughApi(user: string, pass: string): void;
      logoutFromRegistry(): void;
    }
  }
}

export function loginToRegistry(username: string, password: string): void {
  cy.visit('/login', { failOnStatusCode: false });
  cy.contains('button', 'LOGIN').click();
  cy.wait(2000); // wait until the page loads, otherwise no chances to find clause below
  cy.url().then((val) => {
    if (val.includes('/api/auth/signin?csrf=true')) {
      cy.contains('span', 'Sign in with Keycloak').click();
    }
  });
  cy.origin(
    Cypress.env('keycloak_url'),
    { args: { usernameOrig: username, passwordOrig: password } },
    ({ usernameOrig, passwordOrig }) => {
      cy.get('input[id="username"]').type(usernameOrig);
      cy.get('input[id="password"]').type(passwordOrig);
      cy.get('input[type="submit"]').click();
    },
  );

  cy.contains('a', 'REQUEST A NEW PRODUCT');
}

export function loginToRegistryThroughApi(username: string, password: string): void {
  cy.login({
    root: Cypress.env('keycloak_url'),
    realm: 'platform-services',
    username: username,
    password: password,
    client_id: 'dummy',
    redirect_uri: '/',
  });
  cy.contains('a', 'REQUEST A NEW PRODUCT');
}

export function logoutFromRegistry(): void {
  cy.get('button[aria-haspopup="menu"]').click();
  cy.contains('a', 'Sign out');
  cy.contains('button', 'LOGIN');
}

Cypress.Commands.add('loginToRegistry', (username: string, password: string) => {
  const log = Cypress.log({
    displayName: 'Login to Registry',
    message: [`🔐 Authenticating | ${username}`],
    autoEnd: false,
  });
  log.snapshot('before');

  loginToRegistry(username, password);

  log.snapshot('after');
  log.end();
});

Cypress.Commands.add('loginToRegistryThroughApi', (username: string, password: string) => {
  const log = Cypress.log({
    displayName: 'Login to Registry through API',
    message: [`🔐 Authenticating | ${username}`],
    autoEnd: false,
  });
  log.snapshot('before');

  loginToRegistryThroughApi(username, password);

  log.snapshot('after');
  log.end();
});

Cypress.Commands.add('logoutFromRegistry', () => {});
