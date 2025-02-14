## Playwright Accessibility Test AI

This project performs accessibility testing using Playwright and generative AI to provide insights and improvements for web application accessibility.

## 📌 Installation

To install the project dependencies, run:

npm install

## ⚙️ .env_example file

In this file, insert your tokens and rename the file to .env ( remove the “_example” ) and keep this file in the root of the project.

## 🚀 Running Tests

To execute the accessibility tests, use the command:

npx playwright test

## 📁 Project Structure

├── .env                 # Environment variables configuration

├── .env_example         # Example environment configuration file

├── .gitignore           # File to ignore unnecessary files in Git

├── package.json         # Project metadata and dependencies

├── playwright-report/   # Directory containing test reports

│   ├── index.html       # Main page of the test report
├── playwright.config.ts # Playwright configuration

├── README.md            # Project documentation

├── src/                 # Project source code
│   ├── accessibility.ts # Code related to accessibility

├── test-results/        # Directory containing test results
│   ├── .last-run.json   # JSON with the last execution results

├── tests/               # Directory containing accessibility tests
│   ├── accessibilityTest.spec.ts # Accessibility test specification

├── tests-examples/      # Test examples
│   ├── demo-todo-app.spec.ts # Example test for a to-do list application

## 📝 File Descriptions

**.env**: Environment variables configuration.

**.env_example**: Example environment configuration file.

**.gitignore**: Defines files and directories to be ignored by Git.

**package.json**: Project metadata and dependencies.

**playwright-report/**: Directory storing test reports.

**playwright.config.ts**: Playwright configuration.

**README.md**: Project documentation.

**src/**: Directory containing accessibility-related code.

**accessibility.ts**: Code for accessibility analysis.

**test-results/**: Directory containing test results.

**.last-run.json**: Last execution results.

**tests/**: Directory containing accessibility tests.

**accessibilityTest.spec.ts**: File with test specifications.

**tests-examples/**: Directory containing test examples.

**demo-todo-app.spec.ts**: Example test for a to-do list application.
