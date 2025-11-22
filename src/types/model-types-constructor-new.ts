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
  jobRole: null
};

// ------------------- Candidate -------------------
export const newCandidate: modelTypes.Candidate = {
  id: undefined,
  rule: '',
  fields: {},
  isActive: true
};

// ------------------- Department -------------------
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
  ruleId: null
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
  isActive: true
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
  currency: 'USD',
  isActive: true,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null,
  facilityId: undefined
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

// ------------------- Language -------------------
export const newLanguage: modelTypes.Language = {
  id: undefined,
  langKey: undefined,
  langName: undefined,
  direction: undefined,
  details: undefined
};

// ------------------- Practitioner -------------------
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

// ------------------- Language Translation -------------------
export const newLanguageTranslation: modelTypes.LanguageTranslation = {
  id: undefined,
  langKey: undefined,
  translationKey: undefined,
  translationText: undefined,
  verified: undefined,
  translated: undefined
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
  facilityId: undefined
};

// ------------------- Allergen -------------------
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

// ------------------- Diagnostic Test -------------------
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
  isProfile: false,
  appointable: false
};

// ------------------- Laboratory -------------------
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
  isProfile: false,
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

// ------------------- DiagnosticTestProfile -------------------
export const newDiagnosticTestProfile: modelTypes.DiagnosticTestProfile = {
  id: undefined,
  testId: undefined,
  name: '',
  resultUnit: ''
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
  testId: 0
};

// ------------------- Ingredient Synonym -------------------
export const newActiveIngredientSynonym: modelTypes.ActiveIngredientSynonym = {
  id: undefined,
  activeIngredientId: 0,
  synonym: ''
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

// ------------------- Dental Action -------------------
export const newDentalAction: modelTypes.DentalAction = {
  id: null,
  description: '',
  type: null,
  imageName: null,
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
  isProfile: false,
  lovKeys: []
};

// ------------------- Procedure Coding -------------------
export const newProcedureCoding: modelTypes.ProcedureCoding = {
  id: undefined,
  procedureId: undefined,
  codeType: 'CPT_CODES',
  codeId: '',
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

// ------------------- Brand Medication -------------------
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
  hasActiveIngredient: false
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
  lastModifiedDate: null
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
  facilityName: null
};

// ------------------- Catalog Create VM -------------------
export const newCatalogCreateVM: modelTypes.CatalogCreateVM = {
  name: '',
  description: null,
  type: '',
  departmentId: 0,
  facilityId: 0
};

// ------------------- Catalog Update VM -------------------
export const newCatalogUpdateVM: modelTypes.CatalogUpdateVM = {
  name: '',
  description: null,
  type: '',
  departmentId: 0,
  facilityId: 0
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
  isActive: true
};

// ------------------- Community Area -------------------
export const newCommunityArea: modelTypes.CommunityArea = {
  id: undefined,
  communityId: undefined,
  name: '',
  isActive: true
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
  lastModifiedDate: null
};

export const newUserStickyNotesCreateVM: modelTypes.UserStickyNotesCreateVM = {
  userId: undefined,
  note: '',
  priority: '',
  priorityOrder: 0,
  color: '--note-purple'
};

// ------------------- Price List Item -------------------
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

// ------------------- Referral Request -------------------
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

// ------------------- Billing Invoice -------------------
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

// ------------------- Payor Plan -------------------
export const newPayorPlan: modelTypes.PayorPlan = {
  id: undefined,
  payorId: 0,
  name: '',
  planType: null,
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
  totalPaid: 0
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
  mrn: '',
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
  securityAccessLevel:null,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

export const newAddress: modelTypes.Address = {
  id: undefined,
  patientId: 0, // يتم تعبئته من الـ route أو من الـ context

  countryId: null,

  countryName: '',
  districtName: '',
  communityName: '',
  areaName: '',
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

export const newPatientPreferredHealthProfessional: modelTypes.PatientPreferredHealthProfessional = {
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