import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to NimbusLance
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Your modern freelance SaaS platform built with Next.js, Tailwind CSS, and ShadCN UI.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg">
            Get Started
          </Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>
      </div>
    </main>
  );
}