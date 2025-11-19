export interface ApUser {
  id?: number;
  login: string;
  passwordHash: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  imageUrl?: string | null;
  activated: boolean;
  langKey?: string | null;
  resetKey?: string | null;
  createdBy: string;
  createdDate?: Date | null;
  resetDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
  phoneNumber?: string | null;
  birthDate?: Date | null;
  gender?: string | null;
  jobDescription?: string | null;
  jobRole?: string | null;
}



export interface Candidate {
  id?: number;
  rule?: string;
  fields?: Record<string, boolean>;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  isActive?: boolean;
}
export interface Department {
  id: number;
  facilityId: string;
  name: string;
  createdBy: string;
  createdDate: number;
  lastModifiedBy: string;
  lastModifiedDate: number;
  departmentType: string;
  appointable: boolean;
  departmentCode: string;
  phoneNumber: string;
  email: string;
  encounterType: string;
  isActive: boolean;
  hasMedicalSheets: boolean;
  hasNurseMedicalSheets: boolean
}
export interface Facility {
  id?: string;
  name?: string;
  code?: string;
  emailAddress?: string;
  phone1?: string;
  phone2?: string;
  fax?: string;
  addressId?: string;
  type: string;
  defaultCurrency: string;
  isActive?: boolean;
  ruleId?: number;
}


export interface CreateFacility {
  name?: string;
  code?: string;
  emailAddress?: string;
  phone1?: string;
  phone2?: string;
  fax?: string;
  addressId?: string;
  type: string;
  defaultCurrency: string;
  isActive?: boolean;
}
export interface Role {
  id?: string;
  name?: string;
  type?: string;
  facilityId?: string;
}
export interface UserRole {
  roleId?: string;
  userId?: string;
}
export interface UserDepartment {
  id?: number;
  userId: number;
  facilityId?: string | null;
  departmentId: number;
  isActive?: boolean;
  isDefault?: boolean;
};


export interface Service {
  id?: number;
  name: string;
  abbreviation?: string | null;
  code: string;
  category?: string | null;
  price?: number | null;
  currency: string | null;
  isActive?: boolean;
  createdBy?: string;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
  facilityId?: number;
}


export interface ServiceItem {
  id?: number;
  type: string;       // @Enumerated(EnumType.STRING)
  sourceId: number;             // FK to the source entity (e.g., Department id)
  serviceId?: number | null;    // ManyToOne -> Service (nullable on the wire)
  createdBy: string;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
  isActive: boolean;
}

/** Create payload (POST /api/setup/service-items) */
export interface ServiceItemCreate {
  type: string;
  sourceId: number;
  serviceId: number;            // required by backend create
  createdBy?: string;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
  isActive?: boolean | null;
}

/** Update payload (PUT /api/setup/service-items/{id}) */
export interface ServiceItemUpdate {
  id: number;
  type?: string | null;
  sourceId?: number | null;
  serviceId: number;            // required by backend update
  isActive?: boolean | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

export interface Language {
  id: number;
  langKey: string;
  langName: string;
  direction: string;
  details?: string | null;
}

export interface LanguageTranslation {
  id: number;
  langKey: string;
  translationKey: string;
  translationText?: string;
  verified: boolean;
  translated: boolean;
}

export interface AgeGroup {
  id?: number;
  ageGroup: string | null;
  fromAge: number | null;
  toAge: number | null;
  fromAgeUnit: string | null;
  toAgeUnit: string | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
  facilityId?: number;          // FK
}
export interface Practitioner {
  id?: number;
  facilityId: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phoneNumber?: string | null;
  specialty: string;
  subSpecialty?: string | null;
  defaultMedicalLicense?: string | null;
  secondaryMedicalLicense?: string | null;
  educationalLevel?: string | null;
  appointable?: boolean;
  userId: number;
  defaultLicenseValidUntil?: string | null;
  secondaryLicenseValidUntil?: string | null;
  dateOfBirth?: string | null;
  jobRole?: string | null;
  gender?: string | null;
  isActive?: boolean;
  createdBy?: string;
  createdDate?: Date | null;
  lastModifiedBy?: string | null
};

//Patient Attachment
export interface PatientAttachment {
  id: number;
  patientId: number;
  spaceKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  type?: string;
  details?: string;
  source?: string;
  createdBy?: string;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}
// Encounter Attachment
export interface EncounterAttachment {
  id: number;
  encounterId: number;
  spaceKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  type?: string;
  details?: string;
  source?: string;
  sourceId?: number; // Link to specific order/medication within encounter
  createdBy?: string;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

// Inventory Transfer Attachment
export interface InventoryTransferAttachment {
  id: number;
  transactionId: number;
  spaceKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdBy?: string;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

// Inventory Transaction Attachment
export interface InventoryTransactionAttachment {
  id: number;
  transactionId: number;
  spaceKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdBy?: string;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

// Response Types
export interface UploadResponse {
  id: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
}

export interface Allergen {
  id?: number;
  name: string;
  type: string;
  description?: string | null;
  isActive?: boolean;
  createdBy?: string;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}
// Download Attachment Ticke

export interface DownloadTicket {
  url: string;
  expiresInSeconds: number;
}

// Request Types
export interface UploadPatientAttachmentParams {
  patientId: number;
  file: File;
  type?: string;
  details?: string;
  source?: string;
}

export interface UploadEncounterAttachmentParams {
  encounterId: number;
  file: File;
  type?: string;
  details?: string;
  source?: string;
  sourceId?: number;
}

export interface UploadInventoryTransferAttachmentParams {
  transactionId: number;
  file: File;
}

export interface UploadInventoryTransactionAttachmentParams {
  transactionId: number;
  file: File;
}

export interface Service {
  id?: number;
  name: string;
  abbreviation?: string | null;
  code: string;
  category?: string | null;
  price?: number | null;
  currency: string | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

export interface AgeGroup {
  id?: number;
  ageGroup: string | null;
  fromAge: number | null;
  toAge: number | null;
  fromAgeUnit: string | null;
  toAgeUnit: string | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
  facilityId?: number;
}

export interface Procedure {
  id?: number;
  name: string;
  code: string;
  categoryType?: string | null;
  isAppointable?: boolean;
  indications?: string | null;
  contraindications?: string | null;
  preparationInstructions?: string | null;
  recoveryNotes?: string | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
  facilityId?: number;
}
export interface DiagnosticTest {
  id?: number;
  type: string;
  name: string;
  internalCode: string;
  ageSpecific?: boolean;

