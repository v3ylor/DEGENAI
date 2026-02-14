// This runs on Vercel's Server (Secure)
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // 1. Setup CORS (So your site can talk to this)
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

    // 2. Get the prompt from the frontend
    const { prompt } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'API Key missing on server' });
    }

    try {
        // 3. Call Gemini Securely
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemInstruction = `
            You are DEGEN_AGENT, a chaotic crypto trading AI.
            Reply in valid JSON format ONLY. Do not use Markdown code blocks.
            Structure:
            {
                "action": "BUY", "SELL", "HODL", or "RUG",
                "message": "Short funny phrase (max 15 words) using crypto slang."
            }
        `;

        const result = await model.generateContent(systemInstruction + "\nUser Input: " + prompt);
        const response = await result.response;
        const text = response.text();

        // Clean the response
        const jsonStr = text.replace(/```json|```/g, '').trim();
        
        return res.status(200).json(JSON.parse(jsonStr));

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Agent malfunction' });
    }
}