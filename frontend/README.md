# FinLens AI Frontend

This is the Next.js frontend for FinLens AI, a smart personal finance assistant.

## Features

- Dashboard for tracking expenses, budgets, and goals
- Intelligent expense categorization (AI + regex)
- Analytics and visualizations
- Alerts and notifications
- Responsive, modern UI (Tailwind CSS)

## Project Setup

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```
2. **Configure environment variables:**
   Create a `.env.local` file in this folder. Example:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
3. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

## Usage

- Add expenses, view analytics, set goals, and manage budgets from the dashboard.
- The app auto-updates as you edit files in `app/` and `components/`.
- API requests are sent to the backend specified in `NEXT_PUBLIC_API_URL`.

## Troubleshooting

- **API not reachable:** Ensure the backend is running and `NEXT_PUBLIC_API_URL` is set correctly.
- **Styling issues:** Run `npm run build` to rebuild Tailwind CSS.
- **Type errors:** Ensure you are using Node.js >= 18 and TypeScript >= 5.
- **Authentication issues:** Check browser console for error details.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Recharts Documentation](https://recharts.org/en-US/)

## Deployment

- Deploy easily on [Vercel](https://vercel.com/) or any platform supporting Next.js.
- Set production environment variables in your hosting dashboard.

## Linting

Run this command to check code style:

```bash
npm run lint
```

You can also set up a pre-commit hook with Husky for automatic linting. See [Husky Documentation](https://typicode.github.io/husky/#/) for setup instructions.

## Code Style and Comments

- Use descriptive variable and function names.
- Add comments for complex logic or important decisions.
- Keep functions small and focused.
- Use ESLint/Prettier for JavaScript/TypeScript.

---
