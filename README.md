# README.md
# Commerce OS

A production-ready e-commerce platform built with a monorepo architecture.

## Stack

- Backend: Node.js + TypeScript + Express + Prisma + PostgreSQL
- Frontend: Next.js + TypeScript + App Router
- Auth: JWT access/refresh tokens + bcrypt
- Payments: Stripe checkout and verification
- Delivery: Docker Compose for local stack
- Admin: Dashboard and product/order management

## Quick start

1. Install dependencies:
   npm install

2. Start infrastructure:
   docker compose up -d db redis mailhog

3. Copy env files:
   cp .env.example .env
   cp apps/backend/.env.example apps/backend/.env
   cp apps/frontend/.env.example apps/frontend/.env

4. Generate Prisma client and push schema:
   npm run db:generate
   npm run db:push

5. Run app:
   npm run dev

## Default URLs

- Storefront: http://localhost:3000
- API: http://localhost:4000
- Admin: http://localhost:3000/admin
- MailHog UI: http://localhost:8025

## Notes

This repository includes a full stack e-commerce product set with authentication, product catalog, cart, checkout, payments, admin dashboard, and documentation.
