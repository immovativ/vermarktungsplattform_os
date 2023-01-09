import {AssignmentInd, MapsHomeWork, Message} from '@mui/icons-material';
import {MainMenu, MenuEntry} from '@common/navigation/MainMenu';
import React, {FC, FunctionComponent} from 'react';
import {QueryClient, QueryClientProvider} from 'react-query';
import {Route, Routes} from 'react-router-dom';
import {CandidatureListPage} from '@protected/pages/candidate/CandidatureListPage';
import {Box} from '@mui/system';
import { Breadcrumbs, Stack} from '@mui/material';
import { ProvidedBreadcrumbWrapper, BreadcrumbContext, useBreadcrumb } from '@common/navigation/breadcrumb/useBreadcrumb';
import {CandidatureDetailsPage} from '@protected/pages/candidate/CandidatureDetailsPage';
import {ProfilePage} from '@protected/pages/common/profile/ProfilePage';
import { MenuMessageText } from '@common/component/chat/MenuMessageText';
import { UnreadPage } from '@common/component/chat/UnreadPage';


const queryClient = new QueryClient()

const menu: MenuEntry[] = [
  {
    path: '/protected/candidate/candidatures',
    icon: <AssignmentInd fontSize="small" sx={{mr: 1}}/>,
    text: 'Meine Bewerbungen',
    fuzzyMatch: true,
    children: [
      {
        path: ':id',
        text: 'assignment-detail',
        breadcrumbKey: 'assignment-name',
      },
    ],
  },
  {
    path: '/protected/candidate/messages',
    icon: <Message fontSize="small" sx={{mr: 1}}/>,
    text: <MenuMessageText for="candidate"/>,
    breadcrumbKey: 'messaging',
  },
  {
    path: '/vergabe',
    icon: <MapsHomeWork fontSize="small" sx={{mr: 1}}/>,
    text: 'Grundstücksvergaben',
    breadcrumbKey: '',
    external: true,
  },
]

export const BetterBreadcrumbs: FC = () => {
  const breadcrumbs = useBreadcrumb()
  return (
    <Breadcrumbs sx={{my: 1}}>
      {breadcrumbs}
    </Breadcrumbs>
  )
}

export const CandidateBasePage: FunctionComponent = () => {
  return (
    <ProvidedBreadcrumbWrapper>
      <BreadcrumbContext.Provider value={menu}>
        <QueryClientProvider client={queryClient}>
          <Stack direction="row" spacing={2}>
            <MainMenu
              entries={menu}
            />
            <Box flex="max-content">
              <BetterBreadcrumbs />
              <Routes>
                <Route path="profile" element={<ProfilePage/>}/>
                <Route
                  path="candidate/candidatures"
                  element={
                    <CandidatureListPage/>
                  }
                />
                <Route
                  path="candidate/candidatures/:candidatureId"
                  element={
                    <CandidatureDetailsPage/>
                  }
                />
                <Route path="candidate/messages" element={<UnreadPage for='candidate' />}/>
              </Routes>
            </Box>
          </Stack>
        </QueryClientProvider>
      </BreadcrumbContext.Provider>
    </ProvidedBreadcrumbWrapper>
  )
}
