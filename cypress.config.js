module.exports = {
  e2e: {
    baseUrl: 'http://127.0.0.1:5500',
    apiUrl: 'http://127.0.0.1:8001',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js'
  }
}
