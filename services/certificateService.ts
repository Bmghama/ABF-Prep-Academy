
import { jsPDF } from 'jspdf';

export const generateCertificatePDF = (userName: string, sector: string, serial: string) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Background colors
  doc.setFillColor(15, 23, 42); // abf-dark
  doc.rect(0, 0, 297, 210, 'F');

  // Border
  doc.setDrawColor(251, 191, 36); // abf-gold
  doc.setLineWidth(2);
  doc.rect(10, 10, 277, 190);

  // Logo Placeholder
  doc.setTextColor(251, 191, 36);
  doc.setFontSize(30);
  doc.setFont('helvetica', 'bolditalic');
  doc.text('ABF PREP ACADEMY', 148.5, 40, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.text('CERTIFICAT DE RÉUSSITE PROFESSIONNELLE', 148.5, 65, { align: 'center' });

  doc.setFontSize(14);
  doc.text('Ce document atteste que', 148.5, 85, { align: 'center' });

  doc.setTextColor(14, 165, 233); // abf-primary
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text(userName.toUpperCase(), 148.5, 105, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`A validé avec succès le cursus de formation spécialisé en :`, 148.5, 125, { align: 'center' });
  
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(sector.toUpperCase(), 148.5, 140, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Délivré le : ${new Date().toLocaleDateString('fr-FR')}`, 148.5, 160, { align: 'center' });
  doc.text(`N° de série : ${serial}`, 148.5, 168, { align: 'center' });

  // Verification QR
  doc.setDrawColor(255, 255, 255);
  doc.rect(240, 150, 30, 30);
  doc.setFontSize(6);
  doc.text('Scanner pour vérifier', 255, 185, { align: 'center' });

  doc.save(`Certificat_ABF_${userName.replace(/\s/g, '_')}.pdf`);
};

export const generateSerial = () => {
  return 'ABF-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};
