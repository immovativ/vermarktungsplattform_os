import {UserRole} from './UserRole';

export interface UserCreationRequest {
  name: string
  email: string
  role: UserRole
  easyMode: boolean
}
