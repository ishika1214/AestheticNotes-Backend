import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

const envFile = process.env.NODE_ENV === "production" ? ".env.prod" : ".env.local";
dotenv.config({ path: envFile });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Embedding Error:", error);
    return [];
  }
};

const cleanAIResponse = (text: string) => {
  // Remove markdown code blocks and any leading/trailing backticks
  let cleaned = text.replace(/```[a-z]*\s*([\s\S]*?)\s*```/gi, '$1');
  cleaned = cleaned.replace(/```/g, '').trim();
  return cleaned;
};

const extractJSON = (text: string) => {
  console.log("--- RAW AI RESPONSE ---", text);
  try {
    // Strategy 1: Find the first '{' and last '}'
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start !== -1 && end !== -1) {
      const candidate = text.substring(start, end + 1);
      const parsed = JSON.parse(candidate);
      console.log("--- PARSED JSON SUCCESS ---");
      return parsed;
    }
    
    // Strategy 2: Clean and try (for simple strings or non-braced responses)
    return cleanAIResponse(text);
  } catch (e) {
    console.error("--- JSON PARSE FAILED, FALLING BACK TO CLEANED STRING ---");
    return cleanAIResponse(text);
  }
};

export const summarizeNote = async (content: string) => {
  const prompt = `
    Summarize the following note content. 
    Provide:
    1. A concise summary (max 3 sentences).
    2. 3-5 key points.
    3. Action items (if any).
    
    Format the response as JSON with keys: "summary", "keyPoints" (array), "actionItems" (array).
    
    IMPORTANT: Return ONLY the JSON object. Do not include markdown code blocks (like \`\`\`json), backticks, or any other text before or after the JSON.
    
    Content: ${content}
  `;

  const result = await model.generateContent(prompt);
  return extractJSON(result.response.text());
};

export const generateTitle = async (content: string) => {
  const prompt = `
    Based on the following note content, generate a short, catchy, and meaningful title (max 6 words).
    Return ONLY the title string, no quotes or prefix.
    
    IMPORTANT: Return ONLY the title string. Do not use markdown code blocks or backticks.
    
    Content: ${content}
  `;

  const result = await model.generateContent(prompt);
  return cleanAIResponse(result.response.text());
};

export const generateTags = async (content: string) => {
  const prompt = `
    Analyze the following note content and suggest 3-7 relevant tags.
    Return ONLY a comma-separated list of tags (no hashtags).
    
    IMPORTANT: Return ONLY the tags. Do not use markdown code blocks or backticks.
    
    Content: ${content}
  `;

  const result = await model.generateContent(prompt);
  const text = cleanAIResponse(result.response.text());
  return text.split(',').map(tag => tag.trim());
};

export const cleanupFormatting = async (content: string) => {
  const prompt = `
    Take the following raw note content and:
    1. Fix grammar and spelling.
    2. Add proper headings where appropriate.
    3. Use bullet points for lists.
    4. Maintain the original meaning perfectly.
    
    Return the formatted HTML content.
    
    IMPORTANT: Return ONLY the HTML. Do not use markdown code blocks or backticks.
    
    Content: ${content}
  `;

  const result = await model.generateContent(prompt);
  return cleanAIResponse(result.response.text());
};

export const rewriteNote = async (content: string, mode: 'professional' | 'shorter' | 'cleaner' | 'bullets' | 'tasks') => {
  const modes = {
    professional: "Rewrite this to be more professional and formal.",
    shorter: "Make this content significantly more concise and brief.",
    cleaner: "Clean up the structure and flow of this text.",
    bullets: "Convert this information into a clear bulleted list.",
    tasks: "Extract all actionable tasks from this text and present them as a checklist."
  };

  const prompt = `
    ${modes[mode]}
    Maintain the core message.
    Return the result in HTML format.
    
    IMPORTANT: Return ONLY the result. Do not use markdown code blocks or backticks.
    
    Content: ${content}
  `;

  const result = await model.generateContent(prompt);
  return cleanAIResponse(result.response.text());
};

export const extractTasks = async (content: string) => {
  return rewriteNote(content, 'tasks');
};

export const extractReminders = async (content: string) => {
  const prompt = `
    Detect any specific dates, times, or deadlines in the following note.
    Format the response as a JSON array of objects with keys: "text" (the reminder description) and "date" (ISO 8601 string). 
    If no dates are found, return an empty array [].
    
    IMPORTANT: Return ONLY the JSON. Do not use markdown code blocks or backticks.
    
    Content: ${content}
  `;

  const result = await model.generateContent(prompt);
  return extractJSON(result.response.text());
};

export const generateDiagram = async (content: string, type: 'flowchart' | 'sequence' = 'flowchart') => {
  const prompt = `
    Convert the following note content into a Mermaid.js ${type}.
    Return ONLY the diagram code, no "mermaid" prefix or markdown blocks.
    
    IMPORTANT: Return ONLY the diagram code. Do not use markdown code blocks or backticks.
    
    Content: ${content}
  `;

  const result = await model.generateContent(prompt);
  return cleanAIResponse(result.response.text());
};

export const cosineSimilarity = (vecA: number[], vecB: number[]) => {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magA * magB);
};

export const chatWithNotes = async (
  query: string, 
  history: { role: 'user' | 'model', content: string }[], 
  contextNotes: { title: string, content: string }[]
) => {
  const contextString = contextNotes
    .map(n => `Title: ${n.title}\nContent: ${n.content}`)
    .join('\n\n---\n\n');

  const systemPrompt = `
    You are an intelligent AI Assistant for "Aesthetic Notes".
    Your goal is to help the user manage their thoughts and projects.
    
    Below are the most relevant notes retrieved from the user's notebook for this query:
    ${contextString}
    
    Instruction:
    1. Answer the user's question based ONLY on the provided notes and the conversation history.
    2. If the notes don't contain the answer, say "I don't have enough information in your notes to answer that."
    3. Keep the tone professional, helpful, and "Aesthetic".
    4. You can reference specific notes by their title.
  `;

  const chat = model.startChat({
    history: history.map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.content }],
    })),
  });

  const fullPrompt = `${systemPrompt}\n\nUser Query: ${query}`;
  const result = await chat.sendMessage(fullPrompt);
  return result.response.text();
};
