import React from 'react'
import {render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import {LoginPage} from '@protected/pages/login/LoginPage'
import {BrowserRouter} from 'react-router-dom'
import {act} from 'react-dom/test-utils'
import {NoAuthQueryClient} from '@protected/components/NoAuthQueryClient';

describe('LoginPage', () => {
  test('should not allow an invalid email', async () => {
    const screen = render(
        <BrowserRouter>
          <NoAuthQueryClient>
            <LoginPage />
          </NoAuthQueryClient>
        </BrowserRouter>,
    )

    const user = userEvent.setup()

    await act(() => user.type(screen.getByLabelText(/E-Mail adresse/i), 'rofl'))
    expect(screen.getByLabelText(/E-Mail adresse/i)).toHaveValue('rofl')

    await act(() => user.type(screen.getByLabelText('Passwort'), 'rofl'))
    expect(screen.getByLabelText('Passwort')).toHaveValue('rofl')

    await act(() => user.click(screen.getByText('Einloggen')))

    expect(screen.baseElement)
        .toHaveTextContent('Bitte geben Sie eine valide E-Mail Adresse ein.')
  })
})
