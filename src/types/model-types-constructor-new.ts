import { tr } from 'date-fns/locale';
import * as modelTypes from './model-types-new';
// ------------------- ApUser -------------------
export const newApUser: modelTypes.ApUser = {
  id: undefined,
  login: '',
  passwordHash: '',
  firstName: null,
  lastName: null,
  email: null,
  imageUrl: null,
  activated: false,
  langKey: null,
  resetKey: null,
  createdBy: '',
  createdDate: null,
  resetDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null,
  phoneNumber: null,
  birthDate: null,
  gender: null,
  jobDescription: null,
  jobRole: null,
  admin: false
};

// ------------------- Candidate -------------------
export const newCandidate: modelTypes.Candidate = {
  id: undefined,
  rule: '',
  fields: {},
  isActive: true
};

export const newDepartment: modelTypes.Department = {
  id: 0,
  facilityId: '',
  name: '',
  createdBy: '',
  createdDate: 0,
  lastModifiedBy: '',
  lastModifiedDate: 0,
  departmentType: '',
  appointable: false,
  departmentCode: '',
  phoneNumber: '',
  email: '',
  encounterType: '',
  isActive: true,
  hasMedicalSheets: false,
  hasNurseMedicalSheets: false,
  parallelCapacityValue: 1,
  defaultDurationMinutes: undefined,
  defaultBufferBeforeMinutes: 0,
  defaultBufferAfterMinutes: 0,
  parallelCapacityEnabled: false,
  requirePractitioner: false,
  requireBilling: false,
  requirePreAssessment: false
};
// ------------------- Facility -------------------
export const newFacility: modelTypes.Facility = {
  id: undefined,
  name: '',
  code: '',
  emailAddress: '',
  phone1: '',
  phone2: '',
  fax: '',
  addressId: '',
  type: '',
  defaultCurrency: '',
  isActive: true,
  ruleId: null,
  workingDays: [],
  timeZone: '',
};

// ------------------- Create Facility -------------------
export const newCreateFacility: modelTypes.CreateFacility = {
  name: '',
  code: '',
  emailAddress: '',
  phone1: '',
  phone2: '',
  fax: '',
  addressId: '',
  type: '',
  defaultCurrency: '',
  isActive: true,
  workingDays: [],
  timeZone: '',
};

// ------------------- Role -------------------
export const newRole: modelTypes.Role = {
  id: undefined,
  name: '',
  type: '',
  facilityId: null
};

// ------------------- User Role -------------------
export const newUserRole: modelTypes.UserRole = {
  roleId: undefined,
  userId: undefined
};

// ------------------- User Department -------------------
export const newUserDepartment: modelTypes.UserDepartment = {
  id: undefined,
  userId: undefined,
  departmentId: undefined,
  isActive: true,
  isDefault: false
};

// Patient Attachment Constructors
// ------------------- Patient Attachment -------------------
export const newPatientAttachment: modelTypes.PatientAttachment = {
  id: undefined,
  patientId: undefined,
  spaceKey: '',
  filename: '',
  mimeType: '',
  sizeBytes: 0,
  type: undefined,
  details: undefined,
  source: undefined
};

export const newUploadResponse: modelTypes.UploadResponse = {
  id: undefined,
  filename: '',
  mimeType: '',
  sizeBytes: 0,
  downloadUrl: ''
};

export const newDownloadTicket: modelTypes.DownloadTicket = {
  url: '',
  expiresInSeconds: 0
};

export const newUploadAttachmentParams: modelTypes.UploadPatientAttachmentParams = {
  patientId: undefined,
  file: undefined,
  type: undefined,
  details: undefined,
  source: undefined
};

// ------------------- Encounter Attachment -------------------
export const newEncounterAttachment: modelTypes.EncounterAttachment = {
  id: undefined,
  encounterId: undefined,
  spaceKey: '',
  filename: '',
  mimeType: '',
  sizeBytes: 0,
  type: undefined,
  details: undefined,
  source: undefined,
  sourceId: undefined
};

export const newUploadEncounterAttachmentParams: modelTypes.UploadEncounterAttachmentParams = {
  encounterId: undefined,
  file: undefined,
  type: undefined,
  details: undefined,
  source: undefined,
  sourceId: undefined
};

// ------------------- Service -------------------
export const newService: modelTypes.Service = {
  id: undefined,
  name: '',
  abbreviation: null,
  code: '',
  category: null,
  price: null,
  currency: null,
  appointable: false,
  isActive: true,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null,
  facilityId: undefined,
  parallelCapacityValue: 1,
  defaultDurationMinutes: undefined,
  defaultBufferBeforeMinutes: 0,
  defaultBufferAfterMinutes: 0,
};

// ------------------- Service Item -------------------
export const newServiceItem: modelTypes.ServiceItem = {
  id: undefined,
  type: 'DEPARTMENTS',
  sourceId: 0,
  serviceId: undefined,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null,
  isActive: true
};

export const newLanguage: modelTypes.Language = {
  id: 0,
  langKey: '',
  langName: '',
  direction: '',
  details: null
};
// ------------------- Practitioner -------------------
export const newPractitioner: modelTypes.Practitioner = {
  id: undefined,
  facilityId: 0,
  userId: 0,
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  specialty: '',
  subSpecialty: '',
  defaultMedicalLicense: '',
  secondaryMedicalLicense: '',
  educationalLevel: '',
  appointable: false,
  defaultLicenseValidUntil: undefined,
  secondaryLicenseValidUntil: undefined,
  dateOfBirth: undefined,
  jobRole: null,
  gender: null,
  isActive: true,
  parallelCapacityValue: 1,
  defaultDurationMinutes: undefined,
  defaultBufferBeforeMinutes: 0,
  defaultBufferAfterMinutes: 0,
};

// ------------------- Language Translation -------------------
export const newLanguageTranslation: modelTypes.LanguageTranslation = {
  id: 0,
  langKey: '',
  translationKey: '',
  translationText: '',
  verified: false,
  translated: false
};

// ------------------- Age Group -------------------
export const newAgeGroup: modelTypes.AgeGroup = {
  id: undefined,
  ageGroup: '',
  fromAge: 0,
  toAge: 0,
  fromAgeUnit: 'YEARS',
  toAgeUnit: 'YEARS',
  isActive: true,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null,
  facilityId: undefined
};

// ------------------- Procedure -------------------
export const newProcedure: modelTypes.Procedure = {
  id: undefined,
  name: '',
  code: '',
  categoryType: null,
  isAppointable: false,
  indications: null,
  contraindications: null,
  preparationInstructions: null,
  recoveryNotes: null,
  isActive: true,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null,
  facilityId: undefined,
  currency: null,
  price: null
};

