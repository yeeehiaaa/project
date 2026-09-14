"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

type Props = {
  checked: boolean;
  setChecked: (value: boolean) => void;
};

export default function TermsSection({
  checked,
  setChecked,
}: Props) {
  return (
    <section className="rounded-3xl border border-gray-200 p-8">

      <div className="mb-8 flex items-center gap-3">

        <div className="rounded-xl bg-green-600 p-3 text-white">
          <ShieldCheck size={24} />
        </div>

        <div>

          <h2 className="text-2xl font-bold">
            Privacy & Consent
          </h2>

          <p className="text-gray-500">
            Please review and accept the following agreements.
          </p>

        </div>

      </div>

      <div className="space-y-6">

        {/* Terms */}

        <label className="flex items-start gap-4 rounded-2xl border p-5 cursor-pointer hover:border-violet-400">

          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 h-5 w-5 accent-violet-600"
          />

          <span className="text-gray-700 leading-7">

            I agree to the{" "}

            <Link
              href="/terms"
              className="font-semibold text-violet-600 hover:underline"
            >
              Terms of Service
            </Link>

            {" "}and{" "}

            <Link
              href="/privacy"
              className="font-semibold text-violet-600 hover:underline"
            >
              Privacy Policy
            </Link>

            .

          </span>

        </label>

        {/* Medical Consent */}

        <label className="flex items-start gap-4 rounded-2xl border p-5 cursor-pointer hover:border-violet-400">

          <input
            type="checkbox"
            className="mt-1 h-5 w-5 accent-violet-600"
          />

          <span className="leading-7 text-gray-700">

            I authorize MediConnect AI to securely process,
            store and share my medical information with
            authorized healthcare professionals involved
            in my care.

          </span>

        </label>

        {/* Emergency */}

        <label className="flex items-start gap-4 rounded-2xl border p-5 cursor-pointer hover:border-violet-400">

          <input
            type="checkbox"
            className="mt-1 h-5 w-5 accent-violet-600"
          />

          <span className="leading-7 text-gray-700">

            I agree that in emergency situations my
            medical information may be accessed by
            authorized emergency healthcare providers.

          </span>

        </label>

        {/* Newsletter */}

        <label className="flex items-start gap-4 rounded-2xl border p-5 cursor-pointer hover:border-violet-400">

          <input
            type="checkbox"
            className="mt-1 h-5 w-5 accent-violet-600"
          />

          <span className="leading-7 text-gray-700">

            I would like to receive health tips,
            platform updates and newsletters from
            MediConnect AI.

          </span>

        </label>

      </div>

      {/* Security Card */}

      <div className="mt-10 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">

        <h3 className="text-xl font-bold">
          🔒 Your data is protected
        </h3>

        <p className="mt-3 leading-7 text-violet-100">

          All medical information is encrypted and stored
          securely. Only authorized healthcare professionals
          can access your records according to your permissions.

        </p>

      </div>

    </section>
  );
}