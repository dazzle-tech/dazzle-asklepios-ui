import { tr } from 'date-fns/locale';
import * as modelTypes from './model-types-new';

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

export const newCandidate: modelTypes.Candidate = {
  id: undefined,
  rule: '',
  fields: {},
  isActive: true
};

export const newDepartment: modelTypes.Department = {
  id: undefined,
  facilityId: undefined,
  name: '',
  createdBy: '',
  createdDate: undefined,
  lastModifiedBy: undefined,
  lastModifiedDate: undefined,
  departmentType: undefined,
  appointable: undefined,
  departmentCode: '',
  phoneNumber: '',
  email: '',
  encounterType: undefined,
  isActive: true,
  hasMedicalSheets: false,
  hasNurseMedicalSheets: false
};

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
  ruleId: null
};

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
  isActive: true
};

export const newRole: modelTypes.Role = {
  id: undefined,
  name: '',
  type: '',
  facilityId: null
};

export const newUserRole: modelTypes.UserRole = {
  roleId: undefined,
  userId: undefined
};

export const newUserDepartment: modelTypes.UserDepartment = {
  id: undefined,
  userId: undefined,
  departmentId: undefined,
  isActive: true,
  isDefault: false
};

// Patient Attachment Constructors
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

// Encounter Attachment Constructors
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

export const newService: modelTypes.Service = {
  id: undefined,
  name: '',
  abbreviation: null,
  code: '',
  category: null,
  price: null,
  currency: 'USD',
  isActive: true,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null,
  facilityId: undefined
};

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
  id: undefined,
  langKey: undefined,
  langName: undefined,
  direction: undefined,
  details: undefined
};

export const newPractitioner: modelTypes.Practitioner = {
  id: undefined,
  facilityId: null,
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
  userId: null,
  defaultLicenseValidUntil: undefined,
  secondaryLicenseValidUntil: undefined,
  dateOfBirth: undefined,
  jobRole: null,
  gender: null,
  isActive: true
};

export const newLanguageTranslation: modelTypes.LanguageTranslation = {
  id: undefined,
  langKey: undefined,
  translationKey: undefined,
  translationText: undefined,
  verified: undefined,
  translated: undefined
};

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
  facilityId: undefined
};

export const newAllergen: modelTypes.Allergen = {
  id: undefined,
  name: '',
  type: null,
  description: '',
  isActive: true,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

// constructor/default object aligned with domain defaults
export const newDiagnosticTest: modelTypes.DiagnosticTest = {
  id: undefined,
  type: null,
  name: null,
  internalCode: null,

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
  listOfValueId: null
};

export const newDiagnosticOrderTestCollectedSample: modelTypes.DiagnosticOrderTestCollectedSampleDTO = {
  orderId: 0,
  orderTestId: 0,
  unit: '',
  quantity: 0,
  collectedAt: '',
};

export const newDiagnosticOrderTestCollectedSampleBulkSame: modelTypes.DiagnosticOrderTestCollectedSampleBulkSameDTO = {
  orderId: 0,
  orderTestIds: [],
  unit: '',
  quantity: 0,
  collectedAt: '',
};

export const newDiagnosticOrderTestCollectedSampleResponse: modelTypes.DiagnosticOrderTestCollectedSampleResponseVM = {
  id: 0,
  orderId: 0,
  orderTestId: 0,
  unit: '',
  quantity: 0,
  collectedAt: '',
  createdBy: null,
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null,
};

export const newLaboratory: modelTypes.Laboratory = {
  id: null,
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

export const newDiagnosticTestProfile: modelTypes.DiagnosticTestProfile = {
  name: '',
  resultUnit: null,
  resultType: null,
  listOfValueId: null,
  isDefault: false,
  isActive: true
};

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

export const newMedicationCategory: modelTypes.MedicationCategory = {
  id: undefined,
  name: ''
};

export const newMedicationCategoryClass: modelTypes.MedicationCategoryClass = {
  id: undefined,
  name: '',
  medicationCategoriesId: undefined
};

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

export const newActiveIngredientPreRequestedTest: modelTypes.ActiveIngredientPreRequestedTest = {
  id: undefined,
  activeIngredientId: 0,
  testId: 0
};

export const newActiveIngredientSynonym: modelTypes.ActiveIngredientSynonym = {
  id: undefined,
  activeIngredientId: 0,
  synonym: ''
};
export const newActiveIngredientSpecialPopulation: modelTypes.ActiveIngredientSpecialPopulation = {
  id: undefined,
  activeIngredientId: 0,
  specialPopulation: '',
  considerations: ''
};

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

export const newProcedurePriceList: modelTypes.ProcedurePriceList = {
  id: undefined,
  procedureId: undefined,
  price: 0,
  currency: 'USD'
};

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
  id: undefined, // Optional because it's generated by backend
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
  hasActiveIngredient: false
};

export const newSubstitute: modelTypes.Substitute = {
  brandId: undefined,
  alternativeBrandId: undefined
};
export const newPrescriptionInstructions: modelTypes.prescriptionInstructions = {
  id: undefined,
  category: '',
  dose: 0,
  unit: '',
  rout: '',
  frequency: ''
};

export const newActiveIngredientIndication: modelTypes.ActiveIngredientIndication = {
  id: undefined,
  activeIngredientId: 0,
  icdCodeId: 0,
  dosage: null,
  unit: '',
  isOffLabel: false
};

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
  lastModifiedDate: null
};
export const newCdtDentalAction: modelTypes.CdtDentalAction = {
  dentalActionId: undefined,
  cdtId: undefined
};

