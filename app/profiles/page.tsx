"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function ProfilesPage() {
  const [name, setName] = useState("");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Auth + Load profiles
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        window.location.href = "/login";
        return;
      }

      setUser(u);
      await loadProfiles(u.uid);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Load profiles
  async function loadProfiles(uid: string) {
    const q = query(
      collection(db, "profiles"),
      where("uid", "==", uid)
    );

    const snap = await getDocs(q);

    const list: any[] = [];

    snap.forEach((doc) => {
      list.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    setProfiles(list);
  }

  // Add profile
  async function addProfile() {
    if (!name.trim()) return alert("Enter name");

    if (!user) return;

    await addDoc(collection(db, "profiles"), {
      uid: user.uid,
      name,
      created: new Date(),
    });

    setName("");
    await loadProfiles(user.uid);
  }

  // Select profile
  function selectProfile(id: string) {
    localStorage.setItem("activeProfile", id);
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 flex justify-center items-center p-6">

      {/* Card */}
      <div className="bg-gray-800 p-6 w-full max-w-md rounded-xl shadow-xl border border-gray-700">

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-white mb-4">
          Select Profile
        </h1>

        {/* Add Input */}
        <div className="flex gap-2 mb-4">

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="flex-1 p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
          />

          <button
            onClick={addProfile}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded font-semibold"
          >
            Add
          </button>

        </div>

        {/* Profiles List */}
        <div className="space-y-2">

          {profiles.length === 0 && (
            <p className="text-gray-400 text-center text-sm">
              No profiles yet
            </p>
          )}

          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProfile(p.id)}
              className="w-full flex items-center gap-2 p-3 rounded bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 transition"
            >
              <span className="text-lg">👤</span>
              <span className="font-medium">{p.name}</span>
            </button>
          ))}

        </div>

      </div>

    </main>
  );
}
