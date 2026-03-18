import jsPDF from 'jspdf';
import type { PatientInformationReportVM } from '@/types/model-types-new';

export async function printPatientInformationReport(vm: PatientInformationReportVM) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Patient Information Report', 20, 20);

  doc.setFontSize(12);

  let y = 40;

  const row = (label: string, value?: string | number) => {
    doc.text(`${label}: ${value ?? '-'}`, 20, y);
    y += 8;
  };

  doc.setFont(undefined, 'bold');
  doc.text('Patient Identification', 20, y);
  y += 10;
  doc.setFont(undefined, 'normal');

  row('Full Name', vm.fullName);
  row('MRN', vm.mrn);
  row('Date of Birth', vm.dateOfBirth);
  row('Age', vm.age);
  row('Gender', vm.gender);

  y += 6;

  doc.setFont(undefined, 'bold');
  doc.text('Patient Documents', 20, y);
  y += 10;
  doc.setFont(undefined, 'normal');

  row('Document Type', vm.documentType);
  row('Document Number', vm.documentNumber);

  y += 6;

  doc.setFont(undefined, 'bold');
  doc.text('Contact Information', 20, y);
  y += 10;
  doc.setFont(undefined, 'normal');

  row('Mobile Number', vm.mobileNumber);
  row('Secondary Phone', vm.secondaryPhone);
  row('Email', vm.email);
  row('Location', vm.city);

  y += 6;

  doc.setFont(undefined, 'bold');
  doc.text('Emergency Contact', 20, y);
  y += 10;
  doc.setFont(undefined, 'normal');

  row('Name', vm.emergencyName);
  row('Relationship', vm.emergencyRelationship);
  row('Phone', vm.emergencyPhone);

  y += 6;

  doc.setFont(undefined, 'bold');
  doc.text('Administrative Information', 20, y);
  y += 10;
  doc.setFont(undefined, 'normal');

  row('Registration Date', vm.registrationDate);
  row('Insurance Provider', vm.insuranceProvider);
  row('Policy Number', vm.policyNumber);

  y += 6;

  doc.setFont(undefined, 'bold');
  doc.text('Primary Care Information', 20, y);
  y += 10;
  doc.setFont(undefined, 'normal');

  row('Preferred Health Professional', vm.preferredHealthProfessional);

  doc.save(`PatientInformation_${vm.mrn}.pdf`);
}
