import cookie from 'cookie';

import {UserRole} from '@protected/model/user/UserRole';

export interface Session {
  email: string
  role: UserRole
  easyMode: string
}

export function getSession(): Session | null {
  const cookies = cookie.parse(document.cookie)

  if (cookies['vmp_ui'] == undefined) {
    return null
  }

  let session: any
  try {
    session = JSON.parse(cookies['vmp_ui'])
  } catch (e) {
    console.error(`Failed parsing session cookie: `, e)
    return null
  }
  if (typeof session.email == 'string' && typeof UserRole[session.role as UserRole] == 'string') {
    return session
  } else {
    return null
  }
}
