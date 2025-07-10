📘 NimbusLance – Building a Fullstack Cloud-Ready Freelance SaaS Platform
───────────────────────────────

skeleton overview (skeleton.png)

Chapter 2 — Frontend Setup: Next.js + Tailwind + ShadCN

2.1 Initializing the Frontend App

We use Next.js 14 with the App Router and Tailwind CSS for speed and flexibility. ShadCN UI gives us beautiful, accessible components built on top of Radix UI.

In your terminal, from the root of the mono-repo:

npx create-next-app@latest apps/frontend

You’ll now have a clean Next.js 14 project inside apps/frontend.

2.2 Run the Frontend Locally

cd apps/frontend
npm run dev

Visit http://localhost:3000 to verify your app is up and running.

2.3 Add Tailwind and ShadCN UI

To install Tailwind:

npm install -D tailwindcss @tailwindcss/postcss postcss

Replace the content of postcss.config.mjs with:

export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

To install ShadCN UI and configure your UI component library:

npx shadcn@latest init

Add your first component:

npx shadcn@latest add button

Then test it in src/app/page.tsx:

import { Button } from "@/components/ui/button";

export default function Home() {
return (
<main className="flex min-h-screen items-center justify-center">
<Button className="text-lg">ShadCN Button</Button>
</main>
);
}

You now have a frontend that’s:

Tailwind-ready

Componentized

Modern and responsive

Ready to integrate with the backend

2.4 (Optional) Initialize Git

If not done yet, commit your progress:

cd ../..
git init
git add .
git commit -m "Initialize frontend with Next.js + Tailwind + ShadCN UI"

2.5 Screenshot for the eBook

Include a screenshot of your button displayed at http://localhost:3000 for visual verification.

🎓 What You Learned

Setting up a full-featured Next.js frontend in a mono-repo

How to scaffold and configure Tailwind + ShadCN UI

Local dev flow with npm run dev

A clean base to build modern UIs

Next: we move on to setting up the backend using NestJS, Docker, and PostgreSQL.