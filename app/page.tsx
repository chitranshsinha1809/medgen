"use client";

import { useState, useEffect, useRef } from "react";
import Tesseract from "tesseract.js";
import jsPDF from "jspdf";
import Sidebar from "./components/Sidebar";

import { auth, db, storage } from "@/lib/firebase";
import { addDoc, collection, getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Home() {

  // 🔥 FIX: add fileRef (MAIN FIX)
  const fileRef = useRef<File | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [language, setLanguage] = useState("English");
  const [profileName, setProfileName] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        window.location.href = "/login";
        return;
      }

      setUser(u);

      const id = localStorage.getItem("activeProfile");

      if (!id) {
        window.location.href = "/profiles";
        return;
      }

      const snap = await getDoc(doc(db, "profiles", id));
      if (snap.exists()) setProfileName(snap.data().name);
    });

    return () => unsub();
  }, []);

  // 🔥 FIX: update BOTH file + ref
  function handleFile(e: any) {
    const f = e.target.files[0];
    setFile(f);
    fileRef.current = f;
    setAnalysis(null);
    setStatus("");
  }

  async function analyze() {

    // 🔥 FIX: use fileRef (more reliable)
    if (!fileRef.current) return alert("Upload report first");

    setStatus("Reading...");

    const ocr = await Tesseract.recognize(fileRef.current, "eng");
    const extractedText = ocr.data.text;

    setStatus("Analyzing...");

    const profileId = localStorage.getItem("activeProfile");

    const res = await fetch("/api/explain", {
      method: "POST",
      body: JSON.stringify({
        text: extractedText,
        lang: language,
        profileId
      }),
    });

    const raw = await res.json();

    let data;
    try {
      const match = raw.summary?.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : raw;
    } catch {
      data = raw;
    }

    let meaning =
      data.meaning ||
      data.explanation ||
      data.interpretation;

    if (!meaning) {
      const findings = data.keyFindings || data.keyfindings || [];

      if (findings.join(" ").toLowerCase().includes("neutrophil")) {
        meaning =
          "Higher neutrophil levels usually indicate your body is responding to an infection or inflammation.";
      } else if (findings.join(" ").toLowerCase().includes("platelet")) {
        meaning =
          "Platelets help with blood clotting. Abnormal levels may need further evaluation.";
      } else {
        meaning =
          "These results show some variations from normal ranges. A doctor can help determine their significance.";
      }
    }

    const cleaned = {
      summary: data.summary || "No clear summary available",
      observations: data.keyfindings || data.keyFindings || [],
      meaning,
      questions: (data.keyfindings || data.keyFindings || []).map(
        (x: string) => `What does "${x}" indicate?`
      ),
      nextSteps: data.recommendations || [
        "Consult a doctor for proper evaluation",
      ],
      suggestedSpecialist:
        data.suggestedspecialist ||
        data.suggestedSpecialist ||
        "General Physician",
      disclaimer:
        "This analysis is for informational purposes only and is not a medical diagnosis.",
      rawText: extractedText,
    };

    setAnalysis(cleaned);
    setStatus("Done");
  }

  // 🔥 FIXED SAVE FUNCTION
  async function saveReport() {
    try {
      const id = localStorage.getItem("activeProfile");

      if (!id || !user || !analysis) {
        alert("Missing data");
        return;
      }

      if (!fileRef.current) {
        alert("File missing, please upload again");
        return;
      }

      const file = fileRef.current;

      const storageRef = ref(
        storage,
        `reports/${user.uid}/${Date.now()}_${file.name}`
      );

      await uploadBytes(storageRef, file);

      const fileURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, "profiles", id, "reports"), {
        uid: user.uid,
        summary: analysis.summary,
        keyFindings: analysis.observations,
        recommendations: analysis.nextSteps,
        suggestedSpecialist: analysis.suggestedSpecialist,
        originalText: analysis.rawText,
        fileURL,
        created: new Date(),
      });

      alert("Saved successfully ✅");

    } catch (err) {
      console.error("SAVE ERROR:", err);
      alert("Save failed ❌");
    }
  }

  function downloadPDF() {
    if (!analysis) return;

    const pdf = new jsPDF();
    pdf.text("Med-Gen Report", 10, 10);
    pdf.text(analysis.summary, 10, 20);
    pdf.save("report.pdf");
  }

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">

      <Sidebar />

      <main className="flex-1 flex items-center justify-center p-6 overflow-y-auto">

        <div className="bg-gray-900 p-6 w-full max-w-lg rounded-xl border border-gray-700">

          <div className="flex justify-between items-center mb-4 text-white text-sm">
            <span>👤 {profileName}</span>
            <button
              onClick={() => (window.location.href = "/profiles")}
              className="text-blue-400 underline"
            >
              Change
            </button>
          </div>

          <h1 className="text-3xl text-center font-bold text-blue-400 mb-5">
            Med-Gen
          </h1>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-2 mb-3 rounded bg-gray-800 text-white border border-gray-700"
          >
            <option>English</option>
            <option>Hindi</option>
            <option>Hinglish</option>
          </select>

          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFile}
            className="w-full mb-3 text-white"
          />

          <button
            onClick={analyze}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
          >
            Analyze
          </button>

          <p className="text-center text-sm mt-2 text-gray-400">
            {status}
          </p>

          {analysis && (
            <div className="mt-5 space-y-4">

              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <h3 className="text-blue-400 font-semibold mb-1">Summary</h3>
                <p className="text-white">{analysis.summary}</p>
              </div>

              {analysis.observations?.length > 0 && (
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <h3 className="text-blue-400 font-semibold mb-2">
                    Key Observations
                  </h3>
                  <ul className="list-disc pl-5 text-white space-y-1">
                    {analysis.observations.map((x: string, i: number) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <h3 className="text-blue-400 font-semibold mb-1">
                  What this means
                </h3>
                <p className="text-gray-300">{analysis.meaning}</p>
              </div>

              {analysis.questions?.length > 0 && (
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <h3 className="text-blue-400 font-semibold mb-2">
                    Questions for your doctor
                  </h3>
                  <ul className="list-disc pl-5 text-white space-y-1">
                    {analysis.questions.map((x: string, i: number) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.nextSteps?.length > 0 && (
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <h3 className="text-blue-400 font-semibold mb-2">
                    Next Steps
                  </h3>
                  <ul className="list-disc pl-5 text-white space-y-1">
                    {analysis.nextSteps.map((x: string, i: number) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-white">
                Suggested Specialist: {analysis.suggestedSpecialist}
              </div>

              <div className="text-xs text-gray-500">
                ⚠️ {analysis.disclaimer}
              </div>

              <div className="space-y-2">
                <button
                  onClick={saveReport}
                  className="w-full bg-green-600 hover:bg-green-700 py-2 rounded"
                >
                  Save Report
                </button>

                <button
                  onClick={downloadPDF}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded"
                >
                  Download PDF
                </button>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}