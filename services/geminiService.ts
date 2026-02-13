import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, QuestionType, Difficulty, AISettings } from "../types";

const SETTINGS_KEY = 'aiBrain_settings';

export const getAISettings = (): AISettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) return JSON.parse(stored);
  return {
    provider: 'gemini',
    localEndpoint: 'http://localhost:11434/v1/chat/completions', // Default for Ollama
    localModel: 'llama3',
    apiKey: ''
  };
};

export const saveAISettings = (settings: AISettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

const getGeminiClient = () => {
  const settings = getAISettings();
  // Prioritize user setting, then env var
  const apiKey = settings.apiKey || process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Key not found. Please configure it in Settings or set REACT_APP_GEMINI_API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Helper to sanitize AI Output ---
const sanitizeAnalysisResult = (data: any): AnalysisResult => {
  if (!data) throw new Error("AI returned empty response");
  
  return {
    summary: data.summary || "Analysis completed successfully.",
    trends: Array.isArray(data.trends) ? data.trends : [],
    weakAreas: Array.isArray(data.weakAreas) ? data.weakAreas : [],
    criticalTopics: Array.isArray(data.criticalTopics) ? data.criticalTopics : [],
    studyPlan: Array.isArray(data.studyPlan) ? data.studyPlan : [
        { step: "Review Core Concepts", description: "Focus on the high frequency topics identified in the trends.", duration: "2 Days" }
    ],
    predictions: Array.isArray(data.predictions) ? data.predictions.map((p: any) => ({
       id: p.id || Math.random().toString(36).substr(2, 9),
       question: p.question || "Untitled Question",
       subject: p.subject || "General",
       topic: p.topic || "General",
       type: p.type || QuestionType.THEORY,
       difficulty: p.difficulty || Difficulty.MEDIUM,
       probability: typeof p.probability === 'number' ? p.probability : 50,
       reasoning: p.reasoning || "No reasoning provided.",
       tags: Array.isArray(p.tags) ? p.tags : []
    })) : []
  };
};

// --- Local LLM Helper ---
const callLocalLLM = async (
  prompt: string, 
  files: { name: string; data: string; type: string }[] = [], 
  jsonMode: boolean = false
): Promise<string> => {
  const settings = getAISettings();
  
  const messages: any[] = [
    {
      role: "system",
      content: jsonMode 
        ? "You are a helpful AI. Output strictly valid JSON without any markdown formatting." 
        : "You are a helpful academic assistant."
    }
  ];

  const content: any[] = [{ type: "text", text: prompt }];

  // Process files
  files.forEach(file => {
    if (file.type.startsWith('image/')) {
        // Handle Images
        content.push({
          type: "image_url",
          image_url: {
            url: `data:${file.type};base64,${file.data}`
          }
        });
    } else if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|json|js|jsx|ts|tsx|py|cpp|c|java|html|css|csv)$/i)) {
        // Handle Text Files
        try {
            const textContent = atob(file.data);
            content.push({ 
                type: "text", 
                text: `\n--- START OF FILE ${file.name} ---\n${textContent}\n--- END OF FILE ---\n` 
            });
        } catch (e) {
            console.warn("Failed to decode text file", file.name);
        }
    } else {
        // Fallback for PDFs or others if we can't parse directly in browser without libraries
        content[0].text += `\n[System Note: File "${file.name}" (${file.type}) was excluded as Local LLM only supports Image and Text files directly.]`;
    }
  });

  messages.push({ role: "user", content });

  try {
    const response = await fetch(settings.localEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(settings.apiKey ? { 'Authorization': `Bearer ${settings.apiKey}` } : {})
      },
      body: JSON.stringify({
        model: settings.localModel,
        messages: messages,
        temperature: 0.7,
        stream: false,
        ...(jsonMode ? { format: "json" } : {}) // Ollama supports this
      })
    });

    if (!response.ok) {
      throw new Error(`Local LLM Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("Local LLM Request Failed:", error);
    throw new Error("Failed to connect to Local LLM. Ensure your local server (e.g., Ollama, LM Studio) is running and CORS is enabled.");
  }
};

// --- Main Service Functions ---

export const analyzeDocuments = async (
  files: { name: string; data: string; type: string }[]
): Promise<AnalysisResult> => {
  const settings = getAISettings();
  
  const prompt = `
    You are an expert academic analyst and exam predictor. 
    Analyze the attached exam papers carefully.
    
    Perform the following:
    1. Extract all questions and categorize them.
    2. Analyze the frequency and difficulty trends of topics.
    3. Identify "Critical Topics" that appear almost every year.
    4. Create a "Study Plan" - a 3-5 step actionable roadmap to prepare for the upcoming exam based on these papers.
    5. Predict highly probable questions for the *upcoming* exam based on missing patterns, cyclic trends, and core importance.
    
    Output strictly in valid JSON format matching this schema:
    {
      "summary": "string",
      "trends": [{ "topic": "string", "count": number, "avgDifficulty": number, "yearsAppeared": ["string"] }],
      "weakAreas": ["string"],
      "criticalTopics": ["string"],
      "studyPlan": [{ "step": "string", "description": "string", "duration": "string" }],
      "predictions": [{
         "id": "string",
         "question": "string", 
         "subject": "string", 
         "topic": "string", 
         "type": "Theory" | "Coding" | "MCQ" | "Numerical" | "Case Study", 
         "difficulty": "Easy" | "Medium" | "Hard", 
         "probability": number, 
         "reasoning": "string", 
         "tags": ["string"]
      }]
    }
  `;

  let rawResult: any;

  // --- Gemini Path ---
  if (settings.provider === 'gemini') {
    const ai = getGeminiClient();
    const parts = files.map((file) => ({
      inlineData: {
        mimeType: file.type,
        data: file.data,
      },
    }));

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview", 
        contents: {
          parts: [...parts, { text: prompt }],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              trends: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    count: { type: Type.NUMBER },
                    avgDifficulty: { type: Type.NUMBER },
                    yearsAppeared: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                },
              },
              weakAreas: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              criticalTopics: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              studyPlan: {
                type: Type.ARRAY,
                items: { 
                   type: Type.OBJECT,
                   properties: {
                     step: { type: Type.STRING },
                     description: { type: Type.STRING },
                     duration: { type: Type.STRING }
                   }
                }
              },
              predictions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    subject: { type: Type.STRING },
                    topic: { type: Type.STRING },
                    type: { type: Type.STRING, enum: Object.values(QuestionType) },
                    difficulty: { type: Type.STRING, enum: Object.values(Difficulty) },
                    probability: { type: Type.NUMBER },
                    reasoning: { type: Type.STRING },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                },
              },
            },
            required: ["summary", "trends", "predictions", "criticalTopics", "studyPlan"],
          },
        },
      });

      if (response.text) {
        rawResult = JSON.parse(response.text);
      } else {
        throw new Error("No response text generated");
      }
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      throw error;
    }
  } 
  
  // --- Local LLM Path ---
  else {
    try {
        const resultText = await callLocalLLM(prompt, files, true);
        const jsonStr = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        rawResult = JSON.parse(jsonStr);
    } catch (error) {
        console.error("Local LLM Analysis Error:", error);
        throw error;
    }
  }

  return sanitizeAnalysisResult(rawResult);
};

export const generateSolution = async (question: string): Promise<string> => {
    const settings = getAISettings();
    const prompt = `
      Provide a detailed, expert-level solution for the following exam question.
      
      For Coding Questions:
      1. Provide optimized code in Python or C++.
      2. **Important:** Include a distinct section for "Time Complexity" with Big-O notation and a clear explanation.
      3. **Important:** Include a distinct section for "Space Complexity" with Big-O notation and a clear explanation.
      
      For Theoretical Questions:
      1. Provide key points, diagrams (described in text), and a structured answer.
      
      Question: "${question}"
      
      Output in Markdown format.
    `;
    
    if (settings.provider === 'gemini') {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt
        });
        return response.text || "Could not generate solution.";
    } else {
        return await callLocalLLM(prompt);
    }
};

export const evaluateCode = async (code: string, language: string): Promise<string> => {
  const settings = getAISettings();
  const prompt = `
    Act as a strict ${language} compiler/interpreter.
    Execute the provided code.
    
    Rules:
    1. If the code runs successfully, return ONLY the output (stdout).
    2. If there are errors, return the error message (stderr).
    3. Do not add markdown formatting (no \`\`\`).
    4. Do not explain the code.
    5. Be realistic with execution behavior.

    Code:
    ${code}
  `;
  
  if (settings.provider === 'gemini') {
      const ai = getGeminiClient();
      try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt
        });
        return response.text || "No output.";
      } catch (error) {
        console.error("Execution Error:", error);
        return "Error: Failed to execute code via AI backend.";
      }
  } else {
      return await callLocalLLM(prompt);
  }
};