import axios, { AxiosResponse } from 'axios';
import {UserData} from '@protected/pages/projectgroup/queries/candidature';

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export async function changePassword(payload: ChangePasswordRequest): Promise<any> {
  const response = await axios
      .post('/api/self/updatePassword', payload)

  return response.data
}


export interface ProfileInfo {
  id: string
  email: string
  name: string
  lastLogin: string | undefined
  lastModified: string
}

export async function getProfile(): Promise<ProfileInfo> {
  const response = await axios
      .get('/api/self')

  return response.data
}

export async function changePersonalData(payload: { name: string }): Promise<any> {
  const response = await axios
      .post('/api/self/updatePersonalData', payload)

  return response.data
}

export async function getUserData(): Promise<UserData> {
  return axios.get('/api/self/userData').then((response) => response.data);
}

export async function updateUserData(payload: UserDataUpdateRequest): Promise<any> {
  return axios.put('/api/self/userData', payload)
}

export interface LoginRequest {
  email: string
  password: string
}


export async function login(payload: LoginRequest): Promise<any> {
  const response = await axios
      .post('/api/login', payload)

  return response.data
}

export interface PasswordForgottenRequest {
  email: string
}

export async function passwordForgotten(payload: PasswordForgottenRequest): Promise<any> {
  const response = await axios
      .post('/api/password-forgotten', payload)

  return response.data
}


export async function resetPassword(payload: { password: string, token: string }): Promise<any> {
  const response = await axios
      .post('/api/user/activate', payload)

  return response.data
}

export async function createUserAccount(payload: UserCreationRequest, conceptAssignmentId: string | null): Promise<any> {
  return axios.post('/api/user', payload, {params: {conceptAssignmentId}})
}

export async function createDelegateAccount(payload: DelegateCreationRequest): Promise<AxiosResponse<UserData>> {
  const response = await axios.post<UserData>('/api/admin/candidate/delegate', payload)
  return response
}

export const UserAccountTypes = ['COMPANY', 'PERSONAL'] as const;
export type UserAccountType = typeof UserAccountTypes[number];
export const UserAccountTypeTranslations: Record<UserAccountType, string> = {
  COMPANY: 'Unternehmenskonto',
  PERSONAL: 'Privatkonto',
}

export const Salutation = ['HERR', 'FRAU', 'DIVERS'] as const;
export type Salutation = typeof Salutation[number];
export const SalutationTranslations: Record<Salutation, string> = {
  HERR: 'Herr',
  FRAU: 'Frau',
  DIVERS: 'Divers',
}

export interface DelegateCreationRequest {
  accountType: UserAccountType
  company: string | null
  salutation: Salutation
  street: string
  houseNumber: string
  zipCode: string
  city: string
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
}

export interface UserCreationRequest {
  accountType: UserAccountType
  company: string | null
  salutation: Salutation
  street: string
  houseNumber: string
  zipCode: string
  city: string
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  tosAndPrivacyPolicyConsent: boolean
}

export interface UserDataUpdateRequest {
  accountType: UserAccountType
  company: string | null
  salutation: Salutation
  street: string
  houseNumber: string
  zipCode: string
  city: string
  firstName: string
  lastName: string
  phoneNumber: string
}
