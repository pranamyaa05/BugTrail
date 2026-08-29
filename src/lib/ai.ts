import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  // The SDK automatically picks up GEMINI_API_KEY from the environment
});

export async function suggestTriage(title: string, description: string) {
  // If no API key is provided, gracefully fallback to a heuristic
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not set. Using heuristic fallback for triage.");
    return fallbackTriage(title, description);
  }

  try {
    const prompt = `
You are an expert Bug Triage Assistant for the BugTrail issue tracker.
Analyze the following bug report and suggest the Severity, Priority, and a short explanation.

Available Severities: BLOCKER, CRITICAL, MAJOR, NORMAL, MINOR, TRIVIAL
Available Priorities: P1, P2, P3, P4, P5

Bug Title: ${title}
Bug Description: ${description}

Respond ONLY with a valid JSON object matching this schema, without any markdown formatting:
{
  "severity": "...",
  "priority": "...",
  "explanation": "..."
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
  } catch (error) {
    console.error("Gemini AI Triage Error:", error);
  }

  return fallbackTriage(title, description);
}

function fallbackTriage(title: string, description: string) {
  const combined = `${title} ${description}`.toLowerCase();
  
  let severity = "NORMAL";
  let priority = "P3";
  let explanation = "Based on standard keywords, this appears to be a normal issue.";

  if (combined.includes("crash") || combined.includes("panic") || combined.includes("segfault") || combined.includes("data loss")) {
    severity = "CRITICAL";
    priority = "P1";
    explanation = "Mentions of crashes or data loss usually indicate a critical priority issue.";
  } else if (combined.includes("leak") || combined.includes("security") || combined.includes("vulnerability")) {
    severity = "BLOCKER";
    priority = "P1";
    explanation = "Potential security or major performance issues are treated as blockers.";
  } else if (combined.includes("typo") || combined.includes("spelling") || combined.includes("cosmetic")) {
    severity = "TRIVIAL";
    priority = "P5";
    explanation = "Cosmetic issues are typically given trivial severity.";
  }

  return { severity, priority, explanation };
}
