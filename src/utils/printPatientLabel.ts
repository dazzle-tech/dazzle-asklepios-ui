import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import type { PatientLabelVM } from '@/types/model-types-new';

export async function printPatientLabel(vm: PatientLabelVM) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [55, 120]
  });

  const dob = vm.dateOfBirth ? new Date(vm.dateOfBirth).toLocaleDateString('en-GB') : '';

  const regDate = vm.registrationDate
    ? new Date(vm.registrationDate).toLocaleDateString('en-GB')
    : '';

  const qrValue = `MRN:${vm.mrn};NAME:${vm.patientFullName}`;

  const qrData = await QRCode.toDataURL(qrValue);

  const canvas = document.createElement('canvas');

  JsBarcode(canvas, vm.mrn, {
    format: 'CODE128',
    width: 2,
    height: 30,
    displayValue: false
  });

  const barcode = canvas.toDataURL('image/png');

  doc.setFontSize(12);
  doc.text('Patient Label', 5, 10);

  doc.setFontSize(10);

  doc.text(`Name: ${vm.patientFullName}`, 5, 18);
  doc.text(`MRN: ${vm.mrn}`, 5, 25);
  doc.text(`DOB: ${dob}`, 5, 32);
  doc.text(`Age: ${vm.age}`, 5, 39);
  doc.text(`Gender: ${vm.gender}`, 5, 46);
  doc.text(`Registered: ${regDate}`, 5, 53);

  doc.addImage(qrData, 'PNG', 90, 5, 15, 15);

  doc.addImage(barcode, 'PNG', 55, 35, 55, 18);

  doc.save(`PatientLabel_${vm.mrn}.pdf`);
}
