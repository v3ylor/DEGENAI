import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // CORS Setup
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { prompt } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Server Error: API Key missing' });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // --- HERE IS THE PERSONALITY CHANGE ---
        const systemInstruction = `
            You are Gemini, a helpful, intelligent, and polite AI assistant.
            You are NO LONGER a crypto degen. 
            
            IMPORTANT: You must still reply in valid JSON format for the website to display it.
            
            Structure:
            {
                "action": "ASSIST", 
                "message": "Your helpful answer here (keep it concise, under 50 words)."
            }
        `;

        const result = await model.generateContent(systemInstruction + "\nUser Input: " + prompt);
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json|```/g, '').trim();
        
        return res.status(200).json(JSON.parse(jsonStr));

    } catch (error) {
        console.error("Gemini Error:", error);
        return res.status(500).json({ error: 'Agent malfunction' });
    }
}