// ------------------- Allergen -------------------
export const newAllergen: modelTypes.Allergen = {
  id: undefined,
  name: '',
  type: '',
  description: '',
  isActive: true,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

// ------------------- Diagnostic Test -------------------
export const newDiagnosticTest: modelTypes.DiagnosticTest = {
  id: undefined,
  type: '',
  name: '',
  internalCode: '',

  ageSpecific: false,
  ageGroupList: [],

  genderSpecific: false,
  gender: null,

  specialPopulation: false,
  specialPopulationValues: [],

  price: null,
  currency: null,
  specialNotes: '',

  isActive: true,
  appointable: false,

  defaultProfileResultType: '',
  defaultProfileResultUnit: '',
  listOfValueId: null,

  parallelCapacityValue: 1,
  defaultDurationMinutes: undefined,
  defaultBufferBeforeMinutes: 0,
  defaultBufferAfterMinutes: 0,
};

export const newDiagnosticOrderTestCollectedSample: modelTypes.DiagnosticOrderTestCollectedSampleDTO =
  {
    orderId: 0,
    orderTestId: 0,
    unit: '',
    quantity: 0,
    collectedAt: ''
  };

export const newDiagnosticOrderTestCollectedSampleBulkSame: modelTypes.DiagnosticOrderTestCollectedSampleBulkSameDTO =
  {
    orderId: 0,
    orderTestIds: [],
    unit: '',
    quantity: 0,
    collectedAt: ''
  };

export const newDiagnosticOrderTestCollectedSampleResponse: modelTypes.DiagnosticOrderTestCollectedSampleResponseVM =
  {
    id: 0,
    orderId: 0,
    orderTestId: 0,
    unit: '',
    quantity: 0,
    collectedAt: '',
    createdBy: null,
    createdDate: null,
    lastModifiedBy: null,
    lastModifiedDate: null
  };

// ------------------- Laboratory -------------------
export const newLaboratory: modelTypes.Laboratory = {
  id: undefined,
  testId: undefined,
  property: undefined,
  system: undefined,
  scale: undefined,
  reagents: undefined,
  method: undefined,
  testDurationTime: undefined,
  timeUnit: undefined,
  resultUnit: undefined,
  sampleContainer: undefined,
  sampleVolume: undefined,
  sampleVolumeUnit: undefined,
  tubeColor: undefined,
  testDescription: undefined,
  sampleHandling: undefined,
  turnaroundTime: undefined,
  turnaroundTimeUnit: undefined,
  preparationRequirements: undefined,
  medicalIndications: undefined,
  associatedRisks: undefined,
  testInstructions: undefined,
  category: undefined,
  tubeType: undefined,
  timing: null
};

// default empty object
// ------------------- DiagnosticTestProfile -------------------
export const newDiagnosticTestProfile: modelTypes.DiagnosticTestProfile = {
  id: undefined,
  testId: undefined,
  name: '',
  resultUnit: '',
  resultType: null,
  listOfValueId: null,
  isDefault: false,
  isActive: true
};
// ------------------- Pathology -------------------
export const newPathology: modelTypes.Pathology = {
  id: undefined,
  testId: undefined,
  category: '',
  specimenType: '',
  analysisProcedure: '',
  turnaroundTime: undefined,
  timeUnit: '',
  testDescription: '',
  sampleHandling: '',
  medicalIndications: '',
  criticalValues: '',
  preparationRequirements: ''
};

// ------------------- Radiology -------------------
export const newRadiology: modelTypes.Radiology = {
  id: undefined,
  testId: 0,
  category: '',
  imageDuration: null,
  testInstructions: '',
  medicalIndications: '',
  turnaroundTimeUnit: '',
  turnaroundTime: undefined,
  associatedRisks: ''
};

// ------------------- Medication Category -------------------
export const newMedicationCategory: modelTypes.MedicationCategory = {
  id: undefined,
  name: ''
};

// ------------------- Medication Category Class -------------------
export const newMedicationCategoryClass: modelTypes.MedicationCategoryClass = {
  id: undefined,
  name: '',
  medicationCategoriesId: undefined
};

// ------------------- Active Ingredient -------------------
export const newActiveIngredient: modelTypes.ActiveIngredient = {
  id: undefined,
  name: '',
  drugClassId: null,
  atcCode: null,
  otc: false,
  hasSynonyms: false,
  antimicrobial: false,
  highRiskMed: false,
  abortiveMedication: false,
  laborInducingMed: false,
  isControlled: false,
  controlled: null,
  hasBlackBoxWarning: false,
  blackBoxWarning: '',
  isActive: true,
  toxicityMaximumDose: null,
  toxicityMaximumDosePerUnit: null,
  toxicityDetails: null,
  mechanismOfAction: null,
  pharmaAbsorption: null,
  pharmaRouteOfElimination: null,
  pharmaVolumeOfDistribution: null,
  pharmaHalfLife: null,
  pharmaProteinBinding: null,
  pharmaClearance: null,
  pharmaMetabolism: null,
  pregnancyCategory: null,
  pregnancyNotes: null,
  lactationRisk: null,
  lactationRiskNotes: null,
  doseAdjustmentRenal: false,
  doseAdjustmentRenalOne: null,
  doseAdjustmentRenalTwo: null,
  doseAdjustmentRenalThree: null,
  doseAdjustmentRenalFour: null,
  doseAdjustmentHepatic: false,
  doseAdjustmentPugA: null,
  doseAdjustmentPugB: null,
  doseAdjustmentPugC: null
};

// ------------------- Ingredient PreRequested Test -------------------
export const newActiveIngredientPreRequestedTest: modelTypes.ActiveIngredientPreRequestedTest = {
  id: undefined,
  activeIngredientId: 0,
  testId: 0,
  description: '',
  name: ''
};

// ------------------- Ingredient Synonym -------------------
export const newActiveIngredientSynonym: modelTypes.ActiveIngredientSynonym = {
  id: undefined,
  activeIngredientId: 0,
  synonym: '',
  dentalActionId: 0,
  cdtId: 0
};

// ------------------- Special Population -------------------
export const newActiveIngredientSpecialPopulation: modelTypes.ActiveIngredientSpecialPopulation = {
  id: undefined,
  activeIngredientId: 0,
  specialPopulation: '',
  considerations: ''
};

// ------------------- Contraindication -------------------
export const newActiveIngredientContraindication: modelTypes.ActiveIngredientContraindication = {
  id: undefined,
  activeIngredientId: 0,
  icdCodeId: 0
};

export const newDentalAction: modelTypes.DentalAction = {
  id: null, // Primary key (auto-generated)
  description: '', // Mandatory field
  type: null, // Enum (mandatory)
  imageName: null, // Optional image file name
  isActive: true
};

// ------------------- Test Normal Range -------------------
export const newDiagnosticTestNormalRange: modelTypes.DiagnosticTestNormalRange = {
  id: undefined,
  testId: 0,
  gender: undefined,
  ageFrom: undefined,
  ageFromUnit: undefined,
  ageTo: undefined,
  ageToUnit: undefined,
  condition: undefined,

  resultType: '',
  resultText: undefined,
  resultLov: undefined,
  normalRangeType: undefined,
  rangeFrom: undefined,
  rangeTo: undefined,
  criticalValue: false,
  criticalValueLessThan: undefined,
  criticalValueMoreThan: undefined,
  profileTestId: undefined,

  lovKeys: []
};

export const newProcedureCoding: modelTypes.ProcedureCoding = {
  id: undefined,
  procedureId: undefined,
  codeType: 'CPT_CODES',
  codeId: '',
  // doseAdjustmentPugC: null,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

// ------------------- Price List for Procedure -------------------
export const newProcedurePriceList: modelTypes.ProcedurePriceList = {
  id: undefined,
  procedureId: undefined,
  price: 0,
  currency: 'USD'
};

// ------------------- Ingredient Drug Interaction -------------------
export const newActiveIngredientDrugInteraction: modelTypes.ActiveIngredientDrugInteraction = {
  id: undefined,
  activeIngredientId: 0,
  interactedIngredientId: 0,
  severity: '',
  description: '',
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

export const newBrandMedication: modelTypes.BrandMedication = {
  id: undefined,
  name: '',
  code: '',
  manufacturer: '',
  dosageForm: '',
  usageInstructions: '',
  storageRequirements: '',
  expiresAfterOpening: false,
  expiresAfterOpeningValue: null,
  expiresAfterOpeningUnit: null,
  useSinglePatient: false,
  highCostMedication: false,
  costCategory: '',
  roa: '',
  isActive: true,
  uomGroupId: null,
  uomGroupUnitId: null,
  hasActiveIngredient: false,
  price: 0,
  currency: ''
};

// ------------------- Substitute -------------------
export const newSubstitute: modelTypes.Substitute = {
  brandId: undefined,
  alternativeBrandId: undefined
};

// ------------------- Prescription Instructions -------------------
export const newPrescriptionInstructions: modelTypes.prescriptionInstructions = {
  id: undefined,
  category: '',
  dose: 0,
  unit: '',
  rout: '',
  frequency: ''
};

// ------------------- Ingredient Indication -------------------
export const newActiveIngredientIndication: modelTypes.ActiveIngredientIndication = {
  id: undefined,
  activeIngredientId: 0,
  icdCodeId: 0,
  dosage: null,
  unit: '',
  isOffLabel: false
};

// ------------------- Vaccine -------------------
export const newVaccine: modelTypes.Vaccine = {
  id: undefined,
  name: '',
  atcCode: '',
  type: '',
  roa: '',
  siteOfAdministration: '',
  postOpeningDuration: null,
  durationUnit: '',
  numberOfDoses: '',
  indications: '',
  possibleReactions: '',
  contraindicationsAndPrecautions: '',
  storageAndHandling: '',
  isActive: true,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

// ------------------- Vaccine Brand -------------------
export const newVaccineBrand: modelTypes.VaccineBrand = {
  id: undefined,
  vaccineId: undefined,
  name: '',
  manufacture: '',
  volume: 0,
  unit: '',
  marketingAuthorizationHolder: '',
  isActive: true,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

// ------------------- Vaccine Dose -------------------
export const newVaccineDose: modelTypes.VaccineDose = {
  id: undefined,
  vaccineId: 0,
  doseNumber: 'FIRST',
  fromAge: null,
  toAge: null,
  fromAgeUnit: 'YEARS',
  toAgeUnit: 'YEARS',
  isBooster: false,
  isActive: true,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

// ------------------- Vaccine Dose Interval -------------------
export const newVaccineDosesInterval: modelTypes.VaccineDosesInterval = {
  id: undefined,
  vaccineId: 0,
  fromDoseId: 0,
  toDoseId: 0,
  intervalBetweenDoses: 0,
  unit: 'DAYS',
  isActive: true,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null,
  visitType: '',
  durationInMinutes: 0
};

// ------------------- CDT Dental Action -------------------
export const newCdtDentalAction: modelTypes.CdtDentalAction = {
  dentalActionId: undefined,
  cdtId: undefined
};

// ------------------- Brand Medication Active Ingredient -------------------
export const newBrandMedicationActiveIngredient: modelTypes.BrandMedicationActiveIngredient = {
  id: undefined,
  brandId: undefined,
  activeIngredientId: undefined,
  strength: undefined,
  unit: ''
};

// ------------------- Catalog Response VM -------------------
export const newCatalogResponseVM: modelTypes.CatalogResponseVM = {
  id: 0,
  name: '',
  description: null,
  type: '',
  departmentId: 0,
  departmentName: null,
  facilityId: 0,
  facilityName: null,
   parallelCapacityValue: 1,
  defaultDurationMinutes: undefined,
  defaultBufferBeforeMinutes: 0,
  defaultBufferAfterMinutes: 0,
};

// ------------------- Catalog Create VM -------------------
export const newCatalogCreateVM: modelTypes.CatalogCreateVM = {
  name: '',
  description: null,
  type: '',
  departmentId: undefined,
  facilityId: undefined,
   parallelCapacityValue: 1,
  defaultDurationMinutes: undefined,
  defaultBufferBeforeMinutes: 0,
  defaultBufferAfterMinutes: 0,
};

// ------------------- Catalog Update VM -------------------
export const newCatalogUpdateVM: modelTypes.CatalogUpdateVM = {
  name: '',
  description: null,
  type: '',
  departmentId: undefined,
  facilityId: undefined,
   parallelCapacityValue: 1,
  defaultDurationMinutes: undefined,
  defaultBufferBeforeMinutes: 0,
  defaultBufferAfterMinutes: 0,
};

// ------------------- Catalog Diagnostic Test -------------------
export const CatalogDiagnosticTest: modelTypes.CatalogDiagnosticTest = {
  id: 0,
  catalogId: 0,
  diagnosticTestId: 0
};

// ------------------- Catalog Add Tests -------------------
export const CatalogAddTestsVM: modelTypes.CatalogAddTestsVM = {
  testIds: []
};

// ------------------- UOM Group -------------------
export const newUOMGroup: modelTypes.uomGroup = {
  id: undefined,
  description: '',
  name: ''
};

// ------------------- UOM Group Unit -------------------
export const newUOMGroupUnit: modelTypes.UOMGroupUnit = {
  id: undefined,
  uom: '',
  uomOrder: 0
  // uom_group_id: undefined
};

// ------------------- UOM Group Relation -------------------
export const newUOMGroupRelation: modelTypes.UOMGroupRelation = {
  id: undefined,
  relation: 0,
  fromUnitId: undefined,
  toUnitId: undefined
};

// ------------------- Adverse Effect -------------------
export const newActiveIngredientAdverseEffect: modelTypes.ActiveIngredientAdverseEffect = {
  id: undefined,
  activeIngredientId: 0,
  strength: 0,
  unit: '',
  adverseEffect: ''
};

// ------------------- Food Interaction -------------------
export const newActiveIngredientFoodInteraction: modelTypes.ActiveIngredientFoodInteraction = {
  id: undefined,
  activeIngredientId: 0,
  food: '',
  severity: '',
  description: '',
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

// ------------------- Inventory Product -------------------
export const newInventoryProduct: modelTypes.InventoryProduct = {
  id: undefined,
  name: '',
  type: '',
  code: '',
  barcode: '',
  brandId: null,
  uomGroupId: null,
  baseUom: null,
  dispenseUom: null,
  controlledSubstance: false,
  hazardousBiohazardousTag: null,
  allergyRisk: false,
  itemAverageCost: null,
  pricePerBaseUom: null,
  warrantyStartDate: null,
  warrantyEndDate: null,
  maintenanceSchedule: null,
  maintenanceScheduleType: null,
  criticalEquipment: false,
  calibrationRequired: false,
  trainingRequired: false,
  batchManaged: false,
  expiryDateMandatory: false,
  reusable: false,
  inventoryType: null,
  shelfLife: null,
  shelfLifeUnit: null,
  leadTime: null,
  leadTimeUnit: null,
  erpIntegrationId: null,
  isActive: true
};
export const newDiagnosticTestCoding: modelTypes.DiagnosticTestCoding = {
  id: undefined,
  procedureId: undefined,
  codeType: null,
  codeId: '',
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

// ------------------- Country -------------------
export const newCountry: modelTypes.Country = {
  id: undefined,
  name: '',
  code: '',
  isActive: true
};

// ------------------- Country District -------------------
export const newCountryDistrict: modelTypes.CountryDistrict = {
  id: undefined,
  countryId: undefined,
  name: '',
  code: '',
  isActive: true
};

// ------------------- District Community -------------------
export const newDistrictCommunity: modelTypes.DistrictCommunity = {
  id: undefined,
  districtId: undefined,
  name: '',
  isActive: true,
  templateValue: ''
};

// ------------------- Community Area -------------------
export const newCommunityArea: modelTypes.CommunityArea = {
  id: undefined,
  communityId: undefined,
  name: '',
  isActive: true,
  patientId: 0,
  encounterId: 0,
  dueAmount: 0,
  remaining: 0,
  currency: '',
  facilityDefaultCurrency: ''
};

// ------------------- Visit Duration -------------------
export const newVisitDuration: modelTypes.VisitDuration = {
  id: undefined,
  visitType: null,
  durationInMinutes: 0,
  resourceSpecific: false,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

// ------------------- Availability Template -------------------
export const newAvailabilityTemplateWorkingDay: modelTypes.AvailabilityTemplateWorkingDay = {
  dayOfWeek: 0,
  isWorking: false
};

export const newAvailabilityTemplateAllowedServiceDTO: modelTypes.AvailabilityTemplateAllowedServiceDTO = {
  id: null,
  service: ''
};

export const newAvailabilityTemplateAllowedServiceResponseVM: modelTypes.AvailabilityTemplateAllowedServiceResponseVM = {
  id: null,
  service: null
};

export const newAvailabilityTemplateIntervalResponseVM: modelTypes.AvailabilityTemplateIntervalResponseVM = {
  id: null,
  templateId: null,
  dayOfWeek: null,
  startTime: null,
  endTime: null,
  slotStrategy: null,
  slotDurationMinutes: null,
  allowedServices: []
};

export const newAvailabilityTemplateIntervalCreateDTO: modelTypes.AvailabilityTemplateIntervalCreateDTO = {
  templateId: 0,
  dayOfWeek: '',
  startTime: '',
  endTime: '',
  slotStrategy: '',
  slotDurationMinutes: 0,
  allowedServices: []
};

export const newAvailabilityTemplateIntervalUpdateDTO: modelTypes.AvailabilityTemplateIntervalUpdateDTO = {
  id: 0,
  dayOfWeek: null,
  startTime: null,
  endTime: null,
  slotStrategy: null,
  slotDurationMinutes: null,
  allowedServices: []
};

export const newAvailabilityTemplateCreateDTO: modelTypes.AvailabilityTemplateCreateDTO = {
  facilityId: undefined,
  departmentId: undefined,
  templateName: '',
  templateType: 'DEPARTMENT',
  resourceId: undefined,
  templateColor: "#6982F0",
  status: 'DRAFT',
  versionNo: 1,
  copyFromTemplateId: null,
  parentTemplateId: null,
  durationMinutes: 0,
  defaultBufferBeforeMinutes: 0,
  defaultBufferAfterMinutes: 0,
  parallelCapacityValue: 1,
  defaultServiceId: null,
  numberOfResourcesExpected: null,
  requirePractitioner: false,
  defaultPractitionerId: null,
  requireBilling: false,
  requirePreAssessment: false,
  allowPatientPortalBooking: false,
  requireConfirmation: false,
  financialDetails: 'BOTH', 
  isActive: true,
  workingDays: [],
  allowedServices: []
};

export const newAvailabilityTemplateUpdateDTO: modelTypes.AvailabilityTemplateUpdateDTO = {
  id: 0,
  ...newAvailabilityTemplateCreateDTO
};

export const newAvailabilityTemplateResponseVM: modelTypes.AvailabilityTemplateResponseVM = {
  id: undefined,
  facilityId: undefined,
  departmentId: undefined,
  resourceId: undefined,
  templateName: '',
  templateType: '',
  templateColor: null,
  status: '',
  versionNo: null,
  copyFromTemplateId: null,
  parentTemplateId: null,
  durationMinutes: null,
  defaultBufferBeforeMinutes: null,
  defaultBufferAfterMinutes: null,
  parallelCapacityValue: null,
  defaultServiceId: null,
  numberOfResourcesExpected: null,
  requirePractitioner: null,
  defaultPractitionerId: null,
  requireBilling: null,
  requirePreAssessment: null,
  allowPatientPortalBooking: null,
  requireConfirmation: null,
  financialDetails: null,
  workingDays: [],
  allowedServices: [],
  isActive: true,
};

export const newAvailabilityGenerationBatchApplyDTO: modelTypes.AvailabilityGenerationBatchApplyDTO = {
  templateId: 0,
  startDate: '',
  endDate: '',
  deferred: false,
  deferredAt: null,
  scope: '',
  holidayHandlingMode: null
};

export const newApplyAvailabilityTemplateResponseVM: modelTypes.ApplyAvailabilityTemplateResponseVM = {
  batchId: null,
  templateId: null,
  scope: null,
  applyStartDateTime: null,
  applyEndDateTime: null,
  totalSlots: null,
  dailyAvg: null,
  executionStatus: null,
  message: null,
  holidayHandlingMode: null
};

export const newAvailabilityGenerationBatch: modelTypes.AvailabilityGenerationBatch = {
  id: 0,
  templateId: null,
  holidayHandlingMode: null,
  scope: null,
  applyStartDateTime: null,
  applyEndDateTime: null,
  totalSlots: null,
  dailyAvg: null,
  executionStatus: null,
  createdDate: null,
  lastModifiedDate: null
};

// ------------------- Price List -------------------
export const newPriceList: modelTypes.PriceList = {
  id: undefined,
  facilityId: null,
  facilityIds: [],
  name: '',
  type: '',
  effectiveFrom: '',
  effectiveTo: null,
  description: '',
  isActive: false
};

// ------------------- Report Template -------------------
export const newReportTemplate: modelTypes.ReportTemplate = {
  id: 0,
  name: null,
  templateValue: null,
  isActive: true
};

// ------------------- Diagnostic Test Report Template -------------------
export const newDiagnosticTestReportTemplate: modelTypes.DiagnosticTestReportTemplate = {
  id: 0,
  diagnosticTest: null,
  name: null,
  templateValue: null,
  isActive: true
};

// ------------------- Sticky Notes -------------------
export const newUserStickyNotesResponseVM: modelTypes.UserStickyNotesResponseVM = {
  id: undefined,
  userId: undefined,
  note: '',
  priority: '',
  priorityOrder: 0,
  color: '',
  createdBy: '',
  createdDate: null,
  lastModifiedBy: '',
  lastModifiedDate: null,
  patientId: undefined
};

export const newUserStickyNotesCreateVM: modelTypes.UserStickyNotesCreateVM = {
  userId: undefined,
  note: '',
  priority: '',
  priorityOrder: 0,
  color: '--note-purple',
  patientId: undefined
};
export const newPriceListItem: modelTypes.PriceListItem = {
  id: undefined,
  priceListId: 0,
  itemType: null,
  productType: null,
  serviceId: null,
  productId: null,
  price: 0,
  discountAllowed: false,
  isActive: true
};

// ------------------- Billing Invoice -------------------
export const newBillingInvoice: modelTypes.BillingInvoiceCreateVM = {
  facilityId: 0,
  patientKey: null,
  encounterKey: null,
  totalAmount: 0,
  paidAmount: 0,
  balanceAmount: 0,
  currency: null,
  encounterType: '',
  encounterReason: '',
  priorityLevel: '',
  status: ''
};

export const newBillingInvoiceCreateDTO: modelTypes.BillingInvoiceCreateDTO = {
  patientId: null,
  facilityId: 0,
  status: 'NEW',
  totalAmount: 0,
  paidAmount: 0,
  balanceAmount: 0,
  currency: 'USD',
};

export const newBillingInvoiceUpdateDTO: modelTypes.BillingInvoiceUpdateDTO = {
  id: 0,
  patientId: null,
  facilityId: 0,
  status: 'NEW',
  totalAmount: 0,
  paidAmount: 0,
  balanceAmount: 0,
  currency: 'USD',
};

export const newBillingInvoiceUpdate: modelTypes.BillingInvoiceUpdateVM = {
  id: 0,
  facilityId: 0,
  patientKey: null,
  encounterKey: null,
  totalAmount: 0,
  paidAmount: 0,
  balanceAmount: 0,
  currency: null
};

export const newBillingInvoiceResponse: modelTypes.BillingInvoiceResponseVM = {
  id: 0,
  invoiceNumber: '',
  facilityId: 0,
  patientKey: null,
  encounterKey: null,
  status: '',
  totalAmount: 0,
  paidAmount: 0,
  balanceAmount: 0,
  currency: null,
  createdBy: null,
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

// ------------------- Payor -------------------
export const newPayor: modelTypes.Payor = {
  id: undefined,
  code: '',
  name: '',
  category: null,
  address: '',
  phone: '',
  email: '',
  contractManagerContact: '',
  startDate: null,
  expiryDate: null,
  renewable: false,
  allowPartialCoverage: false,
  acceptCopay: false,
  acceptDeductibles: false,
  allowPackagePricing: false,
  allowDrgBilling: false,
  forcePreApproval: false,
  isActive: true
};

export const newPayorPlan: modelTypes.PayorPlan = {
  id: undefined,
  code: '',
  name: '',
  category: null,
  address: '',
  phone: '',
  email: '',
  contractManagerContact: '',
  startDate: null,
  expiryDate: null,
  renewable: false,
  allowPartialCoverage: false,
  acceptCopay: false,
  acceptDeductibles: false,
  allowPackagePricing: false,
  allowDrgBilling: false,
  forcePreApproval: false,
  isActive: true,
  createdDate: null,
  lastModifiedDate: null
};

export const newPayorPlanItem: modelTypes.PayorPlanItem = {
  id: undefined,
  payorId: 0,
  itemType: null,
  amount: null,
  coverageType: null,
  isActive: true,
  createdDate: null,
  lastModifiedDate: null
};

// ------------------- Invoice Item -------------------
export const newBillingInvoiceItem: modelTypes.BillingInvoiceItemCreateVM = {
  invoiceId: 0,
  nurseServiceProductKey: null,
  code: null,
  quantity: 0,
  unitPrice: 0,
  totalPrice: 0,
  currency: null
};

export const newBillingInvoiceItemCreateDTO: modelTypes.BillingInvoiceItemCreateDTO = {
  invoiceId: 0,
  nurseServiceProductId: null,
  code: null,
  quantity: 0,
  unitPrice: 0,
  totalPrice: 0,
  currency: 'USD',
};

export const newBillingInvoiceItemUpdateDTO: modelTypes.BillingInvoiceItemUpdateDTO = {
  id: 0,
  invoiceId: 0,
  nurseServiceProductId: null,
  code: null,
  quantity: 0,
  unitPrice: 0,
  totalPrice: 0,
  currency: 'USD',
};

export const newBillingInvoiceItemUpdate: modelTypes.BillingInvoiceItemUpdateVM = {
  id: 0,
  invoiceId: 0,
  nurseServiceProductKey: null,
  code: null,
  quantity: 0,
  unitPrice: 0,
  totalPrice: 0,
  currency: null
};

export const newBillingInvoiceItemResponse: modelTypes.BillingInvoiceItemResponseVM = {
  id: 0,
  invoiceId: 0,
  nurseServiceProductKey: null,
  code: null,
  quantity: 0,
  unitPrice: 0,
  totalPrice: 0,
  currency: null,
  createdBy: null,
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

// ------------------- Patient Payment -------------------
export const newPatientPayment: modelTypes.PatientPaymentCreateVM = {
  patientKey: null,
  facilityId: 0,
  paymentType: null,
  paymentMethod: null,
  paymentDate: '',
  amount: 0,
  currency: null,
  reference: null,
  notes: null
};

export const newPatientPaymentUpdate: modelTypes.PatientPaymentUpdateVM = {
  id: 0,
  patientKey: null,
  facilityId: 0,
  paymentType: null,
  paymentMethod: null,
  paymentDate: '',
  amount: 0,
  currency: null,
  reference: null,
  notes: null
};

export const newPatientPaymentResponse: modelTypes.PatientPaymentResponseVM = {
  id: 0,
  patientKey: null,
  facilityId: 0,
  paymentType: null,
  paymentMethod: null,
  paymentDate: '',
  amount: 0,
  currency: null,
  reference: null,
  notes: null,
  createdBy: null,
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

// ------------------- Payment Allocation -------------------
export const newPaymentAllocation: modelTypes.PaymentAllocationCreateVM = {
  paymentId: 0,
  invoiceId: 0,
  allocatedAmount: 0,
  invoiceItemId: null
};

export const newPaymentAllocationUpdate: modelTypes.PaymentAllocationUpdateVM = {
  id: 0,
  paymentId: 0,
  invoiceId: 0,
  allocatedAmount: 0,
  invoiceItemId: null
};

export const newPaymentAllocationResponse: modelTypes.PaymentAllocationResponseVM = {
  id: 0,
  paymentId: 0,
  invoiceId: 0,
  allocatedAmount: 0,
  invoiceItemId: null,
  createdBy: null,
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

// ------------------- Patient Account Summary -------------------
export const newPatientAccountSummary: modelTypes.PatientAccountSummaryVM = {
  patientKey: '',
  freeBalance: 0,
  outstandingBalance: 0,
  totalInvoiced: 0,
  totalPaid: 0,
  paymentTypes: '',
  paymentMethods: '',
  amount: 0,
  currency: '',
  facilityDefaultCurrency: '',
  addToFreeBalance: false,
  services: []
};

// ------------------- Discharge Planning -------------------
export const newDischargePlanning: modelTypes.DischargePlanning = {
  id: undefined,
  patientId: 0,
  encounterId: 0,
  expectedDischargeDate: null,
  estimatedLos: '',
  readinessStatus: '',

  medicalConditionStable: false,
  vitalsStable: false,
  pendingInvestigations: false,
  mobilityAdlStatus: false,

  diagnosisCode: '',
  diagnosisName: '',

  finalMedReconciliationCompleted: false,
  dischargeSummaryPrepared: false,
  dischargeOrdersSigned: false,
  nursingDischargeReportDone: false,
  patientFamilyInformed: false,
  transportArranged: false,

  medicalEquipment: '',
  homeCareNeeded: false,
  postDischargeDietaryPlan: '',
  postDischargeSocialNeeds: '',

  topicsCovered: '',
  educationDietaryPlan: '',
  educationSocialNeeds: '',

  materialLeaflet: false,
  materialVerbal: false,
  materialVideo: false,
  educationProvided: false,
  patientUnderstanding: false,
  isActive: true
};

// ------------------- Patient Document -------------------
export const newPatientDocument: modelTypes.PatientDocument = {
  id: undefined,
  patientId: undefined,
  countryId: undefined,
  type: 'NATIONAL_ID',
  number: '',
  isPrimary: false,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

export const newPatient: modelTypes.Patient = {
  id: undefined,
  medicalRecordNumber: '',

  firstName: '',
  secondName: '',
  thirdName: '',
  lastName: '',

  sexAtBirth: null,
  dateOfBirth: null,

  patientClasses: '',
  isPrivatePatient: false,

  firstNameSecondaryLang: '',
  secondNameSecondaryLang: '',
  thirdNameSecondaryLang: '',
  lastNameSecondaryLang: '',

  primaryMobileNumber: '',
  receiveSms: false,
  secondMobileNumber: '',
  homePhone: '',
  workPhone: '',
  email: '',
  receiveEmail: false,
  preferredWayOfContact: null,

  nativeLanguage: '',
  emergencyContactName: '',
  emergencyContactRelation: '',
  emergencyContactPhone: '',

  role: '',
  maritalStatus: '',
  nationality: '',
  religion: '',
  ethnicity: '',
  occupation: '',
  responsibleParty: '',
  educationalLevel: '',

  previousId: '',
  archivingNumber: '',

  details: '',
  isUnknown: false,

  isVerified: false,
  isCompletedPatient: false,
  securityAccessLevel: null,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null,
  visitType: null,
  durationInMinutes: null,
  resourceSpecific: false
};

export const newAddress: modelTypes.Address = {
  id: undefined,
  patientId: 0,

  locationJson: {
    country: null,
    district: null,
    community: null,
    area: null
  },

  streetName: '',
  houseApartmentNumber: '',
  postalZipCode: '',
  additionalAddressLine: '',
  isCurrent: true,

  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

export const newPatientPreferredHealthProfessional: modelTypes.PatientPreferredHealthProfessional =
  {
    id: undefined,
    patientId: 0,
    practitionerId: 0,
    facilityId: 0,
    networkAffiliation: '',
    relatedWith: '',
    createdBy: '',
    createdDate: null,
    lastModifiedBy: null,
    lastModifiedDate: null
  };

export const newPatientInsurance: modelTypes.PatientInsurance = {
  id: undefined,
  patientId: undefined,
  payorId: undefined,
  planId: null,
  policyHolderId: null,
  policyNumber: 0,
  groupNumber: null,
  expirationDate: '',
  remainingBenefits: null,
  remainingDeductibles: null,
  isPrimary: false,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

export const newPatientInsuranceCoverage: modelTypes.PatientInsuranceCoverage = {
  id: undefined,
  insuranceId: 0,
  itemType: null,
  coverageType: null,
  amount: 0,

  createdBy: null,
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

export const newEncounterVaccination: modelTypes.EncounterVaccination = {
  id: undefined,

  patientId: 0,
  encounterId: 0,

  vaccineId: 0,
  vaccineBrandId: 0,
  vaccineDoseId: 0,

  vaccineLotNumber: null,

  dateAdministered: null,

  status: 'ACTIVE',

  cancellationReason: null,

  cancelledAt: null,
  cancelledById: null,
  administeredLocation: null,
  administrationReactions: null,
  externalFacilityName: null,
  notes: null,

  reviewedAt: null,
  reviewedById: null
};

// ------------------- Patient Encounter Update -------------------
export const newPatientEncounter: modelTypes.PatientEncounter = {
  id: 0,

  patientId: 0,
  facilityId: 0,
  departmentId: 0,

  practitionerId: null,
  appointmentId: null,
  encounterType: '',
  encounterReason: '',

  followUpEncounterId: null,

  priorityLevel: 'NORMAL',

  originType: null,
  originName: null,

  notes: null,

  status: 'NEW',
  encounterDate: null,
  chiefComplaint: null,

  hasPrescription: false,
  hasOrder: false,
  isObserved: false,
  paymentDate: '',
  amount: ''
};

export const newPatientBasicInformationResponseVM: modelTypes.PatientBasicInformationResponseVM = {
  firstName: '',
  lastName: '',
  medicalRecordNumber: null,
  dateOfBirth: '',
  sexAtBirth: '',
};

export const newPatientPayments: modelTypes.PatientPayments = {
  id: undefined,

  patientId: 0,
  encounterId: 0,

  planId: null,

  dueAmount: 0,
  patientBalance: 0,

  paidFromAmount: 0,
  paidFromBalance: 0,

  paymentTypes: null,
  paymentMethods: null,
  refunds: 0,

  amount: 0,
  currency: '',
  facilityDefaultCurrency: '',
  amountInFacilityCurrency: null,

  remaining: 0,
  addToFreeBalance: false,

  useBalanceToSettleDebts: false,

  cardNumber: null,
  cardHolderName: null,
  cardValidUntil: null,

  chequeNumber: null,
  chequeBankName: null,
  chequeDueDate: null,

  transferNumber: null,
  transferBankName: null,
  transferDate: null,

  createdBy: null,
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

export const newPatientPaymentService: modelTypes.PatientPaymentServices = {
  id: undefined,
  paymentId: 0,
  serviceId: 0,
  price: 0,
  isExempted: false,
  createdBy: null,
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

export const newPatientPaymentDetails: modelTypes.PatientPaymentDetails = {
  payment: { ...newPatientPayments },
  services: []
};
export const newPriceListAttribute: modelTypes.PriceListAttribute = {
  id: undefined,
  priceListId: undefined,
  attributeType: null, // PriceAttributes enum as string
  attribute: null,
  price: null, // or string if you prefer BigDecimal string
  isActive: true
};

export const newOrganizationDefinition: modelTypes.OrganizationDefinition = {
  id: undefined,
  name: '',
  description: '',
  address: '',
  contactName: '',
  contactAddress: '',
  contactEmail: '',
  contactMobile: '',
  contactLandNumber: '',
  taxValue: undefined,
  defaultTimeZone: '',
  defaultLanguageId: undefined,
  workingDays: [],
};

export const newOrganizationHolidayResponseVM: modelTypes.OrganizationHolidayResponseVM = {
  id: undefined,
  organizationDefinitionId: 0,
  name: '',
  holidayType: undefined,
  startDate: '',
  endDate: '',
  reason: '',
  isActive: true,
  allFacilities: true,
  facilityIds: '',
  recurring: false
};

export const newOrganizationHolidayCreateDTO: modelTypes.OrganizationHolidayCreateDTO = {
  organizationDefinitionId: 0,
  name: '',
  holidayType: undefined,
  startDate: '',
  endDate: '',
  reason: '',
  isActive: true,
  allFacilities: true,
  facilityIds: '',
  recurring: false
};

export const newOrganizationHolidayUpdateDTO: modelTypes.OrganizationHolidayUpdateDTO = {
  id: 0,
  name: '',
  holidayType: undefined,
  startDate: '',
  endDate: '',
  reason: '',
  isActive: true,
  allFacilities: true,
  facilityIds: '',
  recurring: false
};

export const newFormTemplate: modelTypes.FormTemplate = {
  id: undefined,
  name: null,
  description: null,
  facilityId: null,
  departmentId: null,
  formJson: null
};

export const newPatientWarningsUpdateDTO: modelTypes.PatientWarningsUpdateDTO = {
  id: undefined,
  warningType: '',
  warning: '',
  severity: '',
  onsetDateUndefined: true,
  onsetDate: '',
  byPatient: true,
  sourceOfInformation: null,
  note: '',
  actionTaken: ''
};

export const patientAllergiesResponseVM: modelTypes.PatientAllergiesResponseVM = {
  id: undefined,
  patientId: undefined,
  encounterId: undefined,

  allergenType: '',
  allergenId: undefined,
  severity: '',

  medicationClassId: undefined,
  criticality: '',
  certainty: '',
  treatmentStrategy: '',

  onset: '',
  onsetDateUndefined: true,
  onsetDate: '',

  typeOfPropensity: '',
  byPatient: true,
  sourceOfInformation: '',
  note: '',
  status: '',
  allergicReactions: '',

  resolvedBy: ''
};
export const newPatientWarnings: modelTypes.PatientWarnings = {
  id: undefined,
  patientId: undefined,
  encounterId: undefined,
  warningType: '',
  warning: '',
  severity: '',
  onsetDateUndefined: true,
  onsetDate: '',
  byPatient: true,
  sourceOfInformation: '',
  note: '',
  status: 'ACTIVE',
  actionTaken: '',
  resolvedBy: '',
  resolvedDate: '',

  cancelledBy: '',
  cancelledDate: '',
  cancellationReason: '',

  createdBy: '',
  createdDate: '',
  lastModifiedBy: '',
  lastModifiedDate: '',

  activeIngredients: []
};

export const newPatientAllergiesActiveIngredientCreate: modelTypes.PatientAllergiesActiveIngredientCreate =
  {
    activeIngredientId: undefined
  };

export const newPatientAllergiesCreateDTO: modelTypes.PatientAllergiesCreateDTO = {
  patientId: undefined,
  encounterId: undefined,
  allergenType: '',
  allergenId: undefined,
  severity: '',

  medicationClassId: undefined,
  criticality: '',
  certainty: '',
  treatmentStrategy: '',

  onset: '',
  onsetDateUndefined: true,
  onsetDate: '',

  typeOfPropensity: '',
  byPatient: true,
  sourceOfInformation: null,
  note: '',
  status: 'ACTIVE',
  allergicReactions: '',

  activeIngredients: []
};

export const newPatientWarningsCreateDTO: modelTypes.PatientWarningsCreateDTO = {
  patientId: undefined,
  encounterId: undefined,
  warningType: '',
  warning: '',
  severity: '',
  onsetDateUndefined: true,
  onsetDate: '',
  byPatient: true,
  sourceOfInformation: null,
  note: '',
  status: 'ACTIVE',
  actionTaken: ''
};

export const newPatientAllergiesUpdateDTO: modelTypes.PatientAllergiesUpdateDTO = {
  id: undefined,
  allergenType: '',
  allergenId: undefined,
  severity: '',

  medicationClassId: undefined,
  criticality: '',
  certainty: '',
  treatmentStrategy: '',

  onset: '',
  onsetDateUndefined: true,
  onsetDate: '',

  typeOfPropensity: '',
  byPatient: true,
  sourceOfInformation: null,
  note: '',
  allergicReactions: '',
  activeIngredients: []
};

export const newPatientPrescription: modelTypes.PatientPrescription = {
  id: undefined as any,
  patientId: null as any,
  encounterId: null as any,
  prescriptionNum: null as any,
  prescriptionDate: null as any,
  urgencyLevel: null,
  status: null,
  fromFacilityId: null as any,
  fromDepartmentId: null as any,
  toFacilityId: null,
  toDepartmentId: null,
  createdBy: null as any,
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

export const newPatientPrescriptionMedication: modelTypes.PatientPrescriptionMedication = {
  id: undefined as any,
  prescriptionHeaderId: null as any,
  medicationsId: null as any,
  instructionsType: null,
  instructions: null,
  dose: null,
  doesUnit: null,
  rout: null,
  frequency: null,
  duration: null,
  durationType: null,
  chronicMedication: false,
  maximumDose: null,
  validUtil: null,
  allowedSubstitute: false,
  indicationManually: null,
  indicationUse: null,
  indicationIcd: null,
  parametersToMonitor: null,
  numberOfRefills: null,
  refillValue: null,
  refillUnit: null,
  notes: null,
  extraDocumentation: null,
  administrationInstructions: null,
  status: null,
  createdBy: null,
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

// =====================
// Progress Notes
// =====================

export const newProgressNote: modelTypes.ProgressNote = {
  id: undefined,
  patient: { id: undefined },
  encounterId: undefined,
  noteText: '',

  // ✅ String بدل number
  cancelledBy: null,
  cancelledDate: null,
  cancellationReason: null,

  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null,
  patientId: 0
};

export const newProgressNoteCreateVM: modelTypes.ProgressNoteCreateVM = {
  patientId: undefined,
  encounterId: undefined,
  noteText: ''
};

export const newProgressNoteUpdateVM: modelTypes.ProgressNoteUpdateVM = {
  id: undefined,
  noteText: ''
};
export const newFavoriteDiagnosticTest: modelTypes.FavoriteDiagnosticTest = {
  id: undefined,
  userId: undefined,
  testId: undefined
};

export const newDiagnosticOrder: modelTypes.DiagnosticOrder = {
  id: undefined,

  patientId: undefined,
  encounterId: undefined,
  submittedBy: undefined,
  submittedDate: undefined,

  isUrgent: false,

  labStatus: modelTypes.DiagnosticStatus.NEW,
  radStatus: modelTypes.DiagnosticStatus.NEW
};

export const newDiagnosticOrderTest: modelTypes.DiagnosticOrderTest = {
  id: undefined,

  orderId: undefined,
  testId: undefined,

  receivedDepartmentId: undefined,

  reason: undefined,
  notes: undefined,

  status: modelTypes.DiagnosticOrderTestStatus.NEW,
  processingStatus: modelTypes.DiagnosticOrderTestStatus.NEW,

  submitDate: undefined,

  orderType: undefined,

  fromDepartmentId: undefined,
  fromFacilityId: undefined,
  toFacilityId: undefined,

  acceptedDate: undefined,
  rejectedDate: undefined,
  patientArrivedDate: undefined,
  readyDate: undefined,
  approvedDate: undefined,
  cancelledDate: undefined,

  acceptedBy: undefined,
  rejectedBy: undefined,
  rejectedReason: undefined,

  patientArrivedNoteRad: undefined,

  cancellationReason: undefined,
  cancelledBy: undefined
};

export const newDiagnosticOrderTestResultCreate: modelTypes.DiagnosticOrderTestResultCreateDTO = {
  orderTestId: 0,
  profileTestId: null,

  resultValueNumber: null,
  resultValueText: null,

  marker: null,
  normalRangeValue: null
};

export const newDiagnosticOrderTestResultUpdate: modelTypes.DiagnosticOrderTestResultUpdateDTO = {
  id: 0,
  orderTestId: 0,
  profileTestId: null,

  resultValueNumber: null,
  resultValueText: null,

  marker: null,
  normalRangeValue: null
};

export const newDiagnosticOrderTestResultReject: modelTypes.DiagnosticOrderTestResultRejectDTO = {
  rejectedReason: ''
};

export const newDiagnosticOrderTestResultResponse: modelTypes.DiagnosticOrderTestResultResponseVM =
  {
    id: 0,

    orderId: 0,
    orderTestId: 0,
    profileTestId: null,

    resultValueNumber: null,
    resultValueText: null,

    marker: null,
    viewMarker: null,
    normalRangeValue: null,
    viewNormalRange: null,

    processingStatus: null,

    approvedBy: null,
    approvedDate: null,

    rejectedBy: null,
    rejectedDate: null,
    rejectedReason: null,

    reviewBy: null,
    reviewDate: null,

    createdBy: null,
    createdDate: null,
    lastModifiedBy: null,
    lastModifiedDate: null
  };

export const newFilledProfileTestIdsParams: modelTypes.FilledProfileTestIdsParams = {
  orderTestIds: []
};

export const newDiagnosticOrderTestResultTechnicianNote: modelTypes.DiagnosticOrderTestResultTechnicianNote =
  {
    id: undefined,
    orderId: undefined,
    orderTestId: undefined,
    resultId: undefined,
    note: '',
    createdBy: undefined,
    createdDate: undefined
  };

export const newDiagnosticOrderTestResultTechnicianNoteCreateDTO: modelTypes.DiagnosticOrderTestResultTechnicianNoteCreateDTO =
  {
    resultId: undefined,
    orderTestId: undefined,
    note: ''
  };

export const newLabResultLogResponseVM: modelTypes.LabResultLogResponseVM = {
  id: undefined,
  resultId: undefined,
  action: '',
  oldValue: undefined,
  newValue: undefined,
  resultDate: '',
  createdBy: undefined
};

export const newDiagnosticOrderTestReportCreateRequestDTO: modelTypes.DiagnosticOrderTestReportCreateDTO =
  {
    orderId: undefined,
    orderTestId: undefined,
    report: '',
    severity: ''
  };

export const newDiagnosticOrderTestReportUpdateRequestDTO: modelTypes.DiagnosticOrderTestReportUpdateDTO =
  {
    id: undefined,
    report: '',
    severity: ''
  };

export const newDiagnosticOrderTestReportResponseVM: modelTypes.DiagnosticOrderTestReportResponseVM =
  {
    id: undefined,

    orderId: undefined,
    orderTestId: undefined,

    report: '',
    severity: '',

    approvedBy: undefined,
    approvedDate: undefined,

    rejectedBy: undefined,
    rejectedDate: undefined,
    rejectedReason: '',

    reviewBy: undefined,
    reviewDate: undefined,

    processingStatus: undefined,
    imageStatus: undefined,

    createdDate: undefined,
    createdBy: undefined,
    lastModifiedDate: undefined,
    lastModifiedBy: undefined
  };

export const newPatientHIPAA: modelTypes.PatientHIPAA = {
  patientId: undefined,
  noticeOfPrivacyPractice: false,
  privacyAuthorization: false,
  noticeOfPrivacyPracticeDate: null,
  privacyAuthorizationDate: null
};

export const newGeneralAssessment: modelTypes.GeneralAssessment = {
  id: undefined,
  patientId: null,
  encounterId: null,

  positionStatus: '',
  bodyMovements: '',
  levelOfConsciousness: '',
  facialExpression: '',
  speech: '',
  moodBehavior: '',

  memoryRemote: false,
  memoryRecent: false,
  signsOfAgitation: false,
  signsOfDepression: false,
  signsOfSuicidalIdeation: false,
  signsOfSubstanceUse: false,
  isTriage: false
};

// Backward-compat alias (in case any new-backend screens used the old name)
export const newApGeneralAssessment = newGeneralAssessment;

export const newChiefComplain: modelTypes.ChiefComplain = {
  id: undefined,
  patientId: null,
  encounterId: null,

  chiefComplaint: '',
  provocation: '',
  palliation: '',
  quality: '',
  region: '',
  severity: '',
  onsetDateTime: null,
  caseUnderstanding: '',
  patientCondition: null,
  isTriage: false
};

export const newEmergencyTriage: modelTypes.EmergencyTriage = {
  id: undefined,
  patientId: null,
  encounterId: null,

  emergencyLevel: null,

  rightEyeLightResponse: false,
  rightEyePupilSize: '',

  leftEyeLightResponse: false,
  leftEyePupilSize: '',

  hpiAdditionalNotes: '',

  lifeSaving: null,
  unresponsive: null,
  highRisk: null,

  avpuScale: null,
  painScore: null,

  labsRequired: null,
  imagingRequired: null,
  ivFluidsRequired: null,
  medicationRequired: null,
  ecgRequired: null,
  consultationRequired: null,

  destination: null
};

export const newPatientServiceAndProduct: modelTypes.PatientServiceAndProduct = {
  id: undefined,
  patientId: undefined,
  encounterId: undefined,
  billingItemType: undefined,

  brandMedicationId: undefined,
  diagnosticTestId: undefined,
  serviceId: undefined,
  procedureId: undefined,

  quantity: 0,
  unitPrice: 0,
  discountAmount: 0,
  exemptionAmount: 0,
  taxAmount: 0,
  currency: '',

  isBilled: false,
  billingInvoiceId: undefined,
  billingInvoiceItemId: undefined,
};

export const newPatientServiceProductCreateDTO: modelTypes.PatientServiceProductCreateDTO = {
  patientId: undefined,
  encounterId: undefined,
  billingItemType: undefined,

  brandMedicationId: undefined,
  diagnosticTestId: undefined,
  serviceId: undefined,
  procedureId: undefined,

  quantity: 1,
  unitPrice: 0,
  currency: ''};

export const newPatientServiceProductUpdateDTO: modelTypes.PatientServiceProductUpdateDTO = {
  id: undefined,
  billingItemType: undefined,

  brandMedicationId: undefined,
  diagnosticTestId: undefined,
  serviceId: undefined,
  procedureId: undefined,

  quantity: 0,
  unitPrice: 0,
  discountAmount: 0,
  exemptionAmount: 0,
  taxAmount: 0,
  totalAmount: 0,
  currency: '',
  notes: '',

  isBilled: false,
  billingInvoiceId: undefined,
  billingInvoiceItemId: undefined,
};
// =====================
// Consultation
// =====================

export const newConsultation: modelTypes.Consultation = {
  id: undefined,
  patientId: null,
  encounterId: 0,
  fromFacilityId: 0,
  toFacilityId: 0,
  fromDepartmentId: 0,
  toDepartmentId: null,
  consultationNumber: null,
  destinationType: 'DEPARTMENT',
  consultationType: '',
  consultantSpeciality: null,
  consultationMethod: '',
  practitionerId: null,
  consultationLevel: 'ROUTINE',
  consultationContent: '',
  notes: null,
  extraDocument: null,
  approvalNumber: null,
  status: 'REQUESTED',
  responseDate: null,
  responseBy: null,
  responseText: null,
  rejectedDate: null,
  rejectedBy: null,
  rejectReason: null,
  cancellationReason: null,
  cancelledDate: null,
  cancelledBy: null,
  confirmedDate: null,
  confirmedBy: null,
  submittedDate: null,
  submittedBy: null,
  createdBy: null,
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

export const newConsultationCreateVM: modelTypes.ConsultationCreateVM = {
  patientId: 0,
  encounterId: 0,
  fromFacilityId: 0,
  toFacilityId: 0,
  fromDepartmentId: 0,
  toDepartmentId: null,
  consultationType: '',
  consultantSpeciality: null,
  practitionerId: null,
  destinationType: 'DEPARTMENT',
  consultationMethod: '',
  consultationLevel: 'ROUTINE',
  consultationContent: '',
  notes: null,
  extraDocument: null,
  approvalNumber: null
};

export const newConsultationCancelVM: modelTypes.ConsultationCancelVM = {
  cancellationReason: ''
};

export const newConsultationRejectVM: modelTypes.ConsultationRejectVM = {
  reason: ''
};

export const newConsultationResponseVM: modelTypes.ConsultationResponseVM = {
  responseText: ''
};

export const newConsultationSubmitRequestVM: modelTypes.ConsultationSubmitRequestVM = {
  consultationIds: []
};

export const newTelephonicConsultation: modelTypes.TelephonicConsultations = {
  id: undefined,
  patientId: null,
  encounterId: 0,
  practitionerId: 0,
  dateOfCall: '',
  consultationContent: '',
  approvalNumber: null,
  notes: null,
  extraDocumentation: null,
  status: 'NEW'
};

export const newTelephonicConsultationCreateVM: modelTypes.TelephonicConsultationCreateVM = {
  patientId: 0,
  encounterId: 0,
  practitionerId: 0,
  dateOfCall: '',
  consultationContent: '',
  approvalNumber: null,
  notes: null,
  extraDocumentation: null
};

export const newTelephonicConsultationCancelVM: modelTypes.TelephonicConsultationCancelVM = {
  reason: ''
};
export const newNextOfKin: modelTypes.NextOfKin = {
  id: undefined,
  patientId: undefined,
  name: '',
  relationship: '',
  address: '',
  email: '',
  mobileNumber: '',
  telephone: null,
  internationalNumber: null,
  landlineNumber: null
};

export const newEncounterAssessment: modelTypes.EncounterAssessment = {
  id: undefined,
  patientId: null,
  userId: null,
  encounterId: null,
  assessment: '',

  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

export const newEncounterPlan: modelTypes.EncounterPlan = {
  id: undefined,
  patientId: null,
  encounterId: null,
  planInstructions: '',

  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

export const newPatientDiagnosis: modelTypes.PatientDiagnosis = {
  id: undefined,
  patientId: null,
  encounterId: null,
  diagnosisId: null,
  type: null,
  suspected: false,
  major: false,

  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};
export const newVitalSigns: modelTypes.VitalSigns = {
  id: undefined,

  patientId: 0,
  encounterId: 0,

  bloodPressureSystolic: null,
  bloodPressureDiastolic: null,
  measurementSite: null,

  heartRate: null,
  temperature: null,
  oxygenSaturation: null,
  respiratoryRate: null,

  isTriage: false,
  isActive: true,

  notes: null,

  createdDate: null,
  lastModifiedDate: null
};
export const newBodyMeasurements: modelTypes.BodyMeasurements = {
  id: undefined,

  patientId: 0,
  encounterId: 0,

  weight: null,
  height: null,
  headCircumference: null,

  isActive: true,

  createdDate: null,
  lastModifiedDate: null
};

export const newPatientObservationsComplaints: modelTypes.PatientObservationsComplaints = {
  id: undefined,

  patientId: 0,
  encounterId: 0,

  reasonOfVisit: null,
  latestFunctionalStatus: null,
  latestCognitiveCheck: null,

  isActive: true,
  functionalStatus: null,
  cognitiveCheck: null,
  createdDate: null,
  lastModifiedDate: null
};

export const newPainAssessment: modelTypes.PainAssessment = {
  id: undefined,

  patientId: 0,
  encounterId: 0,

  painDegree: null,
  painLevel: null,
  painDescription: null,

  isActive: true,

  createdDate: null,
  lastModifiedDate: null
};

export const newAdditionalMeasurements: modelTypes.AdditionalMeasurements = {
  id: undefined,

  patientId: 0,
  encounterId: 0,

  ageGroup: '',

  hearingTest: null,

  dehydration: false,
  nasalFlaring: false,
  responseToLight: false,
  pupilResponse: false,
  abilityToFollowTarget: false,
  colorTesting: false,

  fallRisk: false,
  visionProblemsAffectingFunction: false,
  hearingProblemsAffectingFunction: false,

  details: null,
  actionToTake: null,

  isActive: true,

  createdDate: null,
  lastModifiedDate: null
};

export const newPatientRelation: modelTypes.PatientRelation = {
  id: undefined,
  patientId: undefined,
  relatedPatientId: undefined,
  relationType: '',
  createdBy: '',
  createdDate: null,
  lastModifiedBy: '',
  lastModifiedDate: null
};

/**
 * relations_matrix response
 */
export const newRelationsMatrix: modelTypes.RelationsMatrix = {
  id: undefined,
  firstPatientGender: '',
  secondPatientGender: '',
  firstRelationCode: '',
  secondRelationCode: ''
};
export const newPatientAdministrativeWarning: modelTypes.PatientAdministrativeWarningsResponseVM = {
  id: undefined,
  patient: null,
  warningType: '',
  description: '',
  resolved: false,
  resolvedBy: null,
  resolvedDate: null,
  undoResolvedBy: null,
  undoResolvedDate: null,
  createdBy: null,
  createdDate: null
};

export const newPatientAdministrativeWarningCreateDTO: modelTypes.PatientAdministrativeWarningsCreateDTO =
  {
    patientId: undefined,
    warningType: undefined,
    description: ''
  };

export const newPatientAdministrativeWarningResolveDTO: modelTypes.PatientAdministrativeWarningsResolveDTO =
  {
    id: undefined
  };

export const newPatientAdministrativeWarningUndoResolveDTO: modelTypes.PatientAdministrativeWarningsUndoResolveDTO =
  {
    id: undefined
  };
export const newReferralRequest: modelTypes.ReferralRequest = {
  id: undefined,

  patientId: 0,
  encounterId: null,

  referralType: 'INTERNAL',

  fromFacilityId: 0,
  toFacilityId: 0,

  fromDepartmentId: 0,
  toDepartmentId: 0,

  referralReason: '',

  priority: null,

  status: 'REQUESTED',

  rejectReason: null,
  rejectedDate: null,
  rejectedBy: null,

  acceptedDate: null,
  acceptedBy: null
};
export const newRoom: modelTypes.Room = {
  id: undefined,
  facilityId: null,
  departmentType: null,
  departmentId: null,
  name: '',
  type: null,
  floor: null,
  isSpecificGender: false,
  gender: null,
  isActive: true,
  appointable: false,
  parallelCapacityValue: 1,
  defaultDurationMinutes: 0,
  defaultBufferBeforeMinutes: 0,
  defaultBufferAfterMinutes: 0
};

export const newBed: modelTypes.Bed = {
  id: undefined,
  roomId: null,
  name: '',
  locationDetails: null,
  type: null,
  status: null,
  isActive: true
};

export const newBedRoomServiceUpdateDTO: modelTypes.BedRoomService = {
  id: undefined,
  roomId: null,
  serviceId: null,
  bedSpecific: false,
  bedId: null,
  rule: null,
  isActive: true
};
export const newEncounterAssignToBed: modelTypes.EncounterAssignToBed = {
  id: undefined,
  encounter: null,
  patient: null,
  roomId: null,
  bedId: null,
  departmentId: null,
  admissionReason: null,
  assignedAt: null,
  releasedAt: null,
  isActive: true,
};
export const newBedTransaction: modelTypes.BedTransaction = {
  id: undefined,
  encounter: null,
  patient: null,
  fromRoomId: null,
  fromBedId: null,
  toRoomId: null,
  toBedId: null,
  departmentId: null,
  transactionType: null,
  transactionDate: null
};
export const newPatientEncounterDischarge: modelTypes.PatientEncounterDischarge = {
  encounterId: null,
  dischargeType: null,
  dischargeAt: null
};