export const newBrandMedicationActiveIngredient: modelTypes.BrandMedicationActiveIngredient = {
  id: undefined,
  brandId: undefined,
  activeIngredientId: undefined,
  strength: undefined,
  unit: ''
};

export const newCatalogResponseVM: modelTypes.CatalogResponseVM = {
  id: 0,
  name: '',
  description: null,
  type: '',
  departmentId: 0,
  departmentName: null,
  facilityId: 0,
  facilityName: null
};

export const newCatalogCreateVM: modelTypes.CatalogCreateVM = {
  name: '',
  description: null,
  type: '',
  departmentId: undefined,
  facilityId: undefined
};

export const newCatalogUpdateVM: modelTypes.CatalogUpdateVM = {
  name: '',
  description: null,
  type: '',
  departmentId: undefined,
  facilityId: undefined
};
export const CatalogDiagnosticTest: modelTypes.CatalogDiagnosticTest = {
  id: 0,
  catalogId: 0,
  diagnosticTestId: 0
};
export const CatalogAddTestsVM: modelTypes.CatalogAddTestsVM = {
  testIds: []
};

export const newUOMGroup: modelTypes.uomGroup = {
  id: undefined,
  description: '',
  name: ''
};

export const newUOMGroupUnit: modelTypes.UOMGroupUnit = {
  id: undefined,
  uom: '',
  uomOrder: 0
  // uom_group_id: undefined
};

export const newUOMGroupRelation: modelTypes.UOMGroupRelation = {
  id: undefined,
  relation: 0,
  // uom_group_id: undefined,
  fromUnitId: undefined,
  toUnitId: undefined
};

export const newActiveIngredientAdverseEffect: modelTypes.ActiveIngredientAdverseEffect = {
  id: undefined,
  activeIngredientId: 0,
  adverseEffect: ''
};

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

export const newCountry: modelTypes.Country = {
  id: undefined,
  name: '',
  code: '',
  isActive: true
};
export const newCountryDistrict: modelTypes.CountryDistrict = {
  id: undefined,
  countryId: undefined,
  name: '',
  code: '',
  isActive: true
};

export const newDistrictCommunity: modelTypes.DistrictCommunity = {
  id: undefined,
  districtId: undefined,
  name: '',
  isActive: true
};

export const newCommunityArea: modelTypes.CommunityArea = {
  id: undefined,
  communityId: undefined,
  name: '',
  isActive: true
};

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

export const newReportTemplate: modelTypes.ReportTemplate = {
  id: 0,
  name: null,
  templateValue: null,
  isActive: true
};

export const newDiagnosticTestReportTemplate: modelTypes.DiagnosticTestReportTemplate = {
  id: 0,
  diagnosticTest: null,
  name: null,
  templateValue: null,
  isActive: true
};

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
  patientId: ''
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

export const newReferralRequest: modelTypes.ReferralRequest = {
  id: null,
  patientId: null,
  encounterId: null,
  referralType: 'INTERNAL',
  facilityId: null,
  departmentId: null,
  referralReason: '',
  priority: null,
  isActive: true
};
// Billing Invoice

export const newBillingInvoice: modelTypes.BillingInvoiceCreateVM = {
  facilityId: 0,
  patientKey: null,
  encounterKey: null,
  totalAmount: 0,
  paidAmount: 0,
  balanceAmount: 0,
  currency: null
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
  payorId: 0,
  name: '',
  planType: null,
  itemType: null,
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

// Billing Invoice Item

export const newBillingInvoiceItem: modelTypes.BillingInvoiceItemCreateVM = {
  invoiceId: 0,
  nurseServiceProductKey: null,
  code: null,
  quantity: 0,
  unitPrice: 0,
  totalPrice: 0,
  currency: null
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

// Patient Payment

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

// Payment Allocation

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

// Patient Account Summary

export const newPatientAccountSummary: modelTypes.PatientAccountSummaryVM = {
  patientKey: '',
  freeBalance: 0,
  outstandingBalance: 0,
  totalInvoiced: 0,
  totalPaid: 0
};
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
  taxValue: undefined
};

export const newFormTemplate: modelTypes.FormTemplate = {
  id: undefined,
  name: null,
  description: null,
  facilityId: null,
  departmentId: null,
  formJson: null
};

export const newFavoriteDiagnosticTest: modelTypes.FavoriteDiagnosticTest = {
  id: undefined,
  userId: undefined,
  testId: undefined
}

export const newDiagnosticOrder: modelTypes.DiagnosticOrder = {
  id: undefined,

  patientId: undefined,
  encounterId: undefined,
  submittedBy: undefined,
  submittedDate: undefined,

  isUrgent: false,

  labStatus: modelTypes.DiagnosticStatus.NEW,
  radStatus: modelTypes.DiagnosticStatus.NEW,
};

export const newDiagnosticOrderTest: modelTypes.DiagnosticOrderTest = {
  id: undefined,


  orderId: undefined,
  testId: undefined,

  receivedDepartmentId: undefined,

  reason: undefined,
  notes: undefined,

  status: modelTypes.DiagnosticOrderTestStatus.NEW,
  processingStatus: modelTypes.DiagnosticStatus.NEW,

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
  cancelledBy: undefined,
};

export const newDiagnosticOrderTestResultCreate: modelTypes.DiagnosticOrderTestResultCreateDTO = {
  orderId: 0,
  orderTestId: 0,
  profileTestId: null,

  resultValueNumber: null,
  resultValueText: null,

  marker: null,
  normalRangeValue: null
};

export const newDiagnosticOrderTestResultUpdate: modelTypes.DiagnosticOrderTestResultUpdateDTO = {
  id: 0,

  orderId: 0,
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

export const newDiagnosticOrderTestResultResponse: modelTypes.DiagnosticOrderTestResultResponseVM = {
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

export const newDiagnosticOrderTestResultTechnicianNote
  : modelTypes.DiagnosticOrderTestResultTechnicianNote = {
  id: undefined,
  orderId: undefined,
  orderTestId: undefined,
  resultId: undefined,
  note: '',
  createdBy: undefined,
  createdDate: undefined,
};

export const newDiagnosticOrderTestResultTechnicianNoteCreateDTO: modelTypes.DiagnosticOrderTestResultTechnicianNoteCreateDTO = {
  orderId: undefined,
  orderTestId: undefined,
  note: '',
};

export const newLabResultLogResponseVM: modelTypes.LabResultLogResponseVM = {
  id: undefined,
  resultId: undefined,
  action: '',
  oldValue: undefined,
  newValue: undefined,
  resultDate: '',
  createdBy: undefined,
};

export const newPatientArrivedCreateRequestDTO: modelTypes.PatientArrivedCreateRequestDTO = {
  arrivedAt: undefined,
  notes: '',
};

export const newPatientArrivedResponseVM: modelTypes.PatientArrivedResponseVM = {
  id: undefined,
  diagnosticOrderTestId: undefined,
  arrivedAt: undefined,
  notes: '',
  createdBy: undefined,
  createdDate: undefined,
};

export const newDiagnosticOrderTestReportCreateRequestDTO: modelTypes.DiagnosticOrderTestReportCreateDTO =
  {
    orderId: undefined,
    orderTestId: undefined,
    report: '',
    severity: '',
    processingStatus: undefined,
    imageStatus: undefined,
  };

export const newDiagnosticOrderTestReportUpdateRequestDTO: modelTypes.DiagnosticOrderTestReportUpdateDTO =
  {
    id: undefined,
    report: '',
    severity: '',
    processingStatus: undefined,
    imageStatus: undefined,
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
    lastModifiedBy: undefined,
  };
