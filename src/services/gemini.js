import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSettings } from '../settings.js';

export async function fetchMangaDetails(title) {
    const settings = getSettings();
    const apiKey = settings.geminiApiKey ? settings.geminiApiKey.trim() : '';
    if (!apiKey) {
        throw new Error('API Key mancante. Inseriscila nelle Impostazioni.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Il manga "${title}" se è edito in italia, indicami i seguenti dati in formato JSON valido:
    {
        "description": "Trama (in italiano)",
        "author": "Nome Cognome",
        "publisher": "Editore (in italiano)",
        "target": "Target (Shonen, Seinen, Shojo, Josei, Kodomo)",
        "status": "Stato (Serie in corso, Serie completa, Volume unico)"
    }
    Se non è edito in Italia, cerca comunque le informazioni più accurate possibili traducendole in italiano.
    Rispondi SOLO con il JSON, senza markdown o altro testo.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error(`Errore Gemini: ${error.message || error}\n\nVerifica che la tua API Key sia corretta.`);
    }
}


