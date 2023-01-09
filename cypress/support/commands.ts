// ***********************************************
// This example commands.js shows you how to
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

import '@testing-library/cypress/add-commands';
import {AxiosRequestConfig} from 'axios';

export function quoted_printable_decode(str: string): string {
  //       discuss at: http://phpjs.org/functions/quoted_printable_decode/
  //      original by: Ole Vrijenhoek
  //      bugfixed by: Brett Zamir (http://brett-zamir.me)
  //      bugfixed by: Theriault
  // reimplemented by: Theriault
  //      improved by: Brett Zamir (http://brett-zamir.me)
  //        example 1: quoted_printable_decode('a=3Db=3Dc');
  //        returns 1: 'a=b=c'
  //        example 2: quoted_printable_decode('abc  =20\r\n123  =20\r\n');
  //        returns 2: 'abc   \r\n123   \r\n'
  //        example 3: quoted_printable_decode('012345678901234567890123456789012345678901234567890123456789012345678901234=\r\n56789');
  //        returns 3: '01234567890123456789012345678901234567890123456789012345678901234567890123456789'
  //        example 4: quoted_printable_decode("Lorem ipsum dolor sit amet=23, consectetur adipisicing elit");
  //        returns 4: 'Lorem ipsum dolor sit amet#, consectetur adipisicing elit'

  const RFC2045Decode1 = /=\r\n/gm;
  // Decodes all equal signs followed by two hex digits
  const RFC2045Decode2IN = /=([0-9A-F]{2})/gim;
  // the RFC states against decoding lower case encodings, but following apparent PHP behavior
  // RFC2045Decode2IN = /=([0-9A-F]{2})/gm,
  const RFC2045Decode2OUT = function(sMatch: any, sHex: any) {
    return String.fromCharCode(parseInt(sHex, 16));
  };
  return str.replace(RFC2045Decode1, '')
      .replace(RFC2045Decode2IN, RFC2045Decode2OUT);
}

Cypress.Commands.add('logInAs', (email: string, password: string) => {
  cy.visit('/protected/login')
  cy.findByLabelText(/E-Mail adresse/i).type(email)
  cy.findByLabelText(/passwort/i).type(password)
  cy.findByText('Einloggen').click()
})

Cypress.Commands.add('navigate', (entry: string) => {
  cy.findAllByText(new RegExp(entry)).first().click() // menu is first in DOM
})

Cypress.Commands.add('logout', () => {
  cy.findByText('Abmelden').click()
})

Cypress.Commands.add('acceptResetAndSetPassword', (email, password) => {
  cy.request(`${Cypress.env('mailHogBaseUrl')}/api/v1/messages`).then((res) => {
    const body: string = quoted_printable_decode(res.body[0].Content.Body)
    const link = (body.match(new RegExp(`(${Cypress.config('baseUrl')}\/protected\/passwordReset\/[a-zA-Z0-9]+)`)) as RegExpMatchArray)[1]

    cy.visit(link)
    cy.document().contains('Neues Passwort setzen')
    cy.findAllByLabelText(/passwort/i).first().type(password)
    cy.findByLabelText(/bitte bestätigen sie ihr passwort/i).type(password)
    cy.findByText('Passwort setzen').click()
    cy.document().url().should('include', '/protected/login?after=pwreset')
  })
})

Cypress.Commands.add('acceptInviteAndSetPassword', (email, password) => {
  cy.request(`${Cypress.env('mailHogBaseUrl')}/api/v1/messages`).then((res) => {
    const body: string = quoted_printable_decode(res.body[0].Content.Body)
    const link = (body.match(new RegExp(`(${Cypress.config('baseUrl')}\/protected\/invitation\/[a-zA-Z0-9]+)`)) as RegExpMatchArray)[1]

    cy.visit(link)
    cy.document().url().should('contain', 'invitation')
    cy.findAllByLabelText(/passwort/i).first().type(password)
    cy.findByLabelText(/bitte bestätigen sie ihr passwort/i).type(password)
    cy.findByText('Passwort setzen').click()
    cy.document().url().should('include', '/protected/login?after=invitation')
  })
})

Cypress.Commands.add('clearMails', () => {
  cy.request('delete', `${Cypress.env('mailHogBaseUrl')}/api/v1/messages`)
})

Cypress.Commands.add('httpGet', <T = any, D = any>(url: string, config?: AxiosRequestConfig<D>) => {
  return cy.task<T>('httpGet', {url, config})
})

Cypress.Commands.add('httpDelete', <T = any, D = any>(url: string, config?: AxiosRequestConfig<D>) => {
  return cy.task<T>('httpDelete', {url, config})
})

Cypress.Commands.add('httpPost', <T = any, D = any>(url: string, data?: T, config?: AxiosRequestConfig<D>) => {
  return cy.task<T>('httpPost', {url, data, config})
})

Cypress.Commands.add('httpPut', <T = any, D = any>(url: string, data?: T, config?: AxiosRequestConfig<D>) => {
  return cy.task<T>('httpPut', {url, data, config})
})

Cypress.Commands.add('setSliderValue', { prevSubject: 'element' },
    (subject, value) => {
      const element = subject[0]

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
      )?.set

      nativeInputValueSetter?.call(element, value)
      element.dispatchEvent(new Event('change', { bubbles: true }))
    },
)
