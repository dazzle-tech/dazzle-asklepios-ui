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

const DICTIONARY_COLLECTIONS = [
  'databases',
  'dataSources',
  'variables',
  'resources',
  'relations',
  'businessObjects',
  'userFunctions',
] as const;

/** Stimulsoft DictionaryHelper calls `databases.list.forEach` and crashes if list is missing. */
export const ensureDictionaryCollections = (report: any) => {
  const dictionary = report?.dictionary;
  if (!dictionary) return;
  DICTIONARY_COLLECTIONS.forEach(name => {
    const collection = dictionary[name];
    if (!collection || Array.isArray(collection.list)) return;
    try {
      collection.list = [];
    } catch {
      // some Stimulsoft collections expose list as a read-only getter
    }
  });
};

const collectionCount = (collection: any) =>
  Number(collection?.list?.length ?? collection?.count ?? 0) || 0;

export const reportHasDictionaryData = (report: any) => {
  const dictionary = report?.dictionary;
  if (!dictionary) return false;
  return (
    collectionCount(dictionary.dataSources) > 0 ||
    collectionCount(dictionary.databases) > 0
  );
};

export const syncReportDictionary = (report: any) => {
  if (!report?.dictionary) return;
  ensureDictionaryCollections(report);
  try {
    const result = report.dictionary.synchronize?.();
    if (result && typeof result.catch === 'function') {
      result.catch(() => undefined);
    }
  } catch {
    // some Stimulsoft builds throw when the dictionary is still empty
  }
};

export const registerSchemaOnReport = (
  Stimulsoft: any,
  report: any,
  schema: DesignerSchema
) => {
  if (!Stimulsoft || !report || !schema) return;
  ensureDictionaryCollections(report);
  const dataSet = new Stimulsoft.System.Data.DataSet('ReportData');
  dataSet.readJson(schema);
  report.regData('ReportData', 'ReportData', dataSet, true);
  syncReportDictionary(report);
};

/** Sample schema only when the template has no databases/data sources yet. */
export const applyDesignerSchema = (
  Stimulsoft: any,
  report: any,
  schema: DesignerSchema
) => {
  if (!report) return;
  ensureDictionaryCollections(report);
  if (reportHasDictionaryData(report)) {
    syncReportDictionary(report);
    return;
  }
  registerSchemaOnReport(Stimulsoft, report, schema);
};
