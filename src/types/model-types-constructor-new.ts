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
  jobRole: null
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

// default empty object
export const newDiagnosticTestProfile: modelTypes.DiagnosticTestProfile = {
  id: undefined,
  testId: undefined,
  name: '',
  resultUnit: ''
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
  medicalCategoryId: null,
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
  isProfile: false,

  lovKeys: []
};

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

export const newProcedurePriceList: modelTypes.ProcedurePriceList = {
  id: undefined,
  procedureId: undefined,
  price: 0,
  currency: 'USD',
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
  hasActiveIngredient: false
  // 🟡 future fields (currently commented out in backend)
  // uomGroupId?: null,
  // uomGroupUnitId?: null
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
  departmentName: null
};

export const newCatalogCreateVM: modelTypes.CatalogCreateVM = {
  name: '',
  description: null,
  type: '',
  departmentId: 0
};

export const newCatalogUpdateVM: modelTypes.CatalogUpdateVM = {
  name: '',
  description: null,
  type: '',
  departmentId: 0
};
export const CatalogDiagnosticTest: modelTypes.CatalogDiagnosticTest = {
  id: 0,
  catalogId: 0,
  diagnosticTestId: 0
};
export const CatalogAddTestsVM: modelTypes.CatalogAddTestsVM = {
  testIds: []
};

export const newActiveIngredientAdverseEffect: modelTypes.ActiveIngredientAdverseEffect = {
  id: undefined,
  activeIngredientId: 0,
  adverseEffect: ''
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

  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

export const newAddress: modelTypes.Address = {
  id: undefined,
  patientId: 0,
  country: '',
  stateProvince: '',
  city: '',
  streetName: '',
  houseApartmentNumber: '',
  postalZipCode: '',
  additionalAddressLine: '',
  countryId: '',
  isCurrent: true,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
};

export const  newPatientHIPAA:modelTypes.PatientHIPAA= {
  patientId: undefined,
  noticeOfPrivacyPractice: false,
  privacyAuthorization: false,
  noticeOfPrivacyPracticeDate:  null,
  privacyAuthorizationDate: null,
}
export const newPatientRelation:modelTypes.PatientRelation= {
  id: undefined,
  patientId: undefined,
  relatedPatientId: undefined,
  relationType: '',
  createdBy: '',
  createdDate: null,
  lastModifiedBy: '',
  lastModifiedDate: null
}

/**
 * relations_matrix response
 */
export const newRelationsMatrix:modelTypes.RelationsMatrix= {
  id: undefined,
  firstPatientGender: '',
  secondPatientGender: '',
  firstRelationCode: '',
  secondRelationCode: ''
}