  ageGroupList?: string[];

  genderSpecific?: boolean;
  gender?: string;

  specialPopulation?: boolean;
  specialPopulationValues?: string[];

  price?: number;
  currency?: string;
  specialNotes?: string;
  isActive?: boolean;
  isProfile?: boolean;
  appointable?: boolean;
}


export interface Laboratory {
  id?: number;
  testId?: number;
  property?: string;
  system?: string;
  scale?: string;
  reagents?: string;
  method?: string;
  testDurationTime?: number;
  timeUnit?: string;
  resultUnit?: string;
  isProfile?: boolean;
  sampleContainer?: string;
  sampleVolume?: number;
  sampleVolumeUnit?: string;
  tubeColor?: string;
  testDescription?: string;
  sampleHandling?: string;
  turnaroundTime?: number;
  turnaroundTimeUnit?: string;
  preparationRequirements?: string;
  medicalIndications?: string;
  associatedRisks?: string;
  testInstructions?: string;
  category?: string;
  tubeType?: string;
  timing?: String;
}


export interface DiagnosticTestProfile {
  id?: number;
  testId?: number;
  name?: string;
  resultUnit?: string;
}

export interface Pathology {
  id?: number;
  testId?: number;
  category?: string;
  specimenType?: string;
  analysisProcedure?: string;
  turnaroundTime?: number;
  timeUnit?: string;
  testDescription?: string;
  sampleHandling?: string;
  medicalIndications?: string;
  criticalValues?: string;
  preparationRequirements?: string;
  associatedRisks?: string;
}

export interface Radiology {
  id?: number;
  testId: number;
  category: string;
  imageDuration?: number | null;
  testInstructions?: string | null;
  medicalIndications?: string | null;
  turnaroundTimeUnit?: string | null;
  turnaroundTime?: number | null;
  associatedRisks?: string | null;
}


export interface MedicationCategory {
  id: number;
  name: string;
}
export interface MedicationCategoryClass {
  id: number;
  name: string;
  medicationCategoriesId: number
}


/** Active Ingredient */
export interface ActiveIngredient {
  id?: number;
  name: string;
  medicalCategoryId?: number | null;
  drugClassId?: number | null;
  atcCode?: string | null;
  otc?: boolean | null;
  hasSynonyms?: boolean | null;
  antimicrobial?: boolean | null;
  highRiskMed?: boolean | null;
  abortiveMedication?: boolean | null;
  laborInducingMed?: boolean | null;
  isControlled?: boolean | null;
  controlled?: string | null;
  hasBlackBoxWarning?: boolean | null;
  blackBoxWarning?: string | null;
  isActive?: boolean | null;
  toxicityMaximumDose?: string | null;
  toxicityMaximumDosePerUnit?: string | null;
  toxicityDetails?: string | null;
  mechanismOfAction?: string | null;
  pharmaAbsorption?: string | null;
  pharmaRouteOfElimination?: string | null;
  pharmaVolumeOfDistribution?: string | null;
  pharmaHalfLife?: string | null;
  pharmaProteinBinding?: string | null;
  pharmaClearance?: string | null;
  pharmaMetabolism?: string | null;
  pregnancyCategory?: string | null;
  pregnancyNotes?: string | null;
  lactationRisk?: string | null;
  lactationRiskNotes?: string | null;
  doseAdjustmentRenal?: boolean | null;
  doseAdjustmentRenalOne?: string | null;
  doseAdjustmentRenalTwo?: string | null;
  doseAdjustmentRenalThree?: string | null;
  doseAdjustmentRenalFour?: string | null;
  doseAdjustmentHepatic?: boolean | null;
  doseAdjustmentPugA?: string | null;
  doseAdjustmentPugB?: string | null;
  doseAdjustmentPugC?: string | null;
  createdBy?: string | null;
  createdDate?: Date | string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | string | null;
}


export interface ActiveIngredientSynonym {
  id?: number;
  activeIngredientId: number;
  synonym: string;
}

export interface ActiveIngredientContraindication {
  id?: number;
  activeIngredientId: number;
  icdCodeId: number;
  createdBy?: string | null;
  createdDate?: Date | string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | string | null;
}


export interface DentalAction {
  id?: number;                 // Primary key (auto-generated)
  description: string;         // Mandatory field
  type: string;      // Enum (mandatory)
  imageName?: string | null;   // Optional image file name
  isActive?: boolean;          // Defaults true
}



export interface DiagnosticTestNormalRange {
  id?: number;
  testId: number;

