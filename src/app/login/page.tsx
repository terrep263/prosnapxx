import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
