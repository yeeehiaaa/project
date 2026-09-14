import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 px-6 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <LoginForm />
      </div>
    </main>
  );
}