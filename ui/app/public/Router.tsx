import React, {FunctionComponent} from 'react';
import { Route, Routes } from 'react-router-dom';
import { LazyComponentLoader as LCL } from '@common/component/LazyComponentLoader';

const LazyAuctionList = React.lazy(() => import('./pages/AuctionList'))
const LazyTextPage = React.lazy(() => import('./pages/TextPage'))
const LazyStartPage = React.lazy(() => import('./pages/StartPage'))
const LazyProcessPage = React.lazy(() => import('./pages/ProcessPage'))
const LazyConceptAssignmentDetail = React.lazy(() => import('./pages/ConceptAssignmentDetail'))

export const Router: FunctionComponent = () => {
  return (
    <Routes>
      <Route path='/' element={
        <LCL>
          <LazyStartPage title="Willkommen in Dietenbach" />
        </LCL>
      }/>
      <Route path='/ablauf-bewerbung' element={
        <LCL>
          <LazyProcessPage title="Ablauf der Bewerbung" />
        </LCL>
      }/>
      <Route path='/vergabe' element={
        <LCL>
          <LazyAuctionList />
        </LCL>
      }/>
      <Route path='/vergabe/:id' element={
        <LCL>
          <LazyConceptAssignmentDetail />
        </LCL>
      }/>
      <Route path='/impressum' element={
        <LCL>
          <LazyTextPage textName="imprint" title="Impressum" />
        </LCL>
      }/>
      <Route path='/datenschutz' element={
        <LCL>
          <LazyTextPage textName="privacyPolicy" title="Datenschutz" />
        </LCL>
      }/>
      <Route path='/baurecht' element={
        <LCL>
          <LazyTextPage textName="baurecht" title="Baurecht Beratungsangebot" />
        </LCL>
      }/>
    </Routes>
  )
}
