"use client";

import Link from "next/link";
import {
  Mail,
  Lock,
  User,
  UserRoundPlus,
  Calendar,
  Phone,
  MapPin,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const roles = [
  {
    id: "patient",
    label: "Patient",
    icon: "🧑",
  },
  {
    id: "doctor",
    label: "Doctor",
    icon: "👨‍⚕️",
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    icon: "💊",
  },
  {
    id: "laboratory",
    label: "Laboratory",
    icon: "🧪",
  },
];

export default function RegisterForm() {
  const router = useRouter();

  const [role, setRole] = useState("patient");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [wilaya, setWilaya] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [guardianFirstName, setGuardianFirstName] = useState("");
  const [guardianLastName, setGuardianLastName] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("Father");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isMinor, setIsMinor] = useState(false);

  const checkAge = (date: string) => {
    setBirthDate(date);

    if (!date) {
      setIsMinor(false);
      return;
    }

    const today = new Date();
    const birth = new Date(date);

    let age = today.getFullYear() - birth.getFullYear();

    const month = today.getMonth() - birth.getMonth();

    if (
      month < 0 ||
      (month === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    setIsMinor(age < 18);
  };

  const validateForm = () => {
    if (!firstName.trim()) {
      return "Please enter your first name.";
    }

    if (!lastName.trim()) {
      return "Please enter your last name.";
    }

    if (!birthDate) {
      return "Please select your date of birth.";
    }

    if (!gender) {
      return "Please select your gender.";
    }

    if (!email.trim()) {
      return "Please enter your email.";
    }

    if (!phone.trim()) {
      return "Please enter your phone number.";
    }

    if (!password) {
      return "Please enter a password.";
    }

    if (password.length < 8) {
      return "Password must contain at least 8 characters.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    if (isMinor) {
      if (!guardianFirstName.trim()) {
        return "Please enter the guardian's first name.";
      }

      if (!guardianLastName.trim()) {
        return "Please enter the guardian's last name.";
      }

      if (!guardianEmail.trim()) {
        return "Please enter the guardian's email.";
      }

      if (!guardianPhone.trim()) {
        return "Please enter the guardian's phone number.";
      }
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      /*
       * STEP 1
       * Create the authentication account in Supabase.
       */

      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!data.user) {
        throw new Error("Unable to create the account.");
      }

      /*
       * STEP 2
       *
       * The API will create:
       *
       * Profile
       * Patient / Doctor / Pharmacist / LaboratoryStaff
       *
       * using the Supabase Auth user ID.
       */

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authUserId: data.user.id,

          role,

          firstName: firstName.trim(),
          lastName: lastName.trim(),

          email: email.trim().toLowerCase(),

          birthDate,
          gender,

          phone: phone.trim(),

          address: address.trim() || null,
          city: city.trim() || null,
          wilaya: wilaya.trim() || null,

          guardian: isMinor
            ? {
                firstName: guardianFirstName.trim(),
                lastName: guardianLastName.trim(),
                relation: guardianRelation,
                email: guardianEmail.trim().toLowerCase(),
                phone: guardianPhone.trim(),
              }
            : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to create your profile."
        );
      }

      setSuccess(
        "Account created successfully! Redirecting..."
      );

      /*
       * If email confirmation is enabled in Supabase,
       * the user will need to confirm their email first.
       */

      if (!data.session) {
  setTimeout(() => {
    router.push("/login");
  }, 2000);

  return;
}

/*
 * Redirect according to the selected role
 */

switch (role) {
  case "patient":
    router.push("/dashboard/patient");
    break;

  case "doctor":
    router.push("/dashboard/doctor");
    break;

  case "pharmacy":
    router.push("/dashboard/pharmacy");
    break;

  case "laboratory":
    router.push("/dashboard/laboratory");
    break;

  default:
    router.push("/login");
}
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong during registration."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 px-6 py-10">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">

        {/* Header */}

        <div className="text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-2xl font-bold text-white shadow-lg">
            M
          </div>

          <h1 className="mt-5 text-3xl font-bold text-gray-900">
            Create Account
          </h1>

          <p className="mt-2 text-gray-500">
            Join MediConnect AI
          </p>

        </div>

        {/* Messages */}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0"
            />

            <p>{success}</p>
          </div>
        )}

        {/* Roles */}

        <div className="mt-8">

          <label className="text-sm font-semibold text-gray-700">
            Select your role
          </label>

          <div className="mt-4 grid grid-cols-2 gap-4">

            {roles.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={loading}
                onClick={() => setRole(item.id)}
                className={`rounded-2xl border p-4 text-center transition ${
                  role === item.id
                    ? "border-violet-600 bg-violet-50 shadow-sm"
                    : "border-gray-200 hover:border-violet-300"
                }`}
              >
                <div className="text-3xl">
                  {item.icon}
                </div>

                <p className="mt-2 font-semibold text-gray-800">
                  {item.label}
                </p>
              </button>
            ))}

          </div>

        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >

          {/* Names */}

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="mb-2 block text-sm font-medium">
                First Name
              </label>

              <div className="flex items-center gap-3 rounded-xl border px-4 py-3 focus-within:border-violet-500">

                <User
                  size={20}
                  className="text-gray-400"
                />

                <input
                  value={firstName}
                  onChange={(e) =>
                    setFirstName(e.target.value)
                  }
                  placeholder="First name"
                  disabled={loading}
                  className="w-full bg-transparent outline-none"
                />

              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Last Name
              </label>

              <div className="flex items-center gap-3 rounded-xl border px-4 py-3 focus-within:border-violet-500">

                <User
                  size={20}
                  className="text-gray-400"
                />

                <input
                  value={lastName}
                  onChange={(e) =>
                    setLastName(e.target.value)
                  }
                  placeholder="Last name"
                  disabled={loading}
                  className="w-full bg-transparent outline-none"
                />

              </div>
            </div>

          </div>

          {/* Birth Date */}

          <div>

            <label className="mb-2 block text-sm font-medium">
              Date of Birth
            </label>

            <div className="flex items-center gap-3 rounded-xl border px-4 py-3 focus-within:border-violet-500">

              <Calendar
                size={20}
                className="text-gray-400"
              />

              <input
                type="date"
                value={birthDate}
                onChange={(e) =>
                  checkAge(e.target.value)
                }
                disabled={loading}
                className="w-full bg-transparent outline-none"
              />

            </div>

            {isMinor && (
              <p className="mt-2 text-xs font-medium text-violet-600">
                You are under 18. Guardian information is required.
              </p>
            )}

          </div>

          {/* Gender */}

          <div>

            <label className="mb-2 block text-sm font-medium">
              Gender
            </label>

            <div className="grid grid-cols-2 gap-4">

              <button
                type="button"
                disabled={loading}
                onClick={() => setGender("MALE")}
                className={`rounded-xl border py-3 font-medium transition ${
                  gender === "MALE"
                    ? "border-violet-600 bg-violet-50 text-violet-700"
                    : "border-gray-200 hover:border-violet-300"
                }`}
              >
                👨 Male
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setGender("FEMALE")}
                className={`rounded-xl border py-3 font-medium transition ${
                  gender === "FEMALE"
                    ? "border-violet-600 bg-violet-50 text-violet-700"
                    : "border-gray-200 hover:border-violet-300"
                }`}
              >
                👩 Female
              </button>

            </div>

          </div>

          {/* Guardian */}

          {isMinor && (
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">

              <h2 className="mb-4 text-lg font-bold text-gray-900">
                👨‍👩‍👧 Parent / Guardian Information
              </h2>

              <div className="space-y-4">

                <div className="grid grid-cols-2 gap-4">

                  <input
                    value={guardianFirstName}
                    onChange={(e) =>
                      setGuardianFirstName(e.target.value)
                    }
                    placeholder="Parent First Name"
                    disabled={loading}
                    className="rounded-xl border bg-white px-4 py-3 outline-none focus:border-violet-500"
                  />

                  <input
                    value={guardianLastName}
                    onChange={(e) =>
                      setGuardianLastName(e.target.value)
                    }
                    placeholder="Parent Last Name"
                    disabled={loading}
                    className="rounded-xl border bg-white px-4 py-3 outline-none focus:border-violet-500"
                  />

                </div>

                <select
                  value={guardianRelation}
                  onChange={(e) =>
                    setGuardianRelation(e.target.value)
                  }
                  disabled={loading}
                  className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-violet-500"
                >
                  <option value="Father">
                    Father
                  </option>

                  <option value="Mother">
                    Mother
                  </option>

                  <option value="Guardian">
                    Guardian
                  </option>
                </select>

                <input
                  type="email"
                  value={guardianEmail}
                  onChange={(e) =>
                    setGuardianEmail(e.target.value)
                  }
                  placeholder="Parent Email"
                  disabled={loading}
                  className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-violet-500"
                />

                <input
                  type="tel"
                  value={guardianPhone}
                  onChange={(e) =>
                    setGuardianPhone(e.target.value)
                  }
                  placeholder="Parent Phone Number"
                  disabled={loading}
                  className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-violet-500"
                />

              </div>

            </div>
          )}

          {/* Email */}

          <div>

            <label className="mb-2 block text-sm font-medium">
              Email
            </label>

            <div className="flex items-center gap-3 rounded-xl border px-4 py-3 focus-within:border-violet-500">

              <Mail
                size={20}
                className="text-gray-400"
              />

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="example@email.com"
                disabled={loading}
                className="w-full bg-transparent outline-none"
              />

            </div>

          </div>

          {/* Phone */}

          <div>

            <label className="mb-2 block text-sm font-medium">
              Phone Number
            </label>

            <div className="flex items-center gap-3 rounded-xl border px-4 py-3 focus-within:border-violet-500">

              <Phone
                size={20}
                className="text-gray-400"
              />

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="+213 ..."
                disabled={loading}
                className="w-full bg-transparent outline-none"
              />

            </div>

          </div>

          {/* Address */}

          <div>

            <label className="mb-2 block text-sm font-medium">
              Address
            </label>

            <div className="flex items-center gap-3 rounded-xl border px-4 py-3 focus-within:border-violet-500">

              <MapPin
                size={20}
                className="text-gray-400"
              />

              <input
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                placeholder="Your address"
                disabled={loading}
                className="w-full bg-transparent outline-none"
              />

            </div>

          </div>

          {/* City + Wilaya */}

          <div className="grid grid-cols-2 gap-4">

            <input
              value={city}
              onChange={(e) =>
                setCity(e.target.value)
              }
              placeholder="City"
              disabled={loading}
              className="rounded-xl border px-4 py-3 outline-none focus:border-violet-500"
            />

            <input
              value={wilaya}
              onChange={(e) =>
                setWilaya(e.target.value)
              }
              placeholder="Wilaya"
              disabled={loading}
              className="rounded-xl border px-4 py-3 outline-none focus:border-violet-500"
            />

          </div>

          {/* Password */}

          <div>

            <label className="mb-2 block text-sm font-medium">
              Password
            </label>

            <div className="flex items-center gap-3 rounded-xl border px-4 py-3 focus-within:border-violet-500">

              <Lock
                size={20}
                className="text-gray-400"
              />

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-transparent outline-none"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>

            </div>

          </div>

          {/* Confirm Password */}

          <div>

            <label className="mb-2 block text-sm font-medium">
              Confirm Password
            </label>

            <div className="flex items-center gap-3 rounded-xl border px-4 py-3 focus-within:border-violet-500">

              <Lock
                size={20}
                className="text-gray-400"
              />

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-transparent outline-none"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                className="text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>

            </div>

          </div>

          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-70"
          >

            {loading ? (
              <>
                <Loader2
                  size={20}
                  className="animate-spin"
                />

                Creating Account...
              </>
            ) : (
              <>
                <UserRoundPlus size={20} />

                Create Account
              </>
            )}

          </button>

        </form>

        {/* Login */}

        <p className="mt-8 text-center text-sm text-gray-500">

          Already have an account?

          <Link
            href="/login"
            className="ml-1 font-semibold text-violet-600 hover:text-violet-700"
          >
            Login
          </Link>

        </p>

      </div>
    </main>
  );
}