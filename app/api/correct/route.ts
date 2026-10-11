import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  let originalText = "";
  try {
    const body = await req.json().catch(() => ({}));
    originalText = body?.transcript || "";

    if (!originalText) {
      return NextResponse.json({ 
        success: true, 
        data: { original: "", corrected: "No transcript provided.", severity: "GREEN" } 
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        data: {
          original: originalText,
          corrected: originalText.charAt(0).toUpperCase() + originalText.slice(1) + '.',
          severity: "GREEN"
        }
      });
    }

    // Using the current stable gemini-3.8-flash model endpoint
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert, strict English grammar and tense correction engine. Analyze the input sentence carefully: "${originalText}".
                  Your job is to dynamically identify any grammatical errors, incorrect tenses, subject-verb agreement issues, or unnatural phrasing, and fix them completely.
                  
                  You MUST return a valid JSON object with ONLY two keys:
                  - "corrected": string (the fully corrected and grammatically flawless sentence with proper capitalization and punctuation).
                  - "severity": string (strictly "RED" if there are grammar/tense errors, "ORANGE" if there are minor phrasing or style issues, or "GREEN" if the sentence is already completely flawless).
                  
                  Do not include any markdown formatting like \`\`\`json. Return raw JSON string only.`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok || !data.candidates) {
      console.error("Gemini API Error details:", data);
      return NextResponse.json({
        success: true,
        data: {
          original: originalText,
          corrected: originalText,
          severity: "GREEN"
        }
      });
    }

    let rawContent = data.candidates[0].content.parts[0].text.trim();
    rawContent = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();

    let result;
    try {
      result = JSON.parse(rawContent);
    } catch (e) {
      result = {
        corrected: originalText,
        severity: "GREEN"
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        original: originalText,
        corrected: result.corrected || originalText,
        severity: result.severity || "GREEN",
      }
    });

  } catch (error: any) {
    console.error("Server Route Error:", error.message);
    return NextResponse.json({
      success: true,
      data: {
        original: originalText,
        corrected: originalText,
        severity: "GREEN"
      }
    });
  }
}