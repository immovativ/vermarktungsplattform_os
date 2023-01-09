import {UserRole} from '@protected/model/user/UserRole'
import {getSession} from '@common/navigation/session/Session'
import React, {FunctionComponent, useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import {ProjectGroupBasePage} from './projectgroup/ProjectGroupBasePage'
import {ConsultingBasePage} from '@protected/pages/consulting/ConsultingBasePage';
import { CandidateBasePage } from './candidate/CandidateBasePage'

export const BasePage: FunctionComponent = () => {
  const navigate = useNavigate()
  const session = getSession()

  useEffect(() => {
    if (session == null) {
      navigate('/protected/login')
    }
  }, [navigate])


  if (session?.role === UserRole.PROJECT_GROUP) {
    return <ProjectGroupBasePage />
  } else if (session?.role === UserRole.CONSULTING) {
    return <ConsultingBasePage />
  } else if (session?.role === UserRole.CANDIDATE) {
    return <CandidateBasePage />
  } else {
    return null
  }
}
