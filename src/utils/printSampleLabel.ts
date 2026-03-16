import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import type { SampleLabelVM } from '@/types/model-types-new'; 

export async function printSampleLabel(vm: SampleLabelVM) {
  const today = new Date().toLocaleDateString('en-GB');
  const sampleDate = vm.sampleDateTime
    ? new Date(vm.sampleDateTime).toLocaleString('en-GB')
    : '';

  const qrValue = `MRN:${vm.mrn};NAME:${vm.patientName};TEST:${vm.testName};SAMPLE_DT:${sampleDate};QTY:${vm.sampleQuantity}${vm.sampleUnit}`;
  const qrData = await QRCode.toDataURL(qrValue);

  const barcodeCanvas = document.createElement('canvas');
  JsBarcode(barcodeCanvas, vm.mrn, {
    format: 'CODE128',
    width: 1.8,
    height: 30,
    displayValue: false
  });
  const barcodeImg = barcodeCanvas.toDataURL('image/png');

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [55, 120]
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Sample Label', 5, 10);
  doc.text(`DATE ${today}`, 55, 10);

  doc.setFont('helvetica', 'normal');
doc.setFontSize(9);
doc.text(vm.facilityName, 55, 15);
  doc.addImage(qrData, 'PNG', 92, 4, 12, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  doc.text(`Patient: ${vm.patientName}`, 5, 18);
  doc.text(`MRN: ${vm.mrn}`, 5, 25);
  doc.text(`Test: ${vm.testName}`, 5, 32);
  doc.text(`Sample: ${sampleDate}`, 5, 39);
  doc.text(`Amount: ${vm.sampleQuantity} ${vm.sampleUnit}`, 5, 46);

  doc.addImage(barcodeImg, 'PNG', 55, 35, 55, 15);

  doc.save(`SampleLabel_${vm.mrn}_${vm.orderTestId}.pdf`);
}