const API_URL = import.meta.env.VITE_DOCGEN_API_URL || 'http://localhost:8000';

class DocGenService {
    /**
     * List all available templates on the server
     */
    async listTemplates() {
        try {
            const response = await fetch(`${API_URL}/templates`);
            if (!response.ok) throw new Error('Failed to fetch templates');
            const data = await response.json();
            return data.templates;
        } catch (error) {
            console.error('DocGenService Error:', error);
            return [];
        }
    }

    /**
     * Upload a new .docx template to the server
     * @param {File} file - The .docx file object
     */
    async uploadTemplate(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL}/upload-template`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to upload template');
            }

            return await response.json();
        } catch (error) {
            console.error('DocGenService Error:', error);
            throw error;
        }
    }

    /**
     * Get all variables (placeholders) defined in a template
     * @param {string} templateName 
     */
    async getTemplateVariables(templateName) {
        try {
            const response = await fetch(`${API_URL}/get-template-variables/${templateName}`);
            if (!response.ok) throw new Error('Failed to fetch template variables');
            const data = await response.json();
            return data.variables || [];
        } catch (error) {
            console.error('DocGenService Error:', error);
            return [];
        }
    }

    /**
     * Generate and download a document from the Python FastAPI service
     * @param {string} templateName - Name of the template (e.g., 'sk_sample', 'sop_template')
     * @param {object} data - Data to fill into the template
     */
    async generateDocument(templateName, data) {
        try {
            const response = await fetch(`${API_URL}/generate-docx`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    template_name: templateName,
                    data: data
                }),
            });

            if (!response.ok) {
                // Try to get detailed error from FastAPI
                let errorMessage = 'Failed to generate document';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorMessage;
                } catch (e) {
                    // Fallback if not JSON
                }
                throw new Error(errorMessage);
            }

            // Get the blob from the response
            const blob = await response.blob();

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Create a temporary link and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${templateName}_${Date.now()}.docx`);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            return { success: true };
        } catch (error) {
            console.error('DocGenService Error:', error);
            throw error;
        }
    }
    /**
     * Get a sample data structure for template mapping
     */
    async getSampleData() {
        try {
            const response = await fetch(`${API_URL}/sample-data`);
            if (!response.ok) throw new Error('Failed to fetch sample data');
            return await response.json();
        } catch (error) {
            console.error('DocGenService Error:', error);
            return {};
        }
    }
}

export const docGenService = new DocGenService();
export default docGenService;
