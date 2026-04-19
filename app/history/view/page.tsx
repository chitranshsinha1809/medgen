"use client";

import { useEffect, useState } from "react";

export default function ViewReport() {
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem("selectedReport");
    if (data) setReport(JSON.parse(data));
  }, []);

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white">

      <h1 className="text-2xl font-bold text-blue-400 mb-4">
        Report Details
      </h1>

      {/* SUMMARY */}
      <div className="bg-gray-800 p-4 rounded mb-4">
        <h3 className="text-blue-400 font-semibold mb-1">Summary</h3>
        <p>{report.summary}</p>
      </div>

      {/* RISK */}
      <div className={`p-3 rounded text-center font-semibold mb-4 ${
        report.risk === "High"
          ? "bg-red-600"
          : report.risk === "Medium"
          ? "bg-yellow-500 text-black"
          : "bg-green-600"
      }`}>
        Risk: {report.risk}
      </div>

      {/* KEY FINDINGS */}
      <div className="bg-gray-800 p-4 rounded mb-4">
        <h3 className="text-blue-400 font-semibold mb-2">
          Key Findings
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          {(report.keyFindings || []).map((x: string, i: number) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>

      {/* ABNORMAL VALUES */}
      <div className="bg-red-900 p-4 rounded mb-4">
        <h3 className="text-red-400 font-semibold mb-2">
          Abnormal Values
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          {(report.abnormalValues || []).map((x: string, i: number) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>

      {/* RECOMMENDATIONS */}
      <div className="bg-green-900 p-4 rounded mb-4">
        <h3 className="text-green-300 font-semibold mb-2">
          Recommendations
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          {(report.recommendations || []).map((x: string, i: number) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>

      {/* 🔥 ORIGINAL REPORT BUTTON */}
      {report.fileURL && (
        <a
          href={report.fileURL}
          target="_blank"
          className="block bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded mt-4 text-center font-semibold"
        >
          Open Original Report
        </a>
      )}

    </div>
  );
}