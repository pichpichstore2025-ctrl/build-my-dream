
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportToPdf = async (receiptId: string, transactionId: string) => {
  const receiptElement = document.getElementById(receiptId);
  if (!receiptElement) {
    console.error('Receipt element not found!');
    return;
  }

  // 1. Clone the node
  const clone = receiptElement.cloneNode(true) as HTMLElement;

  // 2. Style and append to body to be rendered off-screen
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0px';
  clone.style.width = '80mm'; // Set a fixed width
  clone.style.height = 'auto'; // Let height be automatic
  document.body.appendChild(clone);


  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    
    // PDF dimensions
    const pdfWidth = 80; // 80mm for thermal printers
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const pdfHeight = pdfWidth / ratio;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`receipt-${transactionId}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    // 4. Remove the clone from the body
    document.body.removeChild(clone);
  }
};
