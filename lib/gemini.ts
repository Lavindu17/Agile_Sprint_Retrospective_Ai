const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// 🔴 FIX: Use "gemini-1.5-flash-latest" or "gemini-pro" if flash fails
const MODEL_NAME = "gemini-2.0-flash"; 
// 1. CHAT BOT
export const generateAIResponse = async (history: any[], newMessage: string, userRole: string, sprintContext: string) => {
  if (!API_KEY) return "Configuration Error: API Key missing.";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
  
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));
  contents.push({ role: 'user', parts: [{ text: newMessage }] });

  const systemPrompt = `You are an Agile Coach interviewing a ${userRole} about: "${sprintContext}". Validate feelings, ask root cause questions. Keep it short.`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: systemPrompt }] } })
    });
    const data = await response.json();
    
    // Debug log to see if it fails again
    if (data.error) {
      console.error("Gemini Error:", data.error);
      return `Error: ${data.error.message}`;
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm listening...";
  } catch (e) { return "Connection Error."; }
};

// 2. INDIVIDUAL SUMMARY
export const generateIndividualSummary = async (chatHistory: any[]) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
  const text = chatHistory.map(m => `${m.role}: ${m.content}`).join("\n");
  const prompt = `Summarize key friction points from this chat anonymously: ${text}`;

  try {
    const response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No issues found.";
  } catch (e) { return "Summary failed."; }
};

// 3. FINAL REPORT
export const generateFinalReport = async (allSummaries: string[]) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
  
  const combinedText = allSummaries.join("\n\n---\n\n");

  const prompt = `
  You are a Senior Technical Program Manager. 
  Here are anonymous feedback notes from the engineering team:
  ${combinedText}

  TASK:
  1. Identify Patterns (#1 bottleneck).
  2. Create Action Plan (Start, Stop, Continue).
  3. Tone: Professional.
  
  IMPORTANT: Output strictly in Markdown format.
  `;

  try {
    const response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
    });
    
    const data = await response.json();
    
    if (data.error) {
        console.error("Gemini API Error:", data.error);
        return `AI Error: ${data.error.message}`;
    }

    if (!data.candidates) return "AI Generation failed.";

    return data.candidates[0].content.parts[0].text;

  } catch (e: any) { 
    console.error("Network Error:", e);
    return `Report generation failed: ${e.message}`; 
  }
};