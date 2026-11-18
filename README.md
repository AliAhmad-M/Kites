# Kites

A blogging website where people can write posts on a range of topics and find others with similar interests.

Live site: https://kites-forums.vercel.app/

## Stack

- SvelteKit 2 and Svelte 5, built with Vite
- TypeScript
- Prisma with MongoDB for the database
- `bcryptjs` for password hashing
- `marked` to render post markdown, with `sanitize-html` and `xss` to clean user content
- `nodemailer` for email
- Prettier and ESLint for formatting and linting

## Deployment

The site is deployed on Vercel using `@sveltejs/adapter-vercel`.
