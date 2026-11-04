import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NurseSummaryReportVM } from '@/types/model-types-new';
import { conjureValueBasedOnKeyFromList, conjureValuesFromEnumList } from '.';

const safe = (v: any) => (v === null || v === undefined || v === '' ? '-' : String(v));

const yesNo = (v: boolean | null | undefined) => {
  if (v === null || v === undefined) return '-';
  return v ? 'Yes' : 'No';
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

export async function printNurseSummaryReport(
  data: NurseSummaryReportVM,
  measurementSiteLov: any[],
  patientConditionsEnum: any[],
  encounterPriorityLov: any[],
  encounterReasonEnum: any[],
  encounterTypeEnum: any[],
  ageGroupEnum: any[],
  EncounterStatusEnum: any[],
  genderEnum: any[]
) {
  const doc = new jsPDF('p', 'mm', 'a4');

  // === LOV resolutions ===
  const measurementSiteName = conjureValueBasedOnKeyFromList(
    measurementSiteLov,
    data?.vitalSigns?.measurementSite,
    'lovDisplayVale'
  );

  const priorityKey =
    encounterPriorityLov?.find((p: any) => p.valueCode === data?.encounterInfo?.priority)?.key ||
    data?.encounterInfo?.priority;

  const priorityDisplay = conjureValueBasedOnKeyFromList(
    encounterPriorityLov,
    priorityKey,
    'lovDisplayVale'
  );

  // === Enum resolutions ===
  const patientConditionsDisplay = conjureValuesFromEnumList(
    patientConditionsEnum,
    data?.observation?.patientConditions ?? '',
    'label'
  );

  const encounterReasonDisplay = conjureValuesFromEnumList(
    encounterReasonEnum,
    data?.encounterInfo?.encounterReason ?? '',
    'label'
  );

  const encounterTypeDisplay = conjureValuesFromEnumList(
    encounterTypeEnum,
    data?.encounterInfo?.encounterType ?? '',
    'label'
  );

  const ageGroupOptions = conjureValuesFromEnumList(
    ageGroupEnum,
    data?.additionalMeasurements?.ageGroup ?? '',
    'label'
  );

  const EncounterStatus = conjureValuesFromEnumList(
    EncounterStatusEnum,
    data?.encounterInfo?.status ?? '',
    'label'
  );

  const gender = conjureValuesFromEnumList(genderEnum, data?.patientInfo?.gender ?? '', 'label');

  let currentY = 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Nurse Summary Report', 14, currentY);

  currentY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generated At: ${formatDateTime(data?.generatedAt)}`, 14, currentY);

  currentY += 6;

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [['Patient Information', 'Value']],
    body: [
      ['Full Name', safe(data?.patientInfo?.fullName)],
      ['MRN', safe(data?.patientInfo?.medicalRecordNumber)],
      ['Date of Birth', formatDate(data?.patientInfo?.dateOfBirth)],
      ['Age', safe(data?.patientInfo?.age)],
      ['Gender', safe(gender)]
    ],
    styles: { fontSize: 9 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [['Encounter Information', 'Value']],
    body: [
      ['Encounter Number', safe(data?.encounterInfo?.encounterNumber)],
      ['Encounter Date', formatDate(data?.encounterInfo?.encounterDate)],
      ['Encounter Type', safe(encounterTypeDisplay)],
      ['Encounter Reason', safe(encounterReasonDisplay)],
      ['Priority', safe(priorityDisplay)],
      ['Status', safe(EncounterStatus)],
      ['Chief Complaint', safe(data?.encounterInfo?.chiefComplaint)],
      ['Facility', safe(data?.encounterInfo?.facilityName)],
      ['Department', safe(data?.encounterInfo?.departmentName)]
    ],
    styles: { fontSize: 9 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [['Observation', 'Value']],
    body: [
      ['Reason Of Visit', safe(data?.observation?.reasonOfVisit)],
      ['Functional Status', safe(data?.observation?.functionalStatus)],
      ['Patient Conditions', safe(patientConditionsDisplay)],
      ['Cognitive Check', safe(data?.observation?.cognitiveCheck)]
    ],
    styles: { fontSize: 9 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [['Vital Signs', 'Value']],
    body: [
      [
        'Blood Pressure',
        `${safe(data?.vitalSigns?.bloodPressureSystolic)} / ${safe(
          data?.vitalSigns?.bloodPressureDiastolic
        )}`
      ],
      ['Measurement Site', safe(measurementSiteName)],
      ['Heart Rate', safe(data?.vitalSigns?.heartRate)],
      ['Temperature', safe(data?.vitalSigns?.temperature)],
      ['Oxygen Saturation', safe(data?.vitalSigns?.oxygenSaturation)],
      ['Respiratory Rate', safe(data?.vitalSigns?.respiratoryRate)],
      ['Notes', safe(data?.vitalSigns?.notes)]
    ],
    styles: { fontSize: 9 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  const rawWeight = Number(data?.bodyMeasurements?.weight);
  const rawHeight = Number(data?.bodyMeasurements?.height);

  const bmi =
    Number.isFinite(rawWeight) && Number.isFinite(rawHeight) && rawHeight > 0
      ? (rawWeight / Math.pow(rawHeight / 100, 2)).toFixed(2)
      : '-';

  const bsa =
    Number.isFinite(rawWeight) && Number.isFinite(rawHeight) && rawHeight > 0
      ? Math.sqrt((rawWeight * rawHeight) / 3600).toFixed(2)
      : '-';

  autoTable(doc, {
  startY: currentY,
  theme: 'grid',
  head: [['Body Measurements', 'Value']],
  body: [
    ['Weight (kg)', safe(data?.bodyMeasurements?.weight)],
    ['Height (cm)', safe(data?.bodyMeasurements?.height)],
    ['Head Circumference (cm)', safe(data?.bodyMeasurements?.headCircumference)],
    ['BMI', bmi],
    ['BSA', bsa]
  ],
  styles: { fontSize: 9 }
});

  currentY = (doc as any).lastAutoTable.finalY + 6;

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [['Additional Measurements', 'Value']],
    body: [
      ['Age Group', safe(ageGroupOptions)],
      ['Hearing Test', safe(data?.additionalMeasurements?.hearingTest)],
      ['Dehydration', yesNo(data?.additionalMeasurements?.dehydration)],
      ['Nasal Flaring', yesNo(data?.additionalMeasurements?.nasalFlaring)],
      ['Response To Light', yesNo(data?.additionalMeasurements?.responseToLight)],
      ['Pupil Response', yesNo(data?.additionalMeasurements?.pupilResponse)],
      ['Ability To Follow Target', yesNo(data?.additionalMeasurements?.abilityToFollowTarget)],
      ['Color Testing', yesNo(data?.additionalMeasurements?.colorTesting)],
      ['Fall Risk', yesNo(data?.additionalMeasurements?.fallRisk)],
      [
        'Vision Problems Affecting Function',
        yesNo(data?.additionalMeasurements?.visionProblemsAffectingFunction)
      ],
      [
        'Hearing Problems Affecting Function',
        yesNo(data?.additionalMeasurements?.hearingProblemsAffectingFunction)
      ],
      ['Details', safe(data?.additionalMeasurements?.details)],
      ['Action To Take', safe(data?.additionalMeasurements?.actionToTake)]
    ],
    styles: { fontSize: 9 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  if (data?.allergies?.length) {
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      head: [
        [
          'Allergen Type',
          'Severity',
          'Criticality',
          'Treatment',
          'Onset',
          'Source',
          'Reactions',
          'Status'
        ]
      ],
      body: data.allergies.map(a => [
        safe(a.allergenType),
        safe(a.severity),
        safe(a.criticality),
        safe(a.treatmentStrategy),
        safe(a.onset),
        safe(a.sourceOfInformation),
        safe(a.allergicReactions),
        safe(a.status)
      ]),
      styles: { fontSize: 8 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  if (data?.warnings?.length) {
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      head: [['Warning Type', 'Warning', 'Severity', 'Action Taken', 'Status']],
      body: data.warnings.map(w => [
        safe(w.warningType),
        safe(w.warning),
        safe(w.severity),
        safe(w.actionTaken),
        safe(w.status)
      ]),
      styles: { fontSize: 8 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  if (data?.vaccinations?.length) {
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      head: [['Vaccine ID', 'Brand ID', 'Dose ID', 'Lot Number', 'Date Administered', 'Status']],
      body: data.vaccinations.map(v => [
        safe(v.vaccineId),
        safe(v.vaccineBrandId),
        safe(v.vaccineDoseId),
        safe(v.vaccineLotNumber),
        formatDate(v.dateAdministered),
        safe(v.status)
      ]),
      styles: { fontSize: 8 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  if (data?.servicesAndProducts?.length) {
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      head: [['Category', 'Service ID', 'Product ID', 'Quantity']],
      body: data.servicesAndProducts.map(s => [
        safe(s.category),
        safe(s.serviceId),
        safe(s.productId),
        safe(s.quantity)
      ]),
      styles: { fontSize: 8 }
    });
  }

  const fileName = `nurse-summary-${
    data?.encounterInfo?.encounterNumber || data?.encounterInfo?.encounterId || 'report'
  }.pdf`;
  doc.save(fileName);
}
