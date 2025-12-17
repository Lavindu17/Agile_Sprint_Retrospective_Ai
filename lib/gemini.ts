const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
// Using the stable model
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

  // STRICTER PROMPT: Ask 3 distinct questions
  const systemPrompt = `
  You are an Agile Coach interviewing a ${userRole} about: "${sprintContext}".
  
  RULES:
  1. Ask exactly ONE question at a time.
  2. Ask 3 specific questions to uncover the root cause (Process vs Tools vs People).
  3. Keep responses short (under 40 words).
  4. Do NOT give advice yet. Just listen.
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: systemPrompt }] } })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API Error (${response.status}):`, errorText);
      return `Error ${response.status}: ${errorText}`;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm listening...";
  } catch (e: any) { 
    console.error("Gemini Fetch Error:", e);
    return `Connection Error: ${e.message}`; 
  }
};

// 2. INDIVIDUAL SUMMARY
export const generateIndividualSummary = async (chatHistory: any[]) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
  const text = chatHistory.map(m => `${m.role}: ${m.content}`).join("\n");
  const prompt = `Summarize key friction points from this chat anonymously. Return a bulleted list. Text: ${text}`;

  try {
    const response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini Summary API Error (${response.status}):`, errorText);
      return `Error ${response.status}: ${errorText}`;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No issues found.";
  } catch (e: any) { 
    console.error("Gemini Summary Fetch Error:", e);
    return `Summary failed: ${e.message}`; 
  }
};

// 3. FINAL REPORT (Updated for Professional Formatting)
export const generateFinalReport = async (allSummaries: string[]) => {
  if (!API_KEY) return "Error: Missing API Key.";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
  
  const combinedText = allSummaries.join("\n\n---\n\n");

  const prompt = `
  Act as a Senior Technical Program Manager. 
  Here are anonymous feedback notes from the team:
  ${combinedText}

  TASK:
  Generate a Retrospective Report in strict Markdown.
  
  FORMATTING RULES:
  - Do NOT use conversational filler like "Here is the report".
  - Use standard Markdown headers (##) for sections.
  - Use a Markdown Table for the Action Plan.
  
  REQUIRED SECTIONS:
  
  ## Executive Summary
  (2 sentences summarizing the sprint health).

  ## Identified Patterns
  (List 3 bullet points of root causes).

  ## Action Plan
  | Issue | Proposed Solution | Effort |
  | :--- | :--- | :--- |
  | (Fill based on data) | (Be specific) | (Low/Med/High) |

  ## Team Sentiment
  (1 sentence professional analysis).
  `;

  try {
    const response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini Report API Error (${response.status}):`, errorText);
      return `Error ${response.status}: ${errorText}`;
    }

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