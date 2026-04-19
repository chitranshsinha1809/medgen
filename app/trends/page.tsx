"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Sidebar from "../components/Sidebar";
import jsPDF from "jspdf";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Trends() {

  const [data, setData] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<number>(0);
  const [insight, setInsight] = useState<string>("");
  const [anomalies, setAnomalies] = useState<string[]>([]);
  const [doctorType, setDoctorType] = useState<string>("");

  useEffect(() => {

    const unsub = onAuthStateChanged(auth, async (u) => {

      if (!u) return;

      const profileId = localStorage.getItem("activeProfile");
      if (!profileId) return;

      const q = query(
        collection(db, "profiles", profileId, "reports"),
        orderBy("created", "asc")
      );

      const snap = await getDocs(q);

      const list: any[] = [];

      snap.forEach((doc) => {
        const d = doc.data();

        list.push({
          date: d.created?.toDate().toLocaleDateString(),
          sugar: d.sugar || 0,
          systolic: d.systolic || 0,
          cholesterol: d.cholesterol || 0,
          risk: d.risk || "Low",
        });
      });

      setData(list);

      if (list.length > 0) analyzeHealth(list);

    });

    return () => unsub();

  }, []);

  // ================= HEALTH ANALYSIS =================
  function analyzeHealth(list: any[]) {

    const latest = list[list.length - 1];
    let score = 100;
    let anomalyList: string[] = [];
    let doc = "";

    if (latest.sugar > 140) {
      score -= 20;
      anomalyList.push("High Blood Sugar detected");
      doc = "Diabetologist / Endocrinologist";
    }

    if (latest.systolic > 140) {
      score -= 20;
      anomalyList.push("Elevated Blood Pressure");
      doc = "Cardiologist";
    }

    if (latest.cholesterol > 200) {
      score -= 20;
      anomalyList.push("High Cholesterol levels");
      doc = "Cardiologist";
    }

    setHealthScore(score);
    setAnomalies(anomalyList);
    setDoctorType(doc || "General Physician");

    if (score > 80)
      setInsight("Health parameters are stable. Maintain lifestyle.");
    else if (score > 60)
      setInsight("Mild abnormalities detected. Monitor regularly.");
    else
      setInsight("Multiple risk factors found. Medical consultation recommended.");
  }

  // ================= DOWNLOAD FULL PORTFOLIO =================
  function downloadPortfolio() {

    const pdf = new jsPDF();
    pdf.text("Med-Gen Health Portfolio", 10, 10);

    pdf.text(`Health Score: ${healthScore}/100`, 10, 25);
    pdf.text(`Recommended Doctor: ${doctorType}`, 10, 35);

    let y = 50;

    data.forEach((d, index) => {
      pdf.text(
        `Report ${index + 1} | ${d.date} | Sugar: ${d.sugar} | BP: ${d.systolic} | Cholesterol: ${d.cholesterol}`,
        10,
        y
      );
      y += 10;
    });

    pdf.save("health-portfolio.pdf");
  }

  // ================= OPEN DOCTOR SEARCH =================
  function openDoctorSearch() {

    navigator.geolocation.getCurrentPosition((p) => {

      const url =
        `https://www.google.com/maps/search/${doctorType}/@${p.coords.latitude},${p.coords.longitude},15z`;

      window.open(url);

    });

  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">

      <Sidebar />

      <main className="flex-1 p-6 space-y-8">

        <h1 className="text-3xl font-bold text-blue-400">
          🧠 Health Intelligence Dashboard
        </h1>

        {/* Health Score */}
        <div className="bg-gray-800 p-6 rounded-xl space-y-3">
          <h2 className="text-xl">Health Score</h2>

          <div className="text-5xl font-bold text-green-400">
            {healthScore}/100
          </div>

          <p className="text-gray-300">{insight}</p>

          {anomalies.length > 0 && (
            <div className="bg-red-900 p-3 rounded">
              <h3 className="font-semibold text-red-400 mb-2">
                ⚠ Anomalies Detected
              </h3>
              {anomalies.map((a, i) => (
                <p key={i}>• {a}</p>
              ))}
            </div>
          )}

          <div className="bg-gray-700 p-3 rounded">
            <h3 className="font-semibold text-yellow-400">
              👨‍⚕️ Recommended Specialist
            </h3>
            <p>{doctorType}</p>
            <button
              onClick={openDoctorSearch}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded"
            >
              Find Nearby
            </button>
          </div>

          <button
            onClick={downloadPortfolio}
            className="mt-4 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-semibold"
          >
            📁 Download Full Health Portfolio
          </button>
        </div>

        {/* Sugar Chart */}
        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="mb-4 text-green-400">Blood Sugar Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid stroke="#444" />
              <XAxis dataKey="date" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip />
              <Line type="monotone" dataKey="sugar" stroke="#22c55e" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* BP Chart */}
        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="mb-4 text-red-400">Blood Pressure Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid stroke="#444" />
              <XAxis dataKey="date" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip />
              <Line type="monotone" dataKey="systolic" stroke="#ef4444" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cholesterol */}
        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="mb-4 text-yellow-400">Cholesterol Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid stroke="#444" />
              <XAxis dataKey="date" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip />
              <Line type="monotone" dataKey="cholesterol" stroke="#facc15" />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </main>
    </div>
  );
}