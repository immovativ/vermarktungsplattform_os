import {MainMenu, MenuEntry} from '@common/navigation/MainMenu';
import React, {FunctionComponent} from 'react';
import {QueryClient, QueryClientProvider} from 'react-query';
import {Route, Routes} from 'react-router-dom';


import {ProfilePage} from '@protected/pages/common/profile/ProfilePage';
import {TextSnippet} from '@mui/icons-material';
import {BaurechtTextsPage} from '@protected/pages/consulting/BaurechtTextsPage';
import {Stack} from '@mui/material';
import {Box} from '@mui/system';

const queryClient = new QueryClient()

const menu: MenuEntry[] = [
  {
    path: '/protected/consulting/texts',
    text: <>
      <TextSnippet fontSize="small" sx={{mr: 1}}/>
      Beratungstexte
    </>,
  },
]

export const ConsultingBasePage: FunctionComponent = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack direction="row" spacing={2}>
        <MainMenu
          entries={menu}
        />
        <Box flex="max-content">
          <Routes>
            <Route path="profile" element={<ProfilePage/>}/>
            <Route path="consulting/texts" element={<BaurechtTextsPage/>}/>
          </Routes>
        </Box>
      </Stack>
    </QueryClientProvider>
  )
}
