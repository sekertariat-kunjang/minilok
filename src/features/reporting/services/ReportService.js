import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPDF = async (elementId, filename) => {
    const mainElement = document.getElementById(elementId);
    if (!mainElement) return;

    try {
        const sections = mainElement.getElementsByClassName('report-section');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10; // 10mm margin
        const contentWidth = pdfWidth - (2 * margin);

        let currentY = margin;

        for (let i = 0; i < sections.length; i++) {
            const canvas = await html2canvas(sections[i], {
                scale: 2,
                useCORS: true,
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const imgHeightInPdf = (canvas.height * contentWidth) / canvas.width;

            // Check if section fits on current page
            if (currentY + imgHeightInPdf > pdfHeight - margin) {
                pdf.addPage();
                currentY = margin;
            }

            pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, imgHeightInPdf);
            currentY += imgHeightInPdf + 10; // Space between sections
        }

        pdf.save(filename);
    } catch (error) {
        console.error('PDF Export Error:', error);
        alert('Gagal mengekspor PDF: ' + error.message);
    }
};

export const exportSlidesToPDF = async (containerClassName, filename) => {
    const elements = document.getElementsByClassName(containerClassName);
    console.log('Slides found:', elements.length);

    if (!elements || elements.length === 0) {
        alert('Gagal: Tidak ada slide yang ditemukan. Pastikan data sudah termuat sempurna di Dashboard.');
        return;
    }

    try {
        const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape A4
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < elements.length; i++) {
            if (i > 0) pdf.addPage();

            const canvas = await html2canvas(elements[i], {
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: 1200,
            });

            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }

        pdf.save(filename);
        alert('Slide berhasil dibuat dan didownload!');
    } catch (error) {
        console.error('Slide Export Error:', error);
        alert('Error saat membuat slide: ' + error.message);
    }
};
