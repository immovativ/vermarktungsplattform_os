import {MainMenu, MenuEntry} from '@common/navigation/MainMenu';
import React, { FC, FunctionComponent} from 'react';
import {QueryClient, QueryClientProvider} from 'react-query';
import {Route, Routes} from 'react-router-dom';

import {Dashboard, Map, Email, AssignmentInd, AddBusiness, TextSnippet, ModeEdit, TravelExplore, Done, Person, Foundation} from '@mui/icons-material';

import {ProfilePage} from '@protected/pages/common/profile/ProfilePage';
import { Breadcrumbs, Stack} from '@mui/material';
import {Box} from '@mui/system';
import { ConceptAssignmentsDetailPage } from './ConceptAssignmentDetailPage';
import { AdminDashboardPage } from './AdminDashboardPage';
import { ReviewPage } from './review/ReviewPage';
import {TextsPage} from '@protected/pages/projectgroup/texts/TextsPage';
import { BreadcrumbContext, ProvidedBreadcrumbWrapper, useBreadcrumb } from '@common/navigation/breadcrumb/useBreadcrumb';
import { ConceptAssignmentsActivePage } from './ConceptAssignmentsActivePage';
import { ConceptAssignmentsDraftsPage } from './ConceptAssignmentsDraftsPage';
import { Forwarder } from '../common/Forwarder';
import { ConceptAssignmentsDonePage } from './ConceptAssignmentsDonePage';
import { CandidateProfile } from './candidature/CandidateProfile';
import { CandidatureDetailLoader } from './candidature/CandidatureDetailLoader';
import { OverviewMapPage } from './overview-map/OverviewMapPage';
import { CandidatesPage } from './candidature/CandidatesPage';
import { StandaloneProfilePage } from './candidature/StandaloneProfilePage';
import { MenuMessageText } from '@common/component/chat/MenuMessageText';
import { UnreadPage } from '@common/component/chat/UnreadPage';
import { DelegateEdit } from './candidature/DelegateEdit';
import { ConstructionBasePage } from './construction-sites/ConstructionBasePage';
import { ConstructionDetailPage } from './construction-sites/ConstructionDetailPage';

const queryClient = new QueryClient()

const menu: MenuEntry[] = [
  {
    path: '/protected/admin/dashboard',
    icon: <Dashboard fontSize="small" sx={{mr: 1}}/>,
    text: 'Dashboard',
  },
  {
    path: '/protected/admin/construction-sites',
    icon: <Foundation fontSize="small" sx={{mr: 1}}/>,
    text: 'Baufeld-Manager',
    fuzzyMatch: true,
    children: [
      {
        path: ':cAreaId/:cSiteId',
        text: 'Detailseite',
        breadcrumbKey: 'construction-name',
      },
    ],
  },
  {
    path: '/protected/admin/plans',
    icon: <Map fontSize="small" sx={{mr: 1}}/>,
    text: 'Pläne und Vermarktungsstand',
  },
  {
    path: '/protected/admin/conceptAssignments',
    fuzzyMatch: true,
    icon: <AddBusiness fontSize="small" sx={{mr: 1}}/>,
    text: 'Vergabeverfahren',
    children: [
      {
        index: true,
        text: 'index',
      },
      {
        path: 'active',
        text: 'Aktiv/Geplant',
      },
      {
        path: 'done',
        text: 'Abgeschlossen',
      },
      {
        path: 'drafts',
        text: 'Entwürfe',
      },
      {
        path: ':id',
        text: 'vergabe seite',
        breadcrumbKey: 'assignment-name',
        children: [
          {
            path: 'candidature/:cid',
            text: 'kandidaten seite',
            breadcrumbKey: 'candidature-name',
            children: [
              {
                path: 'edit',
                text: 'Bearbeiten',
              },
              {
                path: 'profile/:pid',
                text: 'profil seite',
                breadcrumbKey: 'profile-name',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/protected/admin/conceptAssignments/active',
    icon: <TravelExplore fontSize="small" sx={{mr: 1, ml: 3}}/>,
    text: 'Aktiv/Geplant',
  },
  {
    path: '/protected/admin/conceptAssignments/drafts',
    icon: <ModeEdit fontSize="small" sx={{mr: 1, ml: 3}}/>,
    text: 'Entwürfe',
  },
  {
    path: '/protected/admin/conceptAssignments/done',
    icon: <Done fontSize="small" sx={{mr: 1, ml: 3}}/>,
    text: 'Abgeschlossen',
  },
  {
    path: '/protected/admin/review',
    icon: <AssignmentInd fontSize="small" sx={{mr: 1}}/>,
    text: 'Zu prüfende Bewerbungen',
  },
  {
    path: '/protected/admin/candidates',
    fuzzyMatch: true,
    icon: <Person fontSize="small" sx={{mr: 1}}/>,
    text: 'Bewerber:innen',
    children: [
      {
        index: true,
        text: 'index',
      },
      {
        path: ':id',
        text: 'profil seite',
        breadcrumbKey: 'profile-name',
      },
    ],
  },
  {
    path: '/protected/admin/messages',
    icon: <Email fontSize="small" sx={{mr: 1}}/>,
    text: <MenuMessageText for="admin"/>,
    breadcrumbKey: 'messaging',
  },
  {
    path: '/protected/admin/texts',
    icon: <TextSnippet fontSize="small" sx={{mr: 1}}/>,
    text: 'Impressum & Datenschutz',
  },
]

export const BetterBreadcrumbs: FC = () => {
  const breadcrumbs = useBreadcrumb()
  return (
    <Breadcrumbs sx={{'marginBottom': '25px'}}>
      {breadcrumbs}
    </Breadcrumbs>
  )
}

export const ProjectGroupBasePage: FunctionComponent = () => {
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
                <Route path="admin/dashboard" element={<AdminDashboardPage />}/>
                <Route path="profile" element={<ProfilePage/>}/>

                <Route path="admin/construction-sites">
                  <Route index element={<ConstructionBasePage />} />
                  <Route path=":cAreaId/:cSiteId" element={<ConstructionDetailPage />} />
                </Route>

                <Route path="admin/conceptAssignments/active" element={<ConceptAssignmentsActivePage />} />
                <Route path="admin/conceptAssignments/drafts" element={<ConceptAssignmentsDraftsPage />} />
                <Route path="admin/conceptAssignments/done" element={<ConceptAssignmentsDonePage />} />
                <Route path="admin/conceptAssignments">
                  <Route index element={<Forwarder to='active' />} />
                  <Route path=":id">
                    <Route index element={<ConceptAssignmentsDetailPage />} />
                    <Route path="candidature/:cid">
                      <Route index element={<CandidatureDetailLoader />} />
                      <Route path="edit" element={<DelegateEdit />} />
                      <Route path="profile/:uid" element={<CandidateProfile />} />
                    </Route>
                  </Route>
                </Route>
                <Route path="admin/review" element={<ReviewPage />}/>
                <Route path="admin/messages" element={<UnreadPage for='admin' />}/>
                <Route path="admin/plans" element={<OverviewMapPage />}/>
                <Route path="admin/texts" element={<TextsPage />}/>
                <Route path="admin/candidates" >
                  <Route index element={<CandidatesPage />} />
                  <Route path=":uid" element={<StandaloneProfilePage />} />
                </Route>
              </Routes>
            </Box>
          </Stack>
        </QueryClientProvider>
      </BreadcrumbContext.Provider>
    </ProvidedBreadcrumbWrapper>
  )
}
