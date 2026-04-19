"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Sidebar() {

  const pathname = usePathname();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {

    const unsub = onAuthStateChanged(auth, async (u) => {

      if (!u) return;

      const q = query(
        collection(db, "profiles"),
        where("uid", "==", u.uid)
      );

      const snap = await getDocs(q);

      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });

      setProfiles(list);

      const saved = localStorage.getItem("activeProfile");
      setActive(saved);

    });

    return () => unsub();

  }, []);

  function selectProfile(id: string) {
    localStorage.setItem("activeProfile", id);
    setActive(id);
    window.location.reload();
  }

  async function deleteProfile(profileId: string) {

    const confirmDelete = confirm("Delete this profile permanently?");
    if (!confirmDelete) return;

    const reportsSnap = await getDocs(
      collection(db, "profiles", profileId, "reports")
    );

    for (const r of reportsSnap.docs) {
      await deleteDoc(r.ref);
    }

    await deleteDoc(doc(db, "profiles", profileId));

    localStorage.removeItem("activeProfile");
    window.location.href = "/profiles";
  }

  async function editProfile(profileId: string, currentName: string) {

    const newName = prompt("Enter new profile name:", currentName);
    if (!newName || newName.trim() === "") return;

    await updateDoc(doc(db, "profiles", profileId), {
      name: newName
    });

    window.location.reload();
  }

  async function changeAvatar(profileId: string) {

    const url = prompt("Paste avatar image URL:");

    if (!url) return;

    await updateDoc(doc(db, "profiles", profileId), {
      avatar: url
    });

    window.location.reload();
  }

  function NavButton({ href, label, icon }: any) {

    const isActive = pathname === href;

    return (
      <button
        onClick={() => (window.location.href = href)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
          isActive
            ? "bg-blue-600 text-white shadow-lg"
            : "hover:bg-gray-800 text-gray-300"
        }`}
      >
        <span>{icon}</span>
        {!collapsed && <span>{label}</span>}
      </button>
    );
  }

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-72"
      } bg-gradient-to-b from-gray-950 to-gray-900 border-r border-gray-800 text-white flex flex-col transition-all duration-300`}
    >

      {/* Header */}
      <div className="p-5 border-b border-gray-800 flex justify-between items-center">
        {!collapsed && (
          <span className="text-xl font-bold tracking-wide text-blue-400">
            Med-Gen
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white"
        >
          ☰
        </button>
      </div>

      {/* Navigation */}
      <div className="p-4 space-y-2">
        <NavButton href="/" label="Dashboard" icon="🏠" />
        <NavButton href="/history" label="History" icon="📜" />
        <NavButton href="/trends" label="Trends" icon="📊" />
        <NavButton href="/chat" label="AI Chat" icon="🤖" />
      </div>

      <div className="border-t border-gray-800 mx-4 my-3"></div>

      {/* Profiles */}
      <div className="flex-1 overflow-y-auto px-3 space-y-3">

        {!collapsed && (
          <div className="text-xs uppercase text-gray-500 mb-2">
            Profiles
          </div>
        )}

        {profiles.map((p) => (

          <div
            key={p.id}
            className={`p-3 rounded-lg transition ${
              active === p.id
                ? "bg-gray-700"
                : "hover:bg-gray-800"
            }`}
          >

            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => selectProfile(p.id)}
            >

              <img
                src={p.avatar || "https://i.imgur.com/6VBx3io.png"}
                className="w-8 h-8 rounded-full object-cover"
              />

              {!collapsed && (
                <span className="flex-1 text-sm">
                  {p.name}
                </span>
              )}

            </div>

            {!collapsed && (
              <div className="flex gap-3 mt-2 text-xs text-gray-400">

                <button
                  onClick={() => editProfile(p.id, p.name)}
                  className="hover:text-blue-400"
                >
                  ✏ Edit
                </button>

                <button
                  onClick={() => changeAvatar(p.id)}
                  className="hover:text-yellow-400"
                >
                  🖼 Avatar
                </button>

                <button
                  onClick={() => deleteProfile(p.id)}
                  className="hover:text-red-500"
                >
                  🗑 Delete
                </button>

              </div>
            )}

          </div>

        ))}

      </div>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => (window.location.href = "/profiles")}
          className="w-full bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-sm"
        >
          {!collapsed ? "Manage Profiles" : "+"}
        </button>
      </div>

    </aside>
  );
}