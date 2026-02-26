import { supabase } from '../../../core/supabase';

class AIService {
    /**
     * Generate structured document content based on prompt and type via Supabase Edge Function.
     * This protects the API Key by keeping it on the server-side.
     * @param {string} prompt - User instruction
     * @param {string} docType - sop, sk, or kak
     * @param {Object} metadata - Global metadata (office names, etc)
     * @returns {Promise<Object>}
     */
    static async generateDocument(prompt, docType, metadata) {
        try {
            const { data, error } = await supabase.functions.invoke('generate-doc', {
                body: { prompt, docType, metadata }
            });

            if (error) {
                console.error('Edge Function Invocation Error:', error);
                throw error;
            }

            // The edge function returns the parsed JSON object directly
            return data;
        } catch (error) {
            console.error('AI Generation Error:', error);
            throw error;
        }
    }
}

export default AIService;
