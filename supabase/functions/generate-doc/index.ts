// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { prompt, docType, metadata } = await req.json()

        // @ts-ignore: Deno is available in Supabase Edge Functions
        const apiKey = Deno.env.get('SUMOPOD_API_KEY')
        // @ts-ignore: Deno is available in Supabase Edge Functions
        const baseURL = Deno.env.get('SUMOPOD_BASE_URL') || 'https://ai.sumopod.com/v1'

        if (!apiKey) {
            throw new Error('SUMOPOD_API_KEY is not set')
        }

        const systemPrompt = `
                Anda adalah asisten ahli administrasi Puskesmas yang ahli dalam tata naskah dinas.
                Tugas Anda adalah men-generate data struktur dokumen dalam format JSON untuk ${docType.toUpperCase()}.
                
                Metadata Puskesmas:
                - Nama: ${metadata.nama_puskesmas}
                - Kepala: ${metadata.kepala_puskesmas}
                - NIP Kepala: ${metadata.nip_kepala}
                
                Schema JSON yang HARUS dikembalikan:
                {
                    "judul": "Judul dokumen lengkap",
                    "pengertian": "Definisi singkat",
                    "tujuan": "Tujuan dari dokumen ini",
                    "kebijakan": "Kaitan dengan SK atau aturan",
                    "prosedur": ["langkah 1", "langkah 2", ...],
                    "unit_terkait": "Daftar unit dipisah koma",
                    "pengusul": "Unit/Jabatan pengusul",
                    "flowchart": "Kode Mermaid.js (graph TD; ...)",
                    ${docType === 'sk' ? '"nomor_sk": "no sk", "tanggal_sk": "tgl sk",' : ''}
                    "catatan": "informasi tambahan jika perlu"
                }

                Output harus BERSIH dalam format JSON saja, tanpa markdown code block.
            `;

        const response = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            }),
        })

        const data = await response.json()

        // Check for AI errors
        if (data.error) {
            throw new Error(data.error.message || 'AI Generation failed')
        }

        const content = JSON.parse(data.choices[0].message.content)

        return new Response(JSON.stringify(content), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
