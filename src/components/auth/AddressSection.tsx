"use client";

import { MapPin, Globe, Building2, Home } from "lucide-react";

const wilayas = [
  "Adrar",
  "Chlef",
  "Laghouat",
  "Oum El Bouaghi",
  "Batna",
  "Béjaïa",
  "Biskra",
  "Béchar",
  "Blida",
  "Bouira",
  "Tamanrasset",
  "Tébessa",
  "Tlemcen",
  "Tiaret",
  "Tizi Ouzou",
  "Alger",
  "Djelfa",
  "Jijel",
  "Sétif",
  "Saïda",
  "Skikda",
  "Sidi Bel Abbès",
  "Annaba",
  "Guelma",
  "Constantine",
  "Médéa",
  "Mostaganem",
  "M'Sila",
  "Mascara",
  "Ouargla",
  "Oran",
  "El Bayadh",
  "Illizi",
  "Bordj Bou Arreridj",
  "Boumerdès",
  "El Tarf",
  "Tindouf",
  "Tissemsilt",
  "El Oued",
  "Khenchela",
  "Souk Ahras",
  "Tipaza",
  "Mila",
  "Aïn Defla",
  "Naâma",
  "Aïn Témouchent",
  "Ghardaïa",
  "Relizane",
  "Timimoun",
  "Bordj Badji Mokhtar",
  "Ouled Djellal",
  "Béni Abbès",
  "In Salah",
  "In Guezzam",
  "Touggourt",
  "Djanet",
  "El M'Ghair",
  "El Meniaa",
];

export default function AddressSection() {
  return (
    <section className="rounded-3xl border border-gray-200 p-8">

      <div className="mb-8 flex items-center gap-3">

        <div className="rounded-xl bg-violet-600 p-3 text-white">
          <MapPin size={24} />
        </div>

        <div>
          <h2 className="text-2xl font-bold">
            Address Information
          </h2>

          <p className="text-gray-500">
            Your address helps doctors provide nearby healthcare services.
          </p>
        </div>

      </div>

      <div className="grid gap-6 md:grid-cols-2">

        {/* Country */}

        <div>

          <label className="mb-2 block font-medium">
            Country
          </label>

          <div className="flex items-center gap-3 rounded-xl border px-4 py-3">

            <Globe className="text-gray-400" size={20} />

            <input
              value="Algeria"
              readOnly
              className="w-full bg-transparent outline-none"
            />

          </div>

        </div>

        {/* Wilaya */}

        <div>

          <label className="mb-2 block font-medium">
            Wilaya
          </label>

          <div className="flex items-center gap-3 rounded-xl border px-4 py-3">

            <Building2 className="text-gray-400" size={20} />

            <select className="w-full bg-transparent outline-none">

              <option>
                Select Wilaya
              </option>

              {wilayas.map((wilaya) => (
                <option key={wilaya}>
                  {wilaya}
                </option>
              ))}

            </select>

          </div>

        </div>

        {/* City */}

        <div>

          <label className="mb-2 block font-medium">
            City
          </label>

          <div className="flex items-center gap-3 rounded-xl border px-4 py-3">

            <Building2 className="text-gray-400" size={20} />

            <input
              placeholder="City"
              className="w-full outline-none"
            />

          </div>

        </div>

        {/* Postal Code */}

        <div>

          <label className="mb-2 block font-medium">
            Postal Code
          </label>

          <div className="flex items-center gap-3 rounded-xl border px-4 py-3">

            <MapPin className="text-gray-400" size={20} />

            <input
              placeholder="16000"
              className="w-full outline-none"
            />

          </div>

        </div>

        {/* Full Address */}

        <div className="md:col-span-2">

          <label className="mb-2 block font-medium">
            Full Address
          </label>

          <div className="flex items-start gap-3 rounded-xl border px-4 py-3">

            <Home
              className="mt-1 text-gray-400"
              size={20}
            />

            <textarea
              rows={4}
              placeholder="Street, Building, Apartment..."
              className="w-full resize-none outline-none"
            />

          </div>

        </div>

        {/* GPS */}

        <div className="md:col-span-2">

          <button
            type="button"
            className="rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            📍 Use My Current Location
          </button>

          <p className="mt-3 text-sm text-gray-500">
            Optional. This helps doctors locate your home for emergency or home visits.
          </p>

        </div>

      </div>

    </section>
  );
}