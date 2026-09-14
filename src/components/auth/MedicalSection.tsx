"use client";

import { HeartPulse } from "lucide-react";

export default function MedicalSection() {
  return (
    <section className="rounded-3xl border border-gray-200 p-8">

      <div className="mb-8 flex items-center gap-3">

        <div className="rounded-xl bg-red-500 p-3 text-white">
          <HeartPulse size={24} />
        </div>

        <div>

          <h2 className="text-2xl font-bold">
            Medical Information
          </h2>

          <p className="text-gray-500">
            This information helps healthcare professionals provide better care.
          </p>

        </div>

      </div>

      <div className="grid gap-6 md:grid-cols-2">

        {/* Blood Group */}

        <div>

          <label className="mb-2 block font-medium">
            Blood Group
          </label>

          <select className="w-full rounded-xl border p-3 outline-none">

            <option value="">Select Blood Group</option>

            <option>A+</option>
            <option>A-</option>

            <option>B+</option>
            <option>B-</option>

            <option>AB+</option>
            <option>AB-</option>

            <option>O+</option>
            <option>O-</option>

            <option>Unknown</option>

          </select>

        </div>

        {/* RH */}

        <div>

          <label className="mb-2 block font-medium">
            Rh Factor
          </label>

          <select className="w-full rounded-xl border p-3 outline-none">

            <option value="">Select Rh</option>

            <option>Positive</option>

            <option>Negative</option>

          </select>

        </div>

        {/* Height */}

        <div>

          <label className="mb-2 block font-medium">
            Height (cm)
          </label>

          <input
            type="number"
            placeholder="175"
            className="w-full rounded-xl border p-3 outline-none"
          />

        </div>

        {/* Weight */}

        <div>

          <label className="mb-2 block font-medium">
            Weight (kg)
          </label>

          <input
            type="number"
            placeholder="70"
            className="w-full rounded-xl border p-3 outline-none"
          />

        </div>

        {/* Allergies */}

        <div className="md:col-span-2">

          <label className="mb-2 block font-medium">
            Allergies
          </label>

          <textarea
            rows={3}
            placeholder="Example: Penicillin, Peanuts..."
            className="w-full rounded-xl border p-4 outline-none"
          />

        </div>

        {/* Chronic Diseases */}

        <div className="md:col-span-2">

          <label className="mb-2 block font-medium">
            Chronic Diseases
          </label>

          <textarea
            rows={3}
            placeholder="Diabetes, Hypertension..."
            className="w-full rounded-xl border p-4 outline-none"
          />

        </div>

        {/* Current Treatments */}

        <div className="md:col-span-2">

          <label className="mb-2 block font-medium">
            Current Treatments
          </label>

          <textarea
            rows={3}
            placeholder="Current medications..."
            className="w-full rounded-xl border p-4 outline-none"
          />

        </div>

        {/* Smoking */}

        <div>

          <label className="mb-2 block font-medium">
            Smoking Status
          </label>

          <select className="w-full rounded-xl border p-3 outline-none">

            <option value="">
              Select
            </option>

            <option>Never</option>

            <option>Former</option>

            <option>Current</option>

          </select>

        </div>

        {/* Physical Activity */}

        <div>

          <label className="mb-2 block font-medium">
            Physical Activity
          </label>

          <select className="w-full rounded-xl border p-3 outline-none">

            <option value="">
              Select
            </option>

            <option>Sedentary</option>

            <option>Moderate</option>

            <option>Active</option>

          </select>

        </div>

        {/* Pregnancy */}

        <div>

          <label className="mb-2 block font-medium">
            Pregnancy Status
          </label>

          <select className="w-full rounded-xl border p-3 outline-none">

            <option>Not Applicable</option>

            <option>Pregnant</option>

            <option>Breastfeeding</option>

          </select>

        </div>

        {/* Disability */}

        <div>

          <label className="mb-2 block font-medium">
            Disability
          </label>

          <input
            type="text"
            placeholder="Optional"
            className="w-full rounded-xl border p-3 outline-none"
          />

        </div>

        {/* Notes */}

        <div className="md:col-span-2">

          <label className="mb-2 block font-medium">
            Additional Notes
          </label>

          <textarea
            rows={4}
            placeholder="Anything important doctors should know..."
            className="w-full rounded-xl border p-4 outline-none"
          />

        </div>

      </div>

    </section>
  );
}