  gender?: string;
  ageFrom?: number;
  ageFromUnit?: string;
  ageTo?: number;
  ageToUnit?: string;
  condition?: string;

  resultType: string;
  resultText?: string;
  resultLov?: string;
  normalRangeType?: string;

  rangeFrom?: number;
  rangeTo?: number;

  criticalValue?: boolean;
  criticalValueLessThan?: number;
  criticalValueMoreThan?: number;

  profileTestId?: number | null;
  isProfile?: boolean;

  lovKeys?: string[];
}


export interface ProcedureCoding {
  id?: number;
  procedureId?: number | null;
  codeType: string | null;
  codeId: string;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

export interface CodeOption {
  id: number | string;
  code: string;
  description: string;
}


export interface ProcedurePriceList {
  id?: number;
  procedureId?: number | null;
  price: number;
  currency: string;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}
export interface DiagnosticTestCoding {
  id?: number;
  procedureId?: number | null;
  codeType: string | null;
  codeId: string;
  createdBy:string
  createdDate: Date,
  lastModifiedBy: string,
  lastModifiedDate: Date,
}
export interface Vaccine {
  id?: number;
  name: string;
  atcCode?: string | null;
  type: string;
  roa: string;
  siteOfAdministration?: string | null;
  postOpeningDuration?: number | null;
  durationUnit?: string | null;
  numberOfDoses?: string | null;
  indications?: string | null;
  possibleReactions?: string | null;
  contraindicationsAndPrecautions?: string | null;
  storageAndHandling?: string | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

export interface VaccineBrand {
  id?: number;
  vaccineId: number;
  name: string;
  manufacture: string;
  volume: number;
  unit: string;
  marketingAuthorizationHolder?: string | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}
export interface VaccineDose {
  id?: number;
  vaccineId: number;
  doseNumber: string;
  fromAge?: number | null;
  toAge?: number | null;
  fromAgeUnit?: string | null;
  toAgeUnit?: string | null;
  isBooster?: boolean;
  isActive?: boolean;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}
export interface VaccineDosesInterval {
  id?: number;
  vaccineId: number;
  fromDoseId: number;
  toDoseId: number;
  intervalBetweenDoses: number;
  unit: string | null;
  isActive?: boolean;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}


export interface BrandMedication {
  id?: number; // Optional because it's generated by backend
  name: string;
  code?: string;
  manufacturer?: string;
  dosageForm: string;
  usageInstructions?: string;
  storageRequirements?: string;
  expiresAfterOpening?: boolean;
  expiresAfterOpeningValue?: number;
  expiresAfterOpeningUnit?: string;
  useSinglePatient?: boolean;
  highCostMedication?: boolean;
  costCategory?: string;
  roa?: string;
  isActive?: boolean;
  uomGroupId?: number;
  uomGroupUnitId?: number;
  hasActiveIngredient?:boolean;
}
export interface Substitute {
  brandId: number;
  alternativeBrandId: number;
}
export interface prescriptionInstructions {
  id?: number;
  category: string;
  dose: number;
  unit: string;
  rout: string;
  frequency: string;
}

export interface CdtDentalAction {
  id?: number;
  dentalActionId: number;
  cdtId: number;
};


export interface ActiveIngredientIndication {
  id?: number;
  activeIngredientId: number;
  icdCodeId: number;
  dosage?: number | string | null;
  unit?: string | null;
  isOffLabel?: boolean | null;
  createdBy?: string | null;
  createdDate?: Date | string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | string | null;
}

export interface BrandMedicationActiveIngredient {
  id: number;
  brandId: number;
  activeIngredientId: number;
  strength: number;
  unit: string
}

export type CatalogResponseVM = {
  id: number;
  name: string;
  description?: string | null;
  type: string;
  departmentId: number;
  departmentName?: string | null;
  facilityId: number;
  facilityName: string | null;
};

export type CatalogCreateVM = {
  name: string;
  description?: string | null;
  type: string;
  facilityId: number;
  departmentId: number;
};

export type CatalogUpdateVM = {
  name?: string;
  description?: string | null;
  type?: string;
  departmentId?: number;
  facilityId: number;
};

export type CatalogDiagnosticTest = {
  id: number;
  catalogId: number;
  diagnosticTestId: number;
};
export type CatalogAddTestsVM = {
  testIds: number[];
};

export interface uomGroup {
  id?: number;
  description: string;
  name: string;
}


export interface UOMGroupUnit {
  id?: number;
  uom: string;
  uomOrder: number;
  // uom_group_id: number;
}

export interface UOMGroupRelation {
  id?: number;
  relation: number;
  // uom_group_id: number;  
  fromUnitId: number;
  toUnitId: number;
}
export interface ActiveIngredientAdverseEffect {
  id?: number;
  activeIngredientId: number;
  adverseEffect: string;
}

export interface ActiveIngredientDrugInteraction {
  id?: number;
  activeIngredientId: number;
  interactedIngredientId: number;
  severity: string;
  description?: string | null;
  createdBy: string,
  createdDate: Date,
  lastModifiedBy: string,
  lastModifiedDate: Date,
}

export interface ActiveIngredientPreRequestedTest {
  id?: number;
  activeIngredientId: number;
  testId: number;
  createdBy?: string | null;
  createdDate?: Date | string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | string | null;
}

export interface ActiveIngredientFoodInteraction {
  id?: number;
  activeIngredientId: number;
  food: string;
  severity: string;
  description?: string | null;
  createdBy: string,
  createdDate: Date,
  lastModifiedBy: string,
  lastModifiedDate: Date,
}

export interface ActiveIngredientSpecialPopulation {
  id?: number;
  activeIngredientId: number;
  specialPopulation: string;
  considerations?: string | null;
}

export interface ActiveIngredientContraindication {
  id?: number;
  activeIngredientId: number;
  icdCodeId: number;
  createdBy?: string | null;
  createdDate?: Date | string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | string | null;
}
export interface InventoryProduct {
  id?: number;
  name: string;
  type: string;
  code?: string | null;
  barcode?: string | null;
  brandId?: string | null;
  uomGroupId?: string | null;
  baseUom?: number | null;
  dispenseUom?: string | null;
  controlledSubstance?: boolean | null;
  hazardousBiohazardousTag?: string | null;
  allergyRisk?: boolean | null;
  itemAverageCost?: number | null;
  pricePerBaseUom?: string | null;
  warrantyStartDate?: Date | null;
  warrantyEndDate?: Date | null;
  maintenanceSchedule?: number | null;
  maintenanceScheduleType?: string | null;
  criticalEquipment?: boolean | null;
  calibrationRequired?: boolean | null;
  trainingRequired?: boolean | null;
  batchManaged?: boolean | null;
  expiryDateMandatory?: boolean | null;
  reusable?: boolean | null;
  inventoryType?: string | null;
  shelfLife?: number | null;
  shelfLifeUnit?: string | null;
  leadTime?: number | null;
  leadTimeUnit?: string | null;
  erpIntegrationId?: string | null;
  isActive?: boolean | null;
}
export interface Country {
  id?: number;
  name: string;
  code: string;
  isActive?: boolean;
}
export interface CountryDistrict {
  id?: number;
  countryId: number;
  name: string;
  code: string;
  isActive?: boolean;
}

export interface DistrictCommunity {
  id?: number;
  districtId: number;
  name: string;
  isActive?: boolean;
}

export interface CommunityArea {
  id?: number;
  communityId: number;
  name: string;
  isActive?: boolean;
}
export interface VisitDuration {
  id?: number;
  visitType: string | null;        
  durationInMinutes: number | null;
  resourceSpecific?: boolean;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;

}
