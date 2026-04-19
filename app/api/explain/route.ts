import { NextResponse } from "next/server";

export async function POST(req: Request) {

  try {

    const { text, lang } = await req.json();

    const prompt = `
You are a medical AI assistant.

Analyze the following medical report.

Return ONLY valid JSON in this format:

{
  "summary": "Short clear summary",
  "risk": "Low | Medium | High",
  "keyFindings": ["Finding 1", "Finding 2"],
  "abnormalValues": ["Abnormal 1", "Abnormal 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "suggestedSpecialist": "Specialist type"
}

Language: ${lang}

Medical Report:
${text}
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

    const raw = data.response;

    // 🔥 extract JSON properly
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const content = jsonMatch ? jsonMatch[0] : raw;

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        summary: raw || "AI response unclear.",
        risk: "Medium",
        keyFindings: [],
        abnormalValues: [],
        recommendations: [],
        suggestedSpecialist: "General Physician",
      };
    }

    return NextResponse.json(parsed);

  } catch (error) {

    console.error("OLLAMA ERROR:", error);

    return NextResponse.json({
      summary: "Local AI failed.",
      risk: "Medium",
      keyFindings: [],
      abnormalValues: [],
      recommendations: [],
      suggestedSpecialist: "General Physician",
    });

  }

}