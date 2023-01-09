
import { quoted_printable_decode } from './commands';

export function logInAs(email: string, password: string) {
  cy.httpPost(`${Cypress.config('baseUrl')}/api/login`, {email, password})
}

export function clearMails() {
  cy.httpDelete(`${Cypress.env('mailHogBaseUrl')}/api/v1/messages`)
}

export function acceptInviteAndSetPassword(email: string, password: string) {
  cy.httpGet<any[]>(`${Cypress.env('mailHogBaseUrl')}/api/v1/messages`, {jar: undefined}).then((res) => {
    const body = quoted_printable_decode((res[0] as any)['Content']['Body'])
    const link = (body.match(new RegExp(`(${Cypress.config('baseUrl')}\/protected\/invitation\/[a-zA-Z0-9]+)`)) as RegExpMatchArray)[1]
    const token = link.split('/').reverse()[0]
    cy.httpPost(`${Cypress.config('baseUrl')}/api/user/activate`, {password, token}, {jar: undefined})
  })
}
