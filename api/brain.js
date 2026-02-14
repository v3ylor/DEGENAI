import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // 1. Setup CORS
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

    // 2. CHECK FOR API KEY (Loaded from Vercel Settings, not a local file)
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Server Error: API Key missing in Vercel Settings' });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // 3. USE YOUR SPECIFIC MODEL (From your list)
        // We use "gemini-2.5-flash" because it is in your access list.
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
        console.error("Gemini Error:", error);
        // If 2.5 fails, this error log will appear in Vercel
        return res.status(500).json({ error: 'Agent malfunction' });
    }
}