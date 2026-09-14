"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  Mail,
  Lock,
  LogIn,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      // ==========================================
      // 1. VALIDATION
      // ==========================================

      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail) {
        setError("Please enter your email.");
        setLoading(false);
        return;
      }

      if (!password) {
        setError("Please enter your password.");
        setLoading(false);
        return;
      }

      // ==========================================
      // 2. SUPABASE LOGIN
      // ==========================================

      const {
        data: loginData,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (loginError) {
        console.error("SUPABASE LOGIN ERROR:", loginError);

        const message = loginError.message.toLowerCase();

        if (message.includes("email not confirmed")) {
          setError(
            "Please confirm your email before logging in."
          );
        } else if (
          message.includes("invalid login credentials")
        ) {
          setError("Invalid email or password.");
        } else {
          setError(loginError.message);
        }

        setLoading(false);
        return;
      }

      // ==========================================
      // 3. VERIFY USER
      // ==========================================

      if (!loginData.user) {
        setError("Unable to retrieve your account.");
        setLoading(false);
        return;
      }

      console.log(
        "LOGIN USER:",
        loginData.user.id
      );

      // ==========================================
      // 4. GET SESSION
      // ==========================================

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error(
          "SESSION ERROR:",
          sessionError
        );

        setError(
          "Unable to retrieve your authentication session."
        );

        setLoading(false);
        return;
      }

      const session = sessionData.session;

      // IMPORTANT:
      // Session can be null, so we verify it
      // before using access_token.

      if (!session) {
        setError(
          "Authentication session is invalid."
        );

        setLoading(false);
        return;
      }

      console.log(
        "SESSION FOUND:",
        !!session
      );

      console.log(
        "ACCESS TOKEN EXISTS:",
        !!session.access_token
      );

      // ==========================================
      // 5. CALL PROFILE API
      // ==========================================

      const response = await fetch(
        "/api/auth/profile",
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },

          cache: "no-store",
        }
      );

      // ==========================================
      // 6. READ RESPONSE SAFELY
      // ==========================================

      const responseText = await response.text();

      let result: any = {};

      try {
        result = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        console.error(
          "PROFILE API RETURNED NON-JSON:",
          responseText
        );

        setError(
          "The server returned an invalid response."
        );

        setLoading(false);
        return;
      }

      console.log(
        "PROFILE API RESPONSE:",
        result
      );

      // ==========================================
      // 7. PROFILE API ERROR
      // ==========================================

      if (!response.ok) {
        console.error(
          "PROFILE API ERROR:",
          result
        );

        setError(
          result?.error ||
            "Unable to retrieve your profile."
        );

        setLoading(false);
        return;
      }

      // ==========================================
      // 8. CHECK USER TYPE
      // ==========================================

      const userType = result?.userType;

      console.log(
        "MEDICONNECT USER TYPE:",
        userType
      );

      if (!userType) {
        setError(
          "Your account type could not be determined."
        );

        setLoading(false);
        return;
      }

      // ==========================================
      // 9. REDIRECT BASED ON ROLE
      // ==========================================

      switch (userType) {
        case "PATIENT":
          router.replace(
            "/dashboard/patient"
          );
          break;

        case "DOCTOR":
          router.replace(
            "/dashboard/doctor"
          );
          break;

        case "PHARMACIST":
          router.replace(
            "/dashboard/pharmacy"
          );
          break;

        case "LABORATORY_STAFF":
          router.replace(
            "/dashboard/laboratory"
          );
          break;

        case "ADMIN":
          router.replace(
            "/dashboard/admin"
          );
          break;

        default:
          console.error(
            "UNKNOWN USER TYPE:",
            userType
          );

          setError(
            `Unknown account type: ${userType}`
          );

          setLoading(false);
          return;
      }
    } catch (err) {
      console.error(
        "LOGIN ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while logging in."
      );

      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="mb-8 text-center">

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-2xl font-bold text-white shadow-lg">
          M
        </div>

        <h1 className="mt-5 text-3xl font-bold text-gray-900">
          Welcome Back
        </h1>

        <p className="mt-2 text-gray-500">
          Sign in to your MediConnect AI account
        </p>

      </div>

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <p>{error}</p>

        </div>
      )}

      {/* =====================================
          FORM
      ===================================== */}

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >

        {/* EMAIL */}

        <div>

          <label className="mb-2 block text-sm font-medium text-gray-700">
            Email
          </label>

          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">

            <Mail
              size={20}
              className="text-gray-400"
            />

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="example@email.com"
              disabled={loading}
              autoComplete="email"
              className="w-full bg-transparent outline-none"
            />

          </div>

        </div>

        {/* PASSWORD */}

        <div>

          <div className="mb-2 flex items-center justify-between">

            <label className="text-sm font-medium text-gray-700">
              Password
            </label>

            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-violet-600 hover:text-violet-700"
            >
              Forgot password?
            </Link>

          </div>

          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">

            <Lock
              size={20}
              className="text-gray-400"
            />

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="••••••••"
              disabled={loading}
              autoComplete="current-password"
              className="w-full bg-transparent outline-none"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (value) => !value
                )
              }
              disabled={loading}
              className="text-gray-400 transition hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>

          </div>

        </div>

        {/* LOGIN BUTTON */}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 font-semibold text-white shadow-lg transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-70"
        >

          {loading ? (
            <>
              <Loader2
                size={20}
                className="animate-spin"
              />

              Signing in...
            </>
          ) : (
            <>
              <LogIn size={20} />

              Sign In
            </>
          )}

        </button>

      </form>

      {/* =====================================
          REGISTER
      ===================================== */}

      <p className="mt-8 text-center text-sm text-gray-500">

        Don't have an account?

        <Link
          href="/register"
          className="ml-1 font-semibold text-violet-600 hover:text-violet-700"
        >
          Create Account
        </Link>

      </p>

    </div>
  );
}