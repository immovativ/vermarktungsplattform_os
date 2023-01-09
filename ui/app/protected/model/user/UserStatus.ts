export enum UserStatus {
    INACTIVE = 'INACTIVE',
    ACTIVE = 'ACTIVE',
    LOCKED = 'LOCKED',
    DELEGATED = 'DELEGATED'
}

type UserStatusTranslation = {
  [E in UserStatus]: string
}

export const UserStatusTranslation: UserStatusTranslation = {
  INACTIVE: 'Inaktiv',
  ACTIVE: 'Aktiv',
  LOCKED: 'Gesperrt',
  DELEGATED: 'Durch Sachbearbeiter:in erfasst',
}
