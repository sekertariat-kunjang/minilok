import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPDF = async (elementId, filename) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
    });

    const imgData = canvas.toDataURL('image/png');

    // A4 width in mm is 210
    const pdfWidth = 210;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    // Initialize jsPDF with a custom format: single page with exact height needed
    const pdf = new jsPDF('p', 'mm', [pdfWidth, imgHeight]);

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
    pdf.save(filename);
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
