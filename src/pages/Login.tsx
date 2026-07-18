import { LogIn } from "lucide-react";

export default function Login() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-void">
      <LogIn className="h-12 w-12 text-purple-500" />
      <h1 className="text-2xl font-semibold text-txt-primary">Login</h1>
      <p className="text-txt-secondary">Coming Soon</p>
    </div>
  );
}
