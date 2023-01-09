module.exports = {
  roots: [
    '..',
  ],
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '.coverage/jest',
    }],
  ],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@protected/(.*)$': '<rootDir>/../../app/protected/$1',
    '^@survey/(.*)$': '<rootDir>/../../app/survey/$1',
    '^@common/(.*)$': '<rootDir>/../../app/common/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  setupFilesAfterEnv: ['./jest-setup.ts'],
}
