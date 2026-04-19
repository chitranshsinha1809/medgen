"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";

import {
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "firebase/firestore";

export default function Profile() {

  const { id } = useParams();

  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState("");

  async function load() {

    const q = query(
      collection(db, "reports"),
      where("profileId", "==", id)
    );

    const snap = await getDocs(q);

    setReports(
      snap.docs.map(d => d.data())
    );
  }

  useEffect(() => {
    load();
  }, []);

  async function saveSummary() {

    await addDoc(collection(db, "summaries"), {
      profileId: id,
      text: summary,
      time: new Date()
    });

    alert("Saved");
  }

  return (
    <main className="p-6 max-w-xl mx-auto">

      <h1 className="text-2xl mb-4">Medical Profile</h1>

      {/* Summary */}
      <textarea
        className="border w-full p-2 mb-2"
        placeholder="Medical summary..."
        value={summary}
        onChange={(e)=>setSummary(e.target.value)}
      />

      <button
        onClick={saveSummary}
        className="bg-green-600 text-white px-4 py-1 mb-6"
      >
        Save Summary
      </button>

      {/* History */}
      <h2 className="text-xl mb-2">Reports</h2>

      {reports.map((r,i)=>(
        <div
          key={i}
          className="border p-3 mb-2 rounded"
        >
          <pre>{r.result}</pre>
        </div>
      ))}

    </main>
  );
}
