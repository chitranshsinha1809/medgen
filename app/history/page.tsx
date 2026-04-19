"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy
} from "firebase/firestore";

export default function HistoryPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      const profileId = localStorage.getItem("activeProfile");

      if (!profileId) return;

      const q = query(
        collection(db, "profiles", profileId, "reports"),
        orderBy("created", "desc")
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setReports(data);
      setLoading(false);
    }

    fetchReports();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white">

      <h1 className="text-3xl font-bold text-blue-400 mb-6">
        📜 Report History
      </h1>

      {loading && <p>Loading...</p>}

      {!loading && reports.length === 0 && (
        <p>No reports yet</p>
      )}

      <div className="grid gap-4">

        {reports.map((r) => (

          <div
            key={r.id}
            className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-blue-500 transition cursor-pointer"
            onClick={() => {
              localStorage.setItem("selectedReport", JSON.stringify(r));
              window.location.href = "/history/view";
            }}
          >

            {/* summary */}
            <p className="text-sm text-gray-300 mb-2">
              {r.summary}
              {r.fileURL && (
  <a
    href={r.fileURL}
    target="_blank"
    className="text-blue-400 text-sm underline"
  >
    View Original Report
  </a>
)}
            </p>

            {/* risk */}
            <div className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
              r.risk === "High"
                ? "bg-red-600"
                : r.risk === "Medium"
                ? "bg-yellow-500 text-black"
                : "bg-green-600"
            }`}>
              {r.risk}
            </div>

            {/* date */}
            <p className="text-xs text-gray-400 mt-2">
              {r.created?.toDate?.().toLocaleString() || "No date"}
            </p>

          </div>

        ))}

      </div>
    </div>
  );
}