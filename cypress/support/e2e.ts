// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// load type definitions that come with Cypress module
// / <reference types="cypress" />
// Import commands.js using ES2015 syntax:
import 'cypress-fail-fast';
import './commands'
import failOnConsoleError from 'cypress-fail-on-console-error';


import { AxiosRequestConfig } from 'axios'

declare global {
    namespace Cypress {
      interface Chainable {
        /**
         * Custom command to select DOM element by data-cy attribute.
         * @example cy.dataCy('greeting')
         */
        logInAs(email: string, password: string): Chainable<Element>
        navigate(entry: string): Chainable<Element>
        acceptInviteAndSetPassword(email: string, password: string): Chainable<Element>
        acceptResetAndSetPassword(email: string, password: string): Chainable<Element>

        clearMails(): Chainable<Element>
        logout(): Chainable<Element>
        httpGet<T = any, D = any>(url: string, config?: AxiosRequestConfig<D>): Chainable<T>
        httpDelete<T = any, D = any>(url: string, config?: AxiosRequestConfig<D>): Chainable<T>
        httpPost<R = any, T = any, D = any>(url: string, data?: T, config?: AxiosRequestConfig<D>): Chainable<R>
        httpPut<R = any, T = any, D = any>(url: string, data?: T, config?: AxiosRequestConfig<D>): Chainable<R>

        setSliderValue(value: number): Chainable<Element>
      }
    }
  }
failOnConsoleError({
  excludeMessages: [
    // LoginLogoutSpec tests failed login, and something somehow logs the error object to the console....
    '.*403.*',
  ],
})
beforeEach(() => {
  cy.exec(`bash data_reset.sh "${Cypress.env('databaseHost')}" "${Cypress.env('databasePort')}"`)
  cy.clearCookies()
})
