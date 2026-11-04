import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

export async function printPatientWristband(data) {
  const formatDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString();
  };

  const formatDateTime = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleString();
  };

  const calculateAge = (d: string) => {
    if (!d) return '';
    return new Date().getFullYear() - new Date(d).getFullYear();
  };

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [40, 200] // ارتفاع 40mm — كافي لـ 6 أسطر
  });

  const pageW = 200;
  const pageH = 40;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, 'F');

  // ═══════════════════════════════════════
  // 1) QR — أقصى اليسار، مربع كامل
  // ═══════════════════════════════════════
  const qr = await QRCode.toDataURL(data.qrCode, { width: 200, margin: 1 });
  doc.addImage(qr, 'PNG', 2, 2, 30, 30);

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(34, 1, 34, pageH - 1);

  // ═══════════════════════════════════════
  // 2) النصوص — الوسط (6 أسطر مريحة)
  // ═══════════════════════════════════════
  const x = 37;

  // السطر 1 — MRN (رمادي صغير)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(90, 90, 90);
  doc.text(`MRN: ${data.mrn}`, x, 6);

  // السطر 2 — الاسم كبير وبولد
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const parts = (data.fullName || '').trim().split(' ');
  const last = parts[parts.length - 1].toUpperCase();
  const first = parts.slice(0, -1).join(' ').toUpperCase();
  const name = first && last ? `${last}, ${first}` : (data.fullName || '').toUpperCase();
  doc.text(name, x, 13);

  // السطر 3 — DOB + Age + Gender + Blood على سطر واحد
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(20, 20, 20);
  const dob = formatDate(data.dateOfBirth);
  const age = calculateAge(data.dateOfBirth);
  doc.text(`DOB: ${dob} (${age} yrs)   Gender: ${data.gender}   Blood: ${data.bloodGroup}`, x, 19);

  // السطر 4 — Admission
  doc.setFontSize(6.5);
  doc.setTextColor(50, 50, 50);
  doc.text(`Adm: ${formatDateTime(data.admissionDateTime)}`, x, 24);

  // السطر 5 — Facility
  doc.text(data.facilityName || '-', x, 28.5);

  // السطر 6 — Allergy (أحمر لو في حساسية، رمادي لو لا)
  const hasAllergy = data.allergyAlert && data.allergyAlert !== 'No Allergy';
  doc.setFont('helvetica', hasAllergy ? 'bold' : 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(hasAllergy ? 180 : 80, 0, 0);
  doc.text(`Allergy: ${data.allergyAlert}`, x, 33);

  // ═══════════════════════════════════════
  // 3) Barcode عمودي — أقصى اليمين
  // ═══════════════════════════════════════
  const barcodeCanvas = document.createElement('canvas');
  JsBarcode(barcodeCanvas, data.barcode, {
    format: 'CODE128',
    width: 1.5,
    height: 90,
    displayValue: false,
    margin: 2
  });

  const rotated = document.createElement('canvas');
  rotated.width = barcodeCanvas.height;
  rotated.height = barcodeCanvas.width;
  const ctx = rotated.getContext('2d');
  ctx.translate(rotated.width / 2, rotated.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(barcodeCanvas, -barcodeCanvas.width / 2, -barcodeCanvas.height / 2);

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(pageW - 16, 1, pageW - 16, pageH - 1);
  doc.addImage(rotated.toDataURL('image/png'), 'PNG', pageW - 15, 1, 14, pageH - 2);

  doc.save(`Wristband_${data.mrn}.pdf`);
}
