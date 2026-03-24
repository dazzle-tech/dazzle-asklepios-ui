import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

export async function printAppointmentSlip(data) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });

  let y = 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Appointment Slip', 10, y);

  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Patient Name
  doc.text(`Patient: ${data.fullName}`, 10, y);
  y += 7;

  // Date & Time
  doc.text(`Date & Time: ${formatDateTime(data.appointmentDateTime)}`, 10, y);
  y += 7;

  // Facility + Resource
  doc.text(
    `Facility: ${data.facility} - ${data.resourceType} - ${data.resource}`,
    10,
    y
  );
  y += 7;

  // Visit type
  doc.text(`Visit Type: ${data.visitType}`, 10, y);
  y += 7;

  // Contact
  doc.text(`Phone: ${data.phone}`, 10, y);
  y += 5;
  doc.text(`Email: ${data.email}`, 10, y);
  y += 7;

  // Facility phone
  doc.text(`Facility Phone: ${data.facilityPhone}`, 10, y);
  y += 10;

  // ═════════ QR ═════════
  const qr = await QRCode.toDataURL(data.qrCode);
  doc.addImage(qr, 'PNG', 10, y, 30, 30);

  // ═════════ Barcode ═════════
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, data.barcode, {
    format: 'CODE128',
    displayValue: false
  });

  const barcodeImg = canvas.toDataURL('image/png');
  doc.addImage(barcodeImg, 'PNG', 50, y + 10, 100, 20);

  doc.save(`Appointment_${data.fullName}.pdf`);
}