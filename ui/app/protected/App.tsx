import { Container,
  CssBaseline, Stack,
} from '@mui/material';
import {ThemeProvider} from '@mui/material/styles';
import React, {FunctionComponent} from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {ResetPasswordPage} from './pages/ResetPasswordPage';
import {BasePage} from './pages/BasePage';
import {NoAuthQueryClient} from './components/NoAuthQueryClient';
import {AppHeader} from '@common/component/AppHeader';
import {theme} from '@common/theme';
import {LoginPage} from '@protected/pages/login/LoginPage';
import {AccountCreationPage} from '@protected/pages/login/AccountCreationPage';

export const App: FunctionComponent = () => {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <CssBaseline/>
        <Routes>
          <Route path="/protected/invitation/:token" element={
            <NoAuthQueryClient>
              <Container maxWidth={false} sx={{maxWidth: '1920px'}}>
                <Stack direction="column" rowGap={6}>
                  <AppHeader/>
                  <ResetPasswordPage mode="invitation"/>
                </Stack>
              </Container>
            </NoAuthQueryClient>
          }/>
          <Route path="/protected/passwordReset/:token" element={
            <NoAuthQueryClient>
              <Container maxWidth={false} sx={{maxWidth: '1920px'}}>
                <Stack direction="column" rowGap={6}>
                  <AppHeader/>
                  <ResetPasswordPage mode="resetPassword"/>
                </Stack>
              </Container>
            </NoAuthQueryClient>
          }/>
          <Route path="/protected/login" element={
            <NoAuthQueryClient>
              <Container maxWidth={false} sx={{maxWidth: '1920px'}}>
                <Stack direction="column" rowGap={6}>
                  <AppHeader/>
                  <LoginPage/>
                </Stack>
              </Container>
            </NoAuthQueryClient>
          }/>
          <Route path="/protected/createAccount" element={
            <NoAuthQueryClient>
              <Container maxWidth={false} sx={{maxWidth: '1920px'}}>
                <Stack direction="column" rowGap={6}>
                  <AppHeader/>
                  <AccountCreationPage />
                </Stack>
              </Container>
            </NoAuthQueryClient>
          }/>
          <Route path="/protected/*" element={
            <Container maxWidth={false} sx={{pl: 2, pr: 2, maxWidth: '1920px'}}>
              <Stack direction="column" rowGap={2}>
                <AppHeader/>
                <BasePage />
              </Stack>
            </Container>
          }/>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
