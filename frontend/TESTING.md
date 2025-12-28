# Frontend Testing Strategy

## Overview

This project uses Jest and React Testing Library for unit and integration tests. End-to-end (E2E) tests can be added with Cypress or Playwright.

## Test Types

- **Unit tests:** Test individual components and utility functions.
- **Integration tests:** Test component interactions and API calls.
- **E2E tests:** Simulate user flows in the browser (optional).

## How to Run Tests

1. Install dependencies:
   ```bash
   npm install --save-dev jest @testing-library/react @testing-library/jest-dom
   ```
2. Run tests:
   ```bash
   npm test
   ```

## Folder Structure

- Place tests alongside components as `ComponentName.test.tsx` or in a `__tests__/` folder.

## Example Test

```tsx
import { render, screen } from "@testing-library/react";
import ExpenseForm from "../components/ExpenseForm";

test("renders expense form", () => {
  render(<ExpenseForm />);
  expect(screen.getByText(/add expense/i)).toBeInTheDocument();
});
```

## Coverage

- Aim for high coverage on critical UI and logic.
- Use `jest --coverage` to check coverage stats.

## Resources

- [Jest Docs](https://jestjs.io/docs/getting-started)
- [React Testing Library Docs](https://testing-library.com/docs/)
- [Cypress Docs](https://docs.cypress.io/)
