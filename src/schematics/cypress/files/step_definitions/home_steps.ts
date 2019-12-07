// Assume that this 
const { Given, When, Then, And } = require('cypress-cucumber-preprocessor/steps');

Given('the user visit the main page', () => {
    cy.visit('http://localhost:4200/');
});

Then('page should have the right title', () => {
    cy.getPackageName()
      .then(packageName => 
        cy.title().should('contains', `${packageName.name}`)
      );
});
