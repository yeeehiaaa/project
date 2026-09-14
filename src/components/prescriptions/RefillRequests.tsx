"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Pill,
  Clock3,
  CheckCircle2,
  Send,
  XCircle,
  Store,
} from "lucide-react";

type RefillRequest = {
  id: number;
  medication: string;
  dosage: string;
  remaining: string;
  doctor: string;
  pharmacy: string;
  status: "Available" | "Requested" | "Approved";
};

const initialRequests: RefillRequest[] = [
  {
    id: 1,
    medication: "Metformin 850mg",
    dosage: "1 tablet • Morning",
    remaining: "3 days",
    doctor: "Dr. Ahmed Karim",
    pharmacy: "MediCare Pharmacy",
    status: "Available",
  },
  {
    id: 2,
    medication: "Vitamin D3",
    dosage: "1 capsule • Daily",
    remaining: "7 days",
    doctor: "Dr. Michael Brown",
    pharmacy: "Central Health Pharmacy",
    status: "Available",
  },
  {
    id: 3,
    medication: "Amoxicillin 500mg",
    dosage: "1 capsule • 3x/day",
    remaining: "5 days",
    doctor: "Dr. Sarah Johnson",
    pharmacy: "MediCare Pharmacy",
    status: "Requested",
  },
];

function statusStyles(status: RefillRequest["status"]) {
  switch (status) {
    case "Available":
      return "bg-amber-100 text-amber-700";

    case "Requested":
      return "bg-blue-100 text-blue-700";

    case "Approved":
      return "bg-emerald-100 text-emerald-700";
  }
}

export default function RefillRequests() {
  const [requests, setRequests] =
    useState<RefillRequest[]>(initialRequests);

  const requestRefill = (id: number) => {
    setRequests((current) =>
      current.map((request) =>
        request.id === id
          ? {
              ...request,
              status: "Requested",
            }
          : request
      )
    );
  };

  const cancelRequest = (id: number) => {
    setRequests((current) =>
      current.map((request) =>
        request.id === id
          ? {
              ...request,
              status: "Available",
            }
          : request
      )
    );
  };

  const requestedCount = requests.filter(
    (request) => request.status === "Requested"
  ).length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-[34px] border border-slate-100 bg-white p-8 shadow-sm"
    >
      {/* Header */}

      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
            <RefreshCw size={26} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[3px] text-orange-600">
              Medication Renewal
            </p>

            <h2 className="mt-1 text-3xl font-bold text-slate-900">
              Refill Requests
            </h2>

            <p className="mt-2 max-w-2xl text-slate-500">
              Request a refill before your medication runs out and keep your
              treatment uninterrupted.
            </p>
          </div>
        </div>

        {/* Counter */}

        <div className="flex items-center gap-3 rounded-2xl bg-orange-50 px-5 py-4">
          <Clock3 size={21} className="text-orange-600" />

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-orange-600">
              Pending Requests
            </p>

            <p className="mt-1 text-xl font-bold text-orange-800">
              {requestedCount}
            </p>
          </div>
        </div>
      </div>

      {/* Requests */}

      <div className="mt-8 grid gap-5">
        {requests.map((request, index) => {
          const isRequested = request.status === "Requested";
          const isApproved = request.status === "Approved";

          return (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.08,
                duration: 0.35,
              }}
              className="rounded-[26px] border border-slate-100 bg-slate-50/60 p-6 transition-all duration-300 hover:shadow-md"
            >
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center">
                {/* Medication */}

                <div className="flex flex-1 items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                    <Pill size={25} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900">
                        {request.medication}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {request.dosage}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                      <span className="flex items-center gap-2">
                        <Clock3 size={15} />

                        <span>
                          Remaining:{" "}
                          <strong className="text-slate-700">
                            {request.remaining}
                          </strong>
                        </span>
                      </span>

                      <span className="flex items-center gap-2">
                        <Store size={15} />

                        {request.pharmacy}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Doctor */}

                <div className="rounded-2xl bg-white px-5 py-4 xl:min-w-[220px]">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Prescribed by
                  </p>

                  <p className="mt-2 font-semibold text-slate-800">
                    {request.doctor}
                  </p>
                </div>

                {/* Action */}

                <div className="flex shrink-0">
                  {!isRequested && !isApproved && (
                    <button
                      type="button"
                      onClick={() => requestRefill(request.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl xl:w-auto"
                    >
                      <Send size={18} />

                      Request Refill
                    </button>
                  )}

                  {isRequested && (
                    <button
                      type="button"
                      onClick={() => cancelRequest(request.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-6 py-3.5 font-semibold text-red-600 transition hover:bg-red-100 xl:w-auto"
                    >
                      <XCircle size={18} />

                      Cancel Request
                    </button>
                  )}

                  {isApproved && (
                    <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-6 py-3.5 font-semibold text-emerald-700">
                      <CheckCircle2 size={18} />

                      Approved
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Information */}

      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-blue-50 p-5">
        <RefreshCw
          size={19}
          className="mt-0.5 shrink-0 text-blue-600"
        />

        <p className="text-sm leading-6 text-blue-900">
          Refill requests are sent to the appropriate healthcare professional
          for review. A medication renewal may require approval from your
          prescribing doctor before the pharmacy can dispense it.
        </p>
      </div>
    </motion.section>
  );
}