"use client";

import {
  User,
  Mail,
  Phone,
  Calendar,
  Users,
} from "lucide-react";

export default function GuardianInformation() {
  return (
    <section className="rounded-3xl border border-orange-200 bg-orange-50 p-8">

      <div className="mb-8 flex items-center gap-3">

        <div className="rounded-xl bg-orange-500 p-3 text-white">
          <Users size={24} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Legal Guardian
          </h2>

          <p className="text-gray-600">
            Required because the patient is under 18 years old.
          </p>
        </div>

      </div>

      <div className="grid gap-6 md:grid-cols-2">

        {/* First Name */}

        <div>

          <label className="mb-2 block font-medium">
            Guardian First Name *
          </label>

          <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3">

            <User className="text-gray-400" size={20} />

            <input
              type="text"
              placeholder="Ahmed"
              className="w-full outline-none"
            />

          </div>

        </div>

        {/* Last Name */}

        <div>

          <label className="mb-2 block font-medium">
            Guardian Last Name *
          </label>

          <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3">

            <User className="text-gray-400" size={20} />

            <input
              type="text"
              placeholder="Benali"
              className="w-full outline-none"
            />

          </div>

        </div>

        {/* Relationship */}

        <div>

          <label className="mb-2 block font-medium">
            Relationship *
          </label>

          <div className="rounded-xl border bg-white px-4 py-3">

            <select className="w-full bg-transparent outline-none">

              <option>
                Select relationship
              </option>

              <option>
                Father
              </option>

              <option>
                Mother
              </option>

              <option>
                Legal Guardian
              </option>

            </select>

          </div>

        </div>

        {/* Date of Birth */}

        <div>

          <label className="mb-2 block font-medium">
            Date of Birth
          </label>

          <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3">

            <Calendar className="text-gray-400" size={20} />

            <input
              type="date"
              className="w-full outline-none"
            />

          </div>

        </div>

        {/* Email */}

        <div>

          <label className="mb-2 block font-medium">
            Email *
          </label>

          <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3">

            <Mail className="text-gray-400" size={20} />

            <input
              type="email"
              placeholder="parent@email.com"
              className="w-full outline-none"
            />

          </div>

        </div>

        {/* Phone */}

        <div>

          <label className="mb-2 block font-medium">
            Phone *
          </label>

          <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3">

            <Phone className="text-gray-400" size={20} />

            <input
              type="tel"
              placeholder="+213 ..."
              className="w-full outline-none"
            />

          </div>

        </div>

        {/* Address */}

        <div className="md:col-span-2">

          <label className="mb-2 block font-medium">
            Address
          </label>

          <textarea
            rows={4}
            placeholder="Guardian address..."
            className="w-full rounded-xl border bg-white p-4 outline-none"
          />

        </div>

      </div>

      <div className="mt-8 rounded-2xl border border-yellow-300 bg-yellow-100 p-5">

        <p className="text-sm leading-7 text-yellow-900">

          The legal guardian will be responsible for managing the
          child's medical appointments, prescriptions and medical
          documents until the patient reaches the age of 18.

        </p>

      </div>

    </section>
  );
}