/**
 * Small JSON dictionaries for the designer only.
 * The browser never talks to PostgreSQL — live patient data is filled
 * server-side by ReportDataService when a user prints a PDF.
 */
export type DesignerSchema = Record<string, unknown[]>;

const PATIENT_ENCOUNTER_SCHEMA: DesignerSchema = {
  PatientEncounter: [
    {
      departmentName: 'Emergency',
      encounterDate: '2026-01-01',
      encounterReason: 'Consultation',
      status: 'PENDING_PAYMENT',
      encounterType: 'OUTPATIENT',
    },
  ],
};

const VISIT_REPORT_SCHEMA: DesignerSchema = {
  Patient: [
    {
      id: 0,
      mrn: 'MRN-0000',
      fullName: 'Sample Patient',
      dateOfBirth: '1990-01-01',
      gender: 'MALE',
      nationalId: '',
      phone: '',
    },
  ],
  Encounter: [
    {
      id: 0,
      patientId: 0,
      encounterDate: '2026-01-01',
      departmentName: 'Clinic',
      encounterType: 'OUTPATIENT',
      status: 'IN_PROGRESS',
      chiefComplaint: '',
      encounterReason: '',
    },
  ],
  Facility: [
    {
      name: 'Facility',
      address: '',
      phone: '',
    },
  ],
};

const DEFAULT_SCHEMA: DesignerSchema = {
  ...VISIT_REPORT_SCHEMA,
  ...PATIENT_ENCOUNTER_SCHEMA,
};

const SCHEMA_BY_CODE: Record<string, DesignerSchema> = {
  PATIENT_ENCOUNTER: PATIENT_ENCOUNTER_SCHEMA,
  VISIT_REPORT: VISIT_REPORT_SCHEMA,
  DEFAULT: DEFAULT_SCHEMA,
};

export const getLocalDesignerSchema = (code?: string): DesignerSchema => {
  if (!code) return DEFAULT_SCHEMA;
  return SCHEMA_BY_CODE[code] ?? DEFAULT_SCHEMA;
};

export const registerSchemaOnReport = (
  Stimulsoft: any,
  report: any,
  schema: DesignerSchema
) => {
  const dataSet = new Stimulsoft.System.Data.DataSet('ReportData');
  dataSet.readJson(schema);
  report.regData('ReportData', 'ReportData', dataSet);
  if (report.dictionary?.synchronize) {
    report.dictionary.synchronize();
  }
};
