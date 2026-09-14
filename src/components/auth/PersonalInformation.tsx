"use client";

import { Dispatch, SetStateAction } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Calendar,
  Venus,
} from "lucide-react";

type Props = {
  birthDate: string;
  setBirthDate: Dispatch<SetStateAction<string>>;
};

export default function PersonalInformation({
  birthDate,
  setBirthDate,
}: Props) {
  return (
    <section className="rounded-3xl border border-gray-200 p-8">

      <h2 className="mb-8 text-2xl font-bold text-gray-900">
        Personal Information
      </h2>

      <div className="grid gap-6 md:grid-cols-2">

        {/* First Name */}

        <div>

          <label className="mb-2 block font-medium">
            First Name *
          </label>

          <div className="flex items-center gap-3 rounded-xl border px-4 py-3">

            <User className="text-gray-400" size={20} />

            <input
              type="text"
              placeholder="John"
              className="w-full outline-none"
            />

          </div>

        </div>

        {/* Last Name */}

        <div>

          <label className="mb-2 block font-medium">
            Last Name *
          </label>

          <div className="flex items-center gap-3 rounded-xl border px-4 py-3">

            <User className="text-gray-400" size={20} />

            <input
              type="text"
              placeholder="Doe"
              className="w-full outline-none"
            />

          </div>

        </div>

        {/* Birth Date */}

        <div>

          <label className="mb-2 block font-medium">
            Date of Birth *
          </label>

          <div className="flex items-center gap-3 rounded-xl border px-4 py-3">

            <Calendar className="text-gray-400" size={20} />

            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full outline-none"
            />

          </div>

        </div>

        {/* Gender */}

        <div>

          <label className="mb-2 block font-medium">
            Gender *
          </label>

          <div className="flex items-center gap-3 rounded-xl border px-4 py-3">

            <Venus className="text-gray-400" size={20} />

            <select className="w-full bg-transparent outline-none">

              <option value="">
                Select gender
              </option>

              <option value="male">
                Male
              </option>

              <option value="female">
                Female
              </option>

            </select>

          </div>

        </div>

        {/* Email */}

        <div>

          <label className="mb-2 block font-medium">
            Email *
          </label>

          <div className="flex items-center gap-3 rounded-xl border px-4 py-3">

            <Mail className="text-gray-400" size={20} />

            <input
              type="email"
              placeholder="john@email.com"
              className="w-full outline-none"
            />

          </div>

        </div>

        {/* Phone */}

        <div>

          <label className="mb-2 block font-medium">
            Phone Number *
          </label>

          <div className="flex items-center gap-3 rounded-xl border px-4 py-3">

            <Phone className="text-gray-400" size={20} />

            <input
              type="tel"
              placeholder="+213 ..."
              className="w-full outline-none"
            />

          </div>

        </div>

        {/* Password */}

        <div>

          <label className="mb-2 block font-medium">
            Password *
          </label>

          <div className="flex items-center gap-3 rounded-xl border px-4 py-3">

            <Lock className="text-gray-400" size={20} />

            <input
              type="password"
              placeholder="********"
              className="w-full outline-none"
            />

          </div>

        </div>

        {/* Confirm Password */}

        <div>

          <label className="mb-2 block font-medium">
            Confirm Password *
          </label>

          <div className="flex items-center gap-3 rounded-xl border px-4 py-3">

            <Lock className="text-gray-400" size={20} />

            <input
              type="password"
              placeholder="********"
              className="w-full outline-none"
            />

          </div>

        </div>

      </div>

    </section>
  );
}