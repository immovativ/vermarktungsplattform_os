import {UserRole} from './UserRole';
import {UserStatus} from './UserStatus';

export interface User {
  id: string
  name: string,
  email: string,
  role: UserRole,
  status: UserStatus,
  createdAt: string,
  updatedAt: string,
  lastLogin: string | undefined,
  easyMode: boolean
}
