export enum UserRole {
  CONSULTING = 'CONSULTING',
  PROJECT_GROUP = 'PROJECT_GROUP',
  CANDIDATE = 'CANDIDATE',
}

type UserRoleTranslation = {
  [E in UserRole]: string
}

export const UserRoleTranslation: UserRoleTranslation = {
  [UserRole.CONSULTING]: 'Baurechtsamt',
  [UserRole.PROJECT_GROUP]: 'ALW + Projektgruppe Dietenbach',
  [UserRole.CANDIDATE]: 'Bewerber:in',
}
