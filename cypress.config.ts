import { defineConfig } from 'cypress'

export default defineConfig({
  env: {
    FAIL_FAST_ENABLED: true,
    mailHogBaseUrl: 'http://localhost:8025',
    databaseHost: 'localhost',
    databasePort: '5432',
  },
  e2e: {
    setupNodeEvents(on, config) {
      // import "old" plugins
      return require('./cypress/plugins/index.ts')(on, config)
    },
    baseUrl: 'http://localhost:8000',
  },
})
