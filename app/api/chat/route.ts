import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, reports, conversation } = await req.json();

    const reportSummary = reports?.length
      ? reports.map((r: any, i: number) => `
Report ${i + 1}:
Summary: ${r.summary}
Findings: ${(r.keyFindings || []).join(", ")}
`).join("\n")
      : "No reports available";

    const prompt = `
You are an AI health assistant.

User question:
${message}

User medical reports:
${reportSummary}

Instructions:
- Base your answer on the reports
- Be simple and practical
- Do NOT diagnose
- Give helpful suggestions
- Keep answer under 120 words
`;

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3",
        prompt,
        stream: false,
      }),
    });

    const data = await response.json();

    return NextResponse.json({
      reply: data.response || "No response",
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({
      reply: "Error connecting to AI",
    });
  }
}