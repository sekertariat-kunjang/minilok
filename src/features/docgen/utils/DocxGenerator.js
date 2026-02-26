import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import JSZipUtils from 'jszip-utils';
import { saveAs } from 'file-saver';

/**
 * Utility to generate DOCX documents from templates.
 */
class DocxGenerator {
    /**
     * Load a binary file from a URL.
     * @param {string} url - URL of the .docx template
     * @returns {Promise<ArrayBuffer>}
     */
    static loadFile(url) {
        return new Promise((resolve, reject) => {
            JSZipUtils.getBinaryContent(url, (error, content) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(content);
                }
            });
        });
    }

    /**
     * Generate and download a DOCX file.
     * @param {string|ArrayBuffer} templateSource - URL path or pre-loaded binary content
     * @param {Object} data - Key-value pairs for replacement
     * @param {string} fileName - Name for the downloaded file
     */
    static async generate(templateSource, data, fileName = 'document.docx') {
        try {
            let content;
            if (typeof templateSource === 'string') {
                console.log('Loading template from URL:', templateSource);
                content = await this.loadFile(templateSource);
            } else {
                console.log('Using pre-loaded binary template content');
                content = templateSource;
            }

            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            // Set the template variables
            doc.setData(data);

            try {
                // Render the document (replace tags)
                doc.render();
            } catch (error) {
                // Catch error (e.g., tags not found or invalid XML)
                console.error('Docxtemplater Render Error:', error);
                const e = {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                    properties: error.properties,
                };
                throw e;
            }

            const out = doc.getZip().generate({
                type: 'blob',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });

            // Trigger download
            saveAs(out, fileName);
            return true;
        } catch (error) {
            console.error('Document Generation Failed:', error);
            throw error;
        }
    }
}

export default DocxGenerator;
