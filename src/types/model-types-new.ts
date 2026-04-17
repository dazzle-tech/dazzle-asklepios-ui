/* =========================
 *  Core User & Auth Models
 * ========================= */

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
  admin?: boolean;
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

/* =========================
 *  Organization / Setup
 * ========================= */

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
  hasNurseMedicalSheets: boolean;
  parallelCapacityValue: number,
  defaultDurationMinutes?: number,
  defaultBufferBeforeMinutes: number,
  defaultBufferAfterMinutes: number,
  parallelCapacityEnabled: boolean,
  requirePractitioner: boolean,
  requireBilling: boolean,
  requirePreAssessment: boolean
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
  workingDays?: OrganizationWorkingDay[];
  timeZone?: string;
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
  workingDays?: OrganizationWorkingDay[];
  timeZone?: string;
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
}

/* =========================
 *  Master Data: Services & Catalog
 * ========================= */

export interface Service {
  id?: number;
  name: string;
  abbreviation?: string | null;
  code: string;
  category?: string | null;
  price?: number | null;
  currency: string | null;
  appointable?: boolean;
  isActive?: boolean;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
  facilityId?: number;
  parallelCapacityValue: number,
  defaultDurationMinutes?: number,
  defaultBufferBeforeMinutes: number,
  defaultBufferAfterMinutes: number,
}

export interface ServiceItem {
  id?: number;
  type: string; // @Enumerated(EnumType.STRING)
  sourceId: number; // FK to the source entity (e.g., Department id)
  serviceId?: number | null; // ManyToOne -> Service (nullable on the wire)
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
  serviceId: number; // required by backend create
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
  serviceId: number; // required by backend update
  isActive?: boolean | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

export type CatalogResponseVM = {
  id: number;
  name: string;
  description?: string | null;
  type: string;
  appointable?: boolean;
  departmentId: number;
  departmentName?: string | null;
  facilityId: number;
  facilityName: string | null;
  parallelCapacityValue: number,
  defaultDurationMinutes?: number,
  defaultBufferBeforeMinutes: number,
  defaultBufferAfterMinutes: number,
};

/* =========================
 *  Localization
 * ========================= */

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

/* =========================
 *  Age Group / Visit Duration
 * ========================= */

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
  facilityId?: number; // FK
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

/* =========================
 *  Availability Templates
 * ========================= */

export interface AvailabilityTemplateWorkingDay {
  dayOfWeek: number | string;
  isWorking: boolean;
}

export interface AvailabilityTemplateAllowedServiceDTO {
  id?: number | null;
  service: string | null;
}

export interface AvailabilityTemplateAllowedServiceResponseVM {
  id?: number | null;
  service?: string | null;
}

export interface AvailabilityTemplateIntervalResponseVM {
  id?: number | null;
  templateId?: number | null;
  dayOfWeek?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  slotStrategy?: string | null;
  slotDurationMinutes?: number | null;
  allowedServices?: AvailabilityTemplateAllowedServiceResponseVM[] | null;
}

export interface AvailabilityTemplateIntervalCreateDTO {
  templateId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotStrategy: string;
  slotDurationMinutes: number;
  allowedServices?: AvailabilityTemplateAllowedServiceDTO[] | null;
}

export interface AvailabilityTemplateIntervalUpdateDTO {
  id: number;
  dayOfWeek?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  slotStrategy?: string | null;
  slotDurationMinutes?: number | null;
  allowedServices?: AvailabilityTemplateAllowedServiceDTO[] | null;
}

export interface AvailabilityTemplateResponseVM {
  id: number;
  facilityId: number;
  departmentId: number;
  resourceId: number;
  templateName: string;
  templateType: string;
  templateColor?: string | null;
  status: string;
  versionNo?: number | null;
  copyFromTemplateId?: number | null;
  parentTemplateId?: number | null;
  durationMinutes?: number | null;
  defaultBufferBeforeMinutes?: number | null;
  defaultBufferAfterMinutes?: number | null;
  parallelCapacityValue?: number | null;
  defaultServiceId?: number | null;
  numberOfResourcesExpected?: number | null;
  requirePractitioner?: boolean | null;
  defaultPractitionerId?: number | null;
  requireBilling?: boolean | null;
  requirePreAssessment?: boolean | null;
  allowPatientPortalBooking?: boolean | null;
  requireConfirmation?: boolean | null;
  financialDetails?: string | null;
  workingDays?: AvailabilityTemplateWorkingDay[] | null;
  intervals?: any[] | null;
  allowedServices?: AvailabilityTemplateAllowedServiceDTO[] | null;
  isActive: boolean;
}

export interface AvailabilityTemplateCreateDTO {
  facilityId: number;
  departmentId: number;
  templateName: string;
  templateType: string;
  resourceId: number;
  templateColor?: string | null;
  status: string;
  versionNo?: number | null;
  copyFromTemplateId?: number | null;
  parentTemplateId?: number | null;
  durationMinutes?: number | null;
  defaultBufferBeforeMinutes: number;
  defaultBufferAfterMinutes: number;
  parallelCapacityValue: number;
  defaultServiceId?: number | null;
  numberOfResourcesExpected?: number | null;
  requirePractitioner: boolean;
  defaultPractitionerId?: number | null;
  requireBilling: boolean;
  requirePreAssessment: boolean;
  allowPatientPortalBooking: boolean;
  requireConfirmation: boolean;
  financialDetails?: string;
  isActive: boolean;
  workingDays?: AvailabilityTemplateWorkingDay[] | null;
  allowedServices?: AvailabilityTemplateAllowedServiceDTO[] | null;

}

export interface AvailabilityTemplateUpdateDTO extends AvailabilityTemplateCreateDTO {
  id: number;
}

export interface AvailabilityGenerationBatchApplyDTO {
  templateId: number;
  startDate: string;
  endDate: string;
  deferred: boolean;
  deferredAt?: string | null;
  scope: string;
  holidayHandlingMode?: string | null;
}

export interface ApplyAvailabilityTemplateResponseVM {
  batchId?: number | null;
  templateId?: number | null;
  scope?: string | null;
  applyStartDateTime?: string | null;
  applyEndDateTime?: string | null;
  totalSlots?: number | null;
  dailyAvg?: number | null;
  executionStatus?: string | null;
  message?: string | null;
  holidayHandlingMode?: string | null;
}

export interface AvailabilityGenerationBatch {
  id: number;
  templateId?: number | null;
  holidayHandlingMode?: string | null;
  scope?: string | null;
  applyStartDateTime?: string | null;
  applyEndDateTime?: string | null;
  totalSlots?: number | null;
  dailyAvg?: number | null;
  executionStatus?: string | null;
  createdDate?: string | null;
  lastModifiedDate?: string | null;
}

/* =========================
 *  Appointments From Template
 * ========================= */

export type AppointmentStatus = string;
export type BookingMode = string;
export type TemplateType = string;
export type EncounterReason = string;
export type EncounterPriority = string;

export interface AppointmentFromTemplate {
  id?: number | null;
  patientId?: number | null;
  availabilityTemplateId?: number | null;
  encounterReason?: EncounterReason | null;
  status?: AppointmentStatus | null;
  appointmentDateTime?: string | null;
  durationMinutes?: number | null;
}

export interface AppointmentFromTemplateBookPatientDTO {
  id: number;
  patientId: number;
  defaultService?: number | null;
  defaultPractitioner?: number | null;
  reason?: string | null;
  status?: AppointmentStatus | null;
  note?: string | null;
  originType?: string | null;
  originName?: string | null;
  service?: string | null;
  priority?: string | null;
  followUpEncounterId?: number | null;
}

export interface AppointmentFromTemplateQuickAppointmentDTO {
  facilityId: number;
  departmentId: number;
  resourceType: TemplateType;
  resourceId: number;
  patientId: number;
  service: EncounterReason;
  priority: string;
  defaultServiceId?: number | null;
  defaultPractitionerId?: number | null;
  reason?: string | null;
  note?: string | null;
  followUpEncounterId?: number | null;
  originType?: string | null;
  originName?: string | null;
}

export interface AppointmentFromTemplateQuickAppointmentResponseVM {
  appointmentFromTemplate: AppointmentFromTemplate;
  encounter: PatientEncounter;
}

export interface AppointmentFromTemplateCancelDTO {
  id: number;
  cancelReason: string;
}

export interface AppointmentFromTemplateNoShowDTO {
  id: number;
  noShowReason: string;
}

export interface AppointmentFromTemplateSearchFilterDTO {
  facility?: number | null;
  department?: number | null;
  resourceType?: TemplateType | null;
  resourceId?: number | null;
  status?: AppointmentStatus | null;
  bookingMode?: BookingMode | null;
  patientId?: number | null;
}

export type AppointmentRequestStatus = string;

export interface AppointmentRequestResponseVM {
  id?: number | null;

  patientId?: number | null;
  patientName?: string | null;
  patientMrn?: string | null;
  
  facilityId?: number | null;
  facilityName?: string | null;

  departmentId?: number | null;
  departmentName?: string | null;

  sourceEncounterId?: number | null;
  appointmentId?: number | null;

  requestedResourceType?: TemplateType | null;
  requestedResourceId?: number | null;

  priority?: EncounterPriority | null;
  reason?: string | null;
  note?: string | null;

  status?: AppointmentRequestStatus | null;


  cancelledAt?: string | null;
  cancelReason?: string | null;

  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
}

export interface AppointmentRequestCreateDTO {
  patientId: number;
  facilityId: number;
  departmentId: number;
  sourceEncounterId: number;

  requestedResourceType?: TemplateType | null;
  requestedResourceId?: number | null;

  priority: EncounterPriority;
  reason?: string | null;
  note?: string | null;
}

export interface AppointmentRequestUpdateDTO {
  id: number;
  patientId: number;
  facilityId: number;
  departmentId: number;
  sourceEncounterId: number;

  appointmentId?: number | null;
  requestedResourceType?: TemplateType | null;
  requestedResourceId?: number | null;

  priority: EncounterPriority;
  reason?: string | null;
  note?: string | null;
  status: AppointmentRequestStatus;
  cancelReason?: string | null;
}

export interface AppointmentRequestCancelDTO {
  cancelReason: string;
}

/* =========================
 *  Clinical Staff / Practitioner
 * ========================= */

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
  parallelCapacityValue: number,
  defaultDurationMinutes?: number,
  defaultBufferBeforeMinutes: number,
  defaultBufferAfterMinutes: number,
  createdBy?: string;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

/* =========================
 *  Attachments (Patient / Encounter / Inventory)
 * ========================= */

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

export interface UploadResponse {
  id: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
}

export interface DownloadTicket {
  url: string;
  expiresInSeconds: number;
}

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

/* =========================
 *  Allergies
 * ========================= */

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

/* =========================
 *  Procedures / Diagnostics / Lab / Radiology
 * ========================= */

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
  currency?: string | null;
  price?: number | null;
}
// DiagnosticTest matches the domain entity fields (incl. raw DB strings + transient lists)

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
  appointable?: boolean;

  defaultProfileResultType?: string;
  defaultProfileResultUnit?: string;
  listOfValueId?: string | null;

  parallelCapacityValue: number,
  defaultDurationMinutes?: number,
  defaultBufferBeforeMinutes: number,
  defaultBufferAfterMinutes: number,
}
export interface DiagnosticOrderTestCollectedSampleDTO {
  orderId: number;
  orderTestId: number;
  unit: string;
  quantity: number | string;
  collectedAt: Date | string;
}

export interface DiagnosticOrderTestCollectedSampleBulkSameDTO {
  orderId: number;
  orderTestIds: number[];
  unit: string;
  quantity: number | string;
  collectedAt: Date | string;
}

export interface DiagnosticOrderTestCollectedSampleResponseVM {
  id: number;
  orderId: number;
  orderTestId: number;
  unit: string;
  quantity: number | string;
  collectedAt: string;
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
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
  timing?: string;
}

export interface DiagnosticTestProfile {
  id?: number;
  testId?: number;
  name?: string;
  resultUnit?: string;
  resultType?: string;
  listOfValueId?: number | null;
  isDefault?: boolean;
  isActive?: boolean;
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
  medicationCategoriesId: number;
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
  id?: number; // Primary key (auto-generated)
  description: string; // Mandatory field
  type: string; // Enum (mandatory)
  imageName?: string | null; // Optional image file name
  isActive?: boolean; // Defaults true
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
  createdBy: string;
  createdDate: Date;
  lastModifiedBy: string;
  lastModifiedDate: Date;
}

/* =========================
 *  Vaccines
 * ========================= */

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

export interface BrandMedication {
  id?: number;
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
  hasActiveIngredient?: boolean;
  price: number;
  currency: string;
}

export interface MedicationCategoryClass {
  id: number;
  name: string;
  medicationCategoriesId: number;
}

export interface ActiveIngredientSynonym {
  id?: number;
  dentalActionId: number;
  cdtId: number;
  activeIngredientId: number;
  synonym: string;
}

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

export interface ActiveIngredientAdverseEffect {
  id?: number;
  activeIngredientId: number;
  strength: number;
  unit: string;
  adverseEffect: string;
}

export interface ActiveIngredientDrugInteraction {
  id?: number;
  activeIngredientId: number;
  interactedIngredientId: number;
  severity: string;
  description?: string | null;
  createdBy: string;
  createdDate: Date;
  lastModifiedBy: string;
  lastModifiedDate: Date;
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

export interface ActiveIngredientFoodInteraction {
  id?: number;
  activeIngredientId: number;
  food: string;
  severity: string;
  description?: string | null;
  createdBy: string;
  createdDate: Date;
  lastModifiedBy: string;
  lastModifiedDate: Date;
}

export interface ActiveIngredientSpecialPopulation {
  id?: number;
  activeIngredientId: number;
  specialPopulation: string;
  considerations?: string | null;
}

export interface CodeOption {
  id: number | string;
  code: string;
  description: string;
}

export interface VaccineDosesInterval {
  id?: number;
  visitType: string | null;
  durationInMinutes: number | null;
  resourceSpecific?: boolean;
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

/* =========================
 *  Brand Medications / UOM / Inventory
 * ========================= */

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
}

export interface BrandMedicationActiveIngredient {
  id: number;
  brandId: number;
  activeIngredientId: number;
  strength: number;
  unit: string;
}

export type CatalogCreateVM = {
  name: string;
  description?: string | null;
  type: string;
  appointable?: boolean;
  facilityId: number;
  departmentId: number;
  parallelCapacityValue: number,
  defaultDurationMinutes?: number,
  defaultBufferBeforeMinutes: number,
  defaultBufferAfterMinutes: number,
};

export type CatalogUpdateVM = {
  name?: string;
  description?: string | null;
  type?: string;
  appointable?: boolean;
  departmentId?: number;
  facilityId: number;
  parallelCapacityValue: number,
  defaultDurationMinutes?: number,
  defaultBufferBeforeMinutes: number,
  defaultBufferAfterMinutes: number,
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
}

export interface UOMGroupRelation {
  id?: number;
  relation: number;
  // uom_group_id: number;
  fromUnitId: number;
  toUnitId: number;
}

export interface ActiveIngredientPreRequestedTest {
  id?: number;
  description: string;
  name: string;
  activeIngredientId: number;
  testId: number;
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

/* =========================
 *  Geography
 * ========================= */

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

/* =========================
 *  Patient / Demographics
 * ========================= */

export interface Patient {
  id?: number;
  visitType: null;
  durationInMinutes: null;
  resourceSpecific: false;

  medicalRecordNumber?: string | null;

  firstName: string;
  secondName?: string | null;
  thirdName?: string | null;
  lastName: string;

  sexAtBirth?: string | null;
  dateOfBirth?: Date | null;

  patientClasses?: string | null;
  isPrivatePatient?: boolean | null;

  firstNameSecondaryLang?: string | null;
  secondNameSecondaryLang?: string | null;
  thirdNameSecondaryLang?: string | null;
  lastNameSecondaryLang?: string | null;

  primaryMobileNumber?: string | null;
  receiveSms?: boolean | null;
  secondMobileNumber?: string | null;
  homePhone?: string | null;
  workPhone?: string | null;
  email?: string | null;
  receiveEmail?: boolean | null;
  preferredWayOfContact?: string | null;

  nativeLanguage?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactPhone?: string | null;

  role?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  religion?: string | null;
  ethnicity?: string | null;
  occupation?: string | null;
  responsibleParty?: string | null;
  educationalLevel?: string | null;

  previousId?: string | null;
  archivingNumber?: string | null;

  details?: string | null;
  isUnknown?: boolean | null;

  isVerified?: boolean | null;
  isCompletedPatient?: boolean | null;
  securityAccessLevel?: string | null;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

export interface SimpleCountry {
  id: number;
  name: string;
  code: string;
}

export interface SimpleDistrict {
  id: number;
  name: string;
  code: string;
}

export interface SimpleCommunity {
  id: number;
  name: string;
}

export interface SimpleArea {
  id: number;
  name: string;
}

export interface AddressLocation {
  country: SimpleCountry | null;
  district: SimpleDistrict | null;
  community: SimpleCommunity | null;
  area: SimpleArea | null;
}

export interface Address {
  id?: number;
  patientId: number;

  locationJson: AddressLocation;

  streetName?: string | null;
  houseApartmentNumber?: string | null;
  postalZipCode?: string | null;
  additionalAddressLine?: string | null;

  isCurrent?: boolean | null;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

export interface PatientDocument {
  id?: number;
  patientId: number;
  countryId: number;
  type: string;
  number: string;
  isPrimary?: boolean | null;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

export interface PatientHIPAA {
  patientId?: number;
  noticeOfPrivacyPractice: boolean;
  privacyAuthorization: boolean;
  noticeOfPrivacyPracticeDate: string | null;
  privacyAuthorizationDate: string | null;
}

export interface PatientPreferredHealthProfessional {
  id?: number;
  patientId: number; // FK -> Patient
  practitionerId: number; // FK -> Practitioner
  facilityId: number; // FK -> Facility
  networkAffiliation?: string | null;
  relatedWith?: string | null;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

/* =========================
 *  Price Lists & Billing
 * ========================= */

export interface PriceList {
  id?: number;
  facilityId?: number | null;
  facilityIds?: number[] | null; // for create/update
  name: string;
  type: string; // PriceListTypes enum value
  currency?: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  description?: string | null;
  isActive?: boolean;
  createdDate?: Date | null;
  lastModifiedDate?: Date | null;
}

export interface ReportTemplate {
  id?: number;
  name: string;
  templateValue: string;
  isActive?: boolean;
}

export interface DiagnosticTestReportTemplate {
  id: number;
  diagnosticTest: string;
  name: string;
  templateValue: string;
  isActive: boolean;
}

export interface UserStickyNotesResponseVM {
  id: number;
  userId: number;
  note: string;
  priority: string;
  priorityOrder: number;
  color: string;
  createdBy: string;
  createdDate: Date;
  lastModifiedBy: string;
  lastModifiedDate: Date;
  patientId: number | null;
}

export interface UserStickyNotesCreateVM {
  userId: number;
  note: string;
  priority: string;
  priorityOrder: number;
  color: string;
  patientId: number | null;
}

export interface PriceListItem {
  id?: number;
  priceListId: number;
  itemType: string;
  // only if itemType = PRODUCT (enum ProductTypes on backend)
  productType?: string | null; // MEDICATION | CONSUMABLE | ... (string enum)
  // polymorphic target
  serviceId?: number | null;
  productId?: number | null;
  price: number | string; // BigDecimal -> number/string on FE
  discountAllowed: boolean;
  isActive: boolean;
  createdDate?: Date | null;
  lastModifiedDate?: Date | null;
}

/* Billing Invoices */

export interface BillingInvoiceCreateVM {
  facilityId: number;
  patientKey?: string | null;
  encounterKey?: string | null;
  totalAmount: number | string;
  paidAmount?: number | string | null;
  balanceAmount?: number | string | null;
  currency?: string | null;
}

// New DTOs aligned with /api/patient/billing/invoice backend
export interface BillingInvoiceCreateDTO {
  patientId?: number | null;
  facilityId: number;
  status?: string | null;
  totalAmount: number | string;
  paidAmount?: number | string | null;
  balanceAmount?: number | string | null;
  currency?: string | null;
}

export interface BillingInvoiceUpdateDTO {
  id: number;
  patientId?: number | null;
  facilityId?: number | null;
  status?: string | null;
  totalAmount?: number | string | null;
  paidAmount?: number | string | null;
  balanceAmount?: number | string | null;
  currency?: string | null;
}

export interface BillingInvoiceItemCreateDTO {
  invoiceId: number;
  nurseServiceProductId?: number | null;
  code?: string | null;
  quantity: number | string;
  unitPrice: number | string;
  totalPrice: number | string;
  currency?: string | null;
}

export interface BillingInvoiceItemUpdateDTO {
  id: number;
  invoiceId?: number | null;
  nurseServiceProductId?: number | null;
  code?: string | null;
  quantity?: number | string | null;
  unitPrice?: number | string | null;
  totalPrice?: number | string | null;
  currency?: string | null;
}

export interface BillingInvoiceUpdateVM {
  id: number;
  facilityId?: number;
  patientKey?: string | null;
  encounterKey?: string | null;
  totalAmount?: number | string;
  paidAmount?: number | string | null;
  balanceAmount?: number | string | null;
  currency?: string | null;
}

export interface BillingInvoiceResponseVM {
  id: number;
  invoiceNumber: string;
  facilityId: number;
  patientKey?: string | null;
  encounterKey?: string | null;
  status: string;
  totalAmount: number | string;
  paidAmount: number | string;
  balanceAmount: number | string;
  currency?: string | null;
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
}

export interface Payor {
  id?: number;
  code: string;
  name: string;
  category: string | null;
  address?: string;
  phone?: string;
  email?: string;
  contractManagerContact?: string;
  startDate?: Date | string | null;
  expiryDate?: Date | string | null;
  renewable: boolean;
  allowPartialCoverage: boolean;
  acceptCopay: boolean;
  acceptDeductibles: boolean;
  allowPackagePricing: boolean;
  allowDrgBilling: boolean;
  forcePreApproval: boolean;
  isActive: boolean;
  createdDate?: Date | null;
  lastModifiedDate?: Date | null;
}

export interface PayorPlan {
  id?: number;
  code: string;
  name: string;
  category: string | null;
  address?: string;
  phone?: string;
  email?: string;
  contractManagerContact?: string;
  startDate?: Date | string | null;
  expiryDate?: Date | string | null;
  renewable: boolean;
  allowPartialCoverage: boolean;
  acceptCopay: boolean;
  acceptDeductibles: boolean;
  allowPackagePricing: boolean;
  allowDrgBilling: boolean;
  forcePreApproval: boolean;
  isActive: boolean;
  createdDate?: Date | null;
  lastModifiedDate?: Date | null;
}

export interface PayorPlanItem {
  id?: number;
  payorId: number;
  itemType: string;
  amount?: number | null;
  coverageType: string;
  isActive: boolean;
  createdDate?: Date | string | null;
  lastModifiedDate?: Date | string | null;
}
/* Billing Items */

export interface BillingInvoiceItemCreateVM {
  invoiceId: number;
  nurseServiceProductKey?: string | null;
  code?: string | null;
  quantity: number | string;
  unitPrice: number | string;
  totalPrice: number | string;
  currency?: string | null;
}

export interface BillingInvoiceItemUpdateVM {
  id: number;
  invoiceId?: number;
  nurseServiceProductKey?: string | null;
  code?: string | null;
  quantity?: number | string;
  unitPrice?: number | string;
  totalPrice?: number | string;
  currency?: string | null;
}

export interface BillingInvoiceItemResponseVM {
  id: number;
  invoiceId: number;
  nurseServiceProductKey?: string | null;
  code?: string | null;
  quantity: number | string;
  unitPrice: number | string;
  totalPrice: number | string;
  currency?: string | null;
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
}

/* Payments */

export interface PatientPaymentCreateVM {
  patientKey?: string | null;
  facilityId: number;
  paymentType: string | null;
  paymentMethod: string | null;
  paymentDate: string;
  amount: number | string;
  currency?: string | null;
  reference?: string | null;
  notes?: string | null;
}

export interface PatientPaymentUpdateVM {
  id: number;
  patientKey?: string | null;
  facilityId?: number;
  paymentType?: string | null;
  paymentMethod?: string | null;
  paymentDate?: string;
  amount?: number | string;
  currency?: string | null;
  reference?: string | null;
  notes?: string | null;
}

export interface PatientPaymentResponseVM {
  id: number;
  patientKey?: string | null;
  facilityId: number;
  paymentType: string | null;
  paymentMethod: string | null;
  paymentDate: string;
  amount: number | string;
  currency?: string | null;
  reference?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
}

export interface PaymentAllocationCreateVM {
  paymentId: number;
  invoiceId: number;
  allocatedAmount: number | string;
  invoiceItemId?: number | null;
}

export interface PaymentAllocationUpdateVM {
  id: number;
  paymentId?: number;
  invoiceId?: number;
  allocatedAmount?: number | string;
  invoiceItemId?: number | null;
}

export interface PaymentAllocationResponseVM {
  id: number;
  paymentId: number;
  invoiceId: number;
  allocatedAmount: number | string;
  invoiceItemId?: number | null;
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
}

export interface BillingItem {
  id: string;
  nurseServiceProductKey: string;
  clinic: string;
  chargeDate: string;
  type: string;
  name: string;
  price: number;
  totalPrice: number;
  currency: string;
  discount: number;
  priceList: string;
  patientKey: string;
  quantity: number;
}

/* =========================
 *  Payor / Insurance
 * ========================= */

/* =========================
 *  Referrals / Discharge
 * ========================= */



export interface DischargePlanning {
  id?: number;

  patientId: number;
  encounterId: number;

  expectedDischargeDate: string | Date | null; // mandatory
  estimatedLos?: string | null;
  readinessStatus: string | null; // mandatory

  medicalConditionStable: boolean;
  vitalsStable: boolean;
  pendingInvestigations: boolean;
  mobilityAdlStatus: boolean;

  diagnosisCode: string; // mandatory
  diagnosisName?: string | null;

  finalMedReconciliationCompleted: boolean;
  dischargeSummaryPrepared: boolean;
  dischargeOrdersSigned: boolean;
  nursingDischargeReportDone: boolean;
  patientFamilyInformed: boolean;
  transportArranged: boolean;

  medicalEquipment?: string | null;
  homeCareNeeded: boolean;
  postDischargeDietaryPlan?: string | null;
  postDischargeSocialNeeds?: string | null;

  topicsCovered?: string | null; // tags -> string
  educationDietaryPlan?: string | null;
  educationSocialNeeds?: string | null;

  materialLeaflet: boolean;
  materialVerbal: boolean;
  materialVideo: boolean;

  educationProvided: boolean;
  patientUnderstanding: boolean;

  isActive: boolean;

  createdDate?: Date | string | null;
  lastModifiedDate?: Date | string | null;
}

/* =========================
 *  Reporting / Notes
 * ========================= */

export interface DistrictCommunity {
  id?: number;
  districtId: number;
  name: string;
  templateValue: string;
  isActive?: boolean;
}

export interface FormTemplate {
  id?: number | null;
  name: string | null;
  description?: string | null;
  facilityId: number | null;
  departmentId: number | null;
  formJson: string | null;
}

export interface CommunityArea {
  id?: number;
  communityId: number;
  name: string;
  isActive?: boolean;
}

export interface UserStickyNotesResponseVM {
  id: number;
  userId: number;
  note: string;
  priority: string;
  priorityOrder: number;
  color: string;
  createdBy: string;
  createdDate: Date;
  lastModifiedBy: string;
  lastModifiedDate: Date;
}

export interface UserStickyNotesCreateVM {
  userId: number;
  note: string;
  priority: string;
  priorityOrder: number;
  color: string;
}

export interface PatientDocument {
  id?: number;
  patientId: number;
  countryId: number;
  type: string;
  number: string;
  isPrimary?: boolean | null;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

export interface PatientInsurance {
  id?: number;
  patientId: number;
  payorId: number;
  planId?: number | null;
  policyHolderId?: number | null;

  policyNumber: number | string; // BigDecimal on backend
  groupNumber?: number | string | null; // BigDecimal on backend

  expirationDate: string; // LocalDate -> string (YYYY-MM-DD)
  remainingBenefits?: number | string | null; // BigDecimal
  remainingDeductibles?: number | string | null; // BigDecimal
  isPrimary?: boolean | null;

  createdBy?: string | null;
  createdDate?: Date | string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | string | null;
}

export interface PatientInsuranceCoverage {
  id?: number;

  insuranceId: number; // FK patient_insurances.id

  itemType: string; // BillingItemTypes enum as string
  coverageType: string; // InsuranceCoverageType enum as string
  amount: number | string; // BigDecimal

  createdBy?: string | null;
  createdDate?: Date | string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | string | null;
}

export interface EncounterVaccination {
  id?: number;

  patientId: number;
  encounterId: number;

  vaccineId: number;
  vaccineBrandId: number;
  vaccineDoseId: number;

  vaccineLotNumber?: number | string | null;
  dateAdministered?: string | null;

  status: string;

  cancellationReason?: string | null;

  cancelledAt?: string | null;
  cancelledById?: number | null;

  administeredLocation?: string | null;
  administrationReactions?: string | null;
  externalFacilityName?: string | null;
  notes?: string | null;

  reviewedAt?: string | null;
  reviewedById?: number | null;

  createdBy?: string | null;
  createdDate?: Date | string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | string | null;
}
export interface PatientEncounter {
  id: number;

  patientId: number;
  facilityId: number;
  departmentId: number;

  practitionerId?: number | null;
  appointmentId?: string | null;
  encounterType: string;
  encounterReason: string;

  followUpEncounterId?: number | null;

  priorityLevel: string;

  originType?: string | null;
  originName?: string | null;

  notes?: string | null;

  status: string;
  encounterDate?: Date | null;

}

export type PatientBasicInformationResponseVM = {
  firstName: string;
  lastName: string;
  medicalRecordNumber: string;
  dateOfBirth: string;
  sexAtBirth: string;
};

export interface PatientDuplicationLookupDTO {
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  ruleId: Number | null,
  mobileNumber: string | null;
  documentNo: string | null;
  facilityId?: number | null;

}

export interface DiagnosticTestReportTemplate {
  id: number;
  diagnosticTest: string;
  name: string;
  templateValue: string;
  isActive: boolean;
}

export interface UserStickyNotesResponseVM {
  id: number;
  userId: number;
  note: string;
  priority: string;
  priorityOrder: number;
  color: string;
  createdBy: string;
  createdDate: Date;
  lastModifiedBy: string;
  lastModifiedDate: Date;
}

export interface UserStickyNotesCreateVM {
  userId: number;
  note: string;
  priority: string;
  priorityOrder: number;
  color: string;
}

export interface PatientDocument {
  id?: number;
  patientId: number;
  countryId: number;
  type: string;
  number: string;
  isPrimary?: boolean | null;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

export interface PatientInsurance {
  id?: number;
  patientId: number;
  payorId: number;
  planId?: number | null;
  policyHolderId?: number | null;

  policyNumber: number | string; // BigDecimal on backend
  groupNumber?: number | string | null; // BigDecimal on backend

  expirationDate: string; // LocalDate -> string (YYYY-MM-DD)
  remainingBenefits?: number | string | null; // BigDecimal
  remainingDeductibles?: number | string | null; // BigDecimal
  isPrimary?: boolean | null;

  createdBy?: string | null;
  createdDate?: Date | string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | string | null;
}

export interface PatientInsuranceCoverage {
  id?: number;

  insuranceId: number; // FK patient_insurances.id

  itemType: string; // BillingItemTypes enum as string
  coverageType: string; // InsuranceCoverageType enum as string
  amount: number | string; // BigDecimal

  createdBy?: string | null;
  createdDate?: Date | string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | string | null;
}

export interface EncounterVaccination {
  id?: number;

  patientId: number;
  encounterId: number;

  vaccineId: number;
  vaccineBrandId: number;
  vaccineDoseId: number;

  vaccineLotNumber?: number | string | null;
  dateAdministered?: string | null;

  status: string;

  cancellationReason?: string | null;

  cancelledAt?: string | null;
  cancelledById?: number | null;

  administeredLocation?: string | null;
  administrationReactions?: string | null;
  externalFacilityName?: string | null;
  notes?: string | null;

  reviewedAt?: string | null;
  reviewedById?: number | null;

  createdBy?: string | null;
  createdDate?: Date | string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | string | null;
}
export interface PatientEncounter {
  id: number;

  patient?: {
    id: number;
    firstName?: string | null;
    secondName?: string | null;
    thirdName?: string | null;
    lastName?: string | null;
    medicalRecordNumber?: string | null;
    dateOfBirth?: string | null;
    sexAtBirth?: string | null;
    isPrivatePatient?: boolean | null;
  } | null;

  encounterNumber?: string | null;
  departmentDailySequenceNumber?: number | null;
  encounterDate?: Date | null;

  facilityId: number;
  departmentId: number;
  practitionerId?: number | null;

  encounterType: string;
  encounterReason: string;
  priorityLevel: string;
  status: string;

  followUpEncounter?: {
    id: number;
    encounterNumber?: string | null;
  } | null;

  originType?: string | null;
  originName?: string | null;
  notes?: string | null;
  chiefComplaint?: string | null;

  hasPrescription: boolean;
  hasOrder: boolean;
  isObserved: boolean;

  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
}


export interface PatientDuplicationLookupDTO {
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  ruleId: number | null;
  mobileNumber: string | null;
  documentNo: string | null;
  facilityId?: number | null;
}

export interface DiagnosticTestReportTemplate {
  id: number;
  diagnosticTest: string;
  name: string;
  templateValue: string;
  isActive: boolean;
}

export interface UserStickyNotesResponseVM {
  id: number;
  userId: number;
  note: string;
  priority: string;
  priorityOrder: number;
  color: string;
  createdBy: string;
  createdDate: Date;
  lastModifiedBy: string;
  lastModifiedDate: Date;
}

export interface UserStickyNotesCreateVM {
  userId: number;
  note: string;
  priority: string;
  priorityOrder: number;
  color: string;
}

export interface PatientDocument {
  id?: number;
  patientId: number;
  countryId: number;
  type: string;
  number: string;
  isPrimary?: boolean | null;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

export interface FormEntryCreateVM {
  title: string;
  templateId: number;
  facilityId: number;
  departmentId: number;
  dataJson: string;
}
export interface PatientInsurance {
  id?: number;
  patientId: number;
  payorId: number;
  planId?: number | null;
  policyHolderId?: number | null;

  policyNumber: number | string; // BigDecimal on backend
  groupNumber?: number | string | null; // BigDecimal on backend

  expirationDate: string; // LocalDate -> string (YYYY-MM-DD)
  remainingBenefits?: number | string | null; // BigDecimal
  remainingDeductibles?: number | string | null; // BigDecimal
  isPrimary?: boolean | null;

  createdBy?: string | null;
  createdDate?: Date | string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | string | null;
}

// enums
export type ProcedureLevel = 'MAJOR' | 'MEDIUM' | 'MINOR';

export type Priority = 'NORMAL' | 'URGENT';

export type ProcStatus =
  | 'REQUESTED'
  | 'STARTED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'AWAITING_CONSENT'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'RETURNED_TO_BED';

// main model
export type PatientProcedure = {
  id?: number;

  procedureId: number;
  patientId: number;
  encounterId: number;

  fromFacilityId: number;
  toFacilityId: number;
  fromDepartmentId: number;
  toDepartmentId?: number | null;

  indicationId: number;

  procedureLevel: ProcedureLevel;
  priority?: Priority;

  bodyPart: string;
  side?: string | null;

  scheduledDateTime?: string | null;

  notes?: string | null;
  extraDocumentation?: string | null;

  status?: ProcStatus;

  cancelledDate?: string | null;
  // ✅ String بدل number
  cancelledBy?: string | null;
  cancellationReason?: string | null;
};
export interface PatientInsuranceCoverage {
  id?: number;

  insuranceId: number; // FK patient_insurances.id

  itemType: string; // BillingItemTypes enum as string
  coverageType: string; // InsuranceCoverageType enum as string
  amount: number | string; // BigDecimal

  createdBy?: string | null;
  createdDate?: Date | string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | string | null;
}

export interface EncounterVaccination {
  id?: number;

  patientId: number;
  encounterId: number;

  vaccineId: number;
  vaccineBrandId: number;
  vaccineDoseId: number;

  vaccineLotNumber?: number | string | null;
  dateAdministered?: string | null;

  status: string;

  cancellationReason?: string | null;

  cancelledAt?: string | null;
  cancelledById?: number | null;

  administeredLocation?: string | null;
  administrationReactions?: string | null;
  externalFacilityName?: string | null;
  notes?: string | null;

  reviewedAt?: string | null;
  reviewedById?: number | null;

  createdBy?: string | null;
  createdDate?: Date | string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | string | null;
}

export interface BillingInvoiceCreateVM {
  facilityId: number;
  patientKey?: string | null;
  encounterKey?: string | null;
  totalAmount: number | string;
  paidAmount?: number | string | null;
  balanceAmount?: number | string | null;
  practitionerId?: number | null;

  encounterType: string;
  encounterReason: string;

  followUpEncounterId?: number | null;

  priorityLevel: string;

  originType?: string | null;
  originName?: string | null;

  notes?: string | null;

  status: string;
  encounterDate?: Date | null;
}


export interface PatientDuplicationLookupDTO {
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  ruleId: number | null;
  mobileNumber: string | null;
  documentNo: string | null;
  facilityId?: number | null;
}

export interface BillingInvoiceItemCreateVM {
  invoiceId: number;
  nurseServiceProductKey?: string | null;
  code?: string | null;
  quantity: number | string;
  unitPrice: number | string;
  totalPrice: number | string;
  currency?: string | null;
}

export interface BillingInvoiceItemUpdateVM {
  id: number;
  invoiceId?: number;
  nurseServiceProductKey?: string | null;
  code?: string | null;
  quantity?: number | string;
  unitPrice?: number | string;
  totalPrice?: number | string;
  currency?: string | null;
}
export interface PatientEncounter {
  id: number;

  patientId: number;

  encounterNumber?: string | null;

  facilityId: number;
  departmentId: number;

  practitionerId?: number | null;

  paymentDate: string;
  amount: number | string;
  encounterType: string;
  encounterReason: string;

  followUpEncounterId?: number | null;

  priorityLevel: string;

  originType?: string | null;
  originName?: string | null;

  notes?: string | null;

  departmentDailySequenceNumber?: number | null;

  encounterDate?: Date | null;

  status: string;

  chiefComplaint?: string | null;

  hasPrescription: boolean;
  hasOrder: boolean;
  isObserved: boolean;
}

export interface PatientPaymentServiceItemDTO {
  serviceId: number;
  price: number;
  isExempted: boolean;
}

export interface PatientPaymentDTO {
  id?: number;

  patientId: number;
  encounterId: number;

  planId?: number | null;
}

export interface PatientAccountSummaryVM {
  patientKey: string;
  freeBalance: number | string;
  outstandingBalance: number | string;
  totalInvoiced: number | string;
  totalPaid: number | string;
  paymentTypes: string;
  paymentMethods: string;

  amount: number;
  currency: string;
  facilityDefaultCurrency: string;
  amountInFacilityCurrency?: number | null;

  addToFreeBalance: boolean;

  useBalanceToSettleDebts?: boolean;

  cardNumber?: string | null;
  cardHolderName?: string | null;
  cardValidUntil?: string | null;

  chequeNumber?: string | null;
  chequeBankName?: string | null;
  chequeDueDate?: string | null;

  transferNumber?: string | null;
  transferBankName?: string | null;
  transferDate?: string | null;

  services: PatientPaymentServiceItemDTO[];
}

export interface PatientPaymentServices {
  id?: number;

  paymentId: number;

  serviceId: number;
  price: number;
  isExempted: boolean;

  createdBy?: string | null;
  createdDate?: Date | string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | string | null;
}

export interface PatientPayments {
  id?: number;

  patientId: number;
  encounterId: number;

  planId?: number | null;

  dueAmount: number;
  patientBalance: number;

  paidFromAmount?: number | null;
  paidFromBalance?: number | null;

  paymentTypes: string;
  paymentMethods: string;

  amount: number;
  currency: string;
  facilityDefaultCurrency: string;
  amountInFacilityCurrency?: number | null;

  remaining: number;
  addToFreeBalance: boolean;

  useBalanceToSettleDebts?: boolean;

  cardNumber?: string | null;
  cardHolderName?: string | null;
  cardValidUntil?: string | null;

  chequeNumber?: string | null;
  chequeBankName?: string | null;
  chequeDueDate?: string | null;

  transferNumber?: string | null;
  transferBankName?: string | null;
  transferDate?: string | null;

  refunds?: number | string | null;

  createdBy?: string | null;
  createdDate?: Date | string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | string | null;
}

export interface PatientPaymentDetails {
  payment: PatientPayments;
  services: PatientPaymentServices[];
}

export interface PatientLedgerSummaryDTO {
  patientId: number;
  totalDebt: number;
  walletBalance: number;
}

export interface PatientChargeDTO {
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

  patientId: number;
  encounterId: number;
  planId?: number | null;

  dueAmount: number;
  remaining: number;

  currency: string;
  facilityDefaultCurrency: string;

  createdDate?: Date | string | null;
  lastModifiedDate?: Date | string | null;
}

export interface PatientWalletDTO {
  patientId: number;
  balance: number;
  lastModifiedDate?: Date | string | null;
}

export interface PatientPaymentAllocationDTO {
  id?: number;

  paymentId: number;
  chargeId: number;

  paidFromAmount: number;
  paidFromBalance: number;

  lastModifiedDate?: Date | string | null;
}
export interface PriceListAttribute {
  id?: number | null;
  priceListId: number | null;
  attributeType: string; // PriceAttributes enum as string
  attribute: string;
  price: number; // or string if you prefer BigDecimal string
  isActive?: boolean;
}

export interface FormTemplate {
  id?: number | null;
  name: string | null;
  description?: string | null;
  facilityId: number | null;
  departmentId: number | null;
  formJson: string | null;
}

export interface FormEntry {
  id?: number | null;
  title: string | null;
  templateId: number | null;
  facilityId: number | null;
  departmentId: number | null;
  dataJson: string | null;
}

export interface FormEntryCreateVM {
  title: string;
  templateId: number;
  facilityId: number;
  departmentId: number;
  dataJson: string;
}
export interface OrganizationDefinition {
  id?: number;
  name?: string;
  description?: string;
  address?: string;
  contactName?: string;
  contactAddress?: string;
  contactEmail?: string;
  contactMobile?: string;
  contactLandNumber?: string;
  taxValue?: number;
  defaultTimeZone?: string;
  defaultLanguageId?: number;
  workingDays?: OrganizationWorkingDay[];
}

export interface OrganizationWorkingDay {
  id?: number;
  dayOfWeek?: string;
  isWorking?: boolean;
}

export type HolidayType = 'PUBLIC_HOLIDAY' | 'FORMAL_VACATION' | 'CLOSURE';

export interface OrganizationHolidayResponseVM {
  id: number;
  organizationDefinitionId: number;
  name: string;
  holidayType: HolidayType;
  startDate: string;
  endDate: string;
  reason?: string | null;
  isActive: boolean;
  allFacilities: boolean;
  facilityIds?: string | null;
  recurring: boolean;
}

export interface OrganizationHolidayCreateDTO {
  organizationDefinitionId: number;
  name: string;
  holidayType: HolidayType;
  startDate: string;
  endDate: string;
  reason?: string | null;
  isActive: boolean;
  allFacilities: boolean;
  facilityIds?: string | null;
  recurring: boolean;
}

export interface OrganizationHolidayUpdateDTO {
  id: number;
  name?: string | null;
  holidayType?: HolidayType | null;
  startDate?: string | null;
  endDate?: string | null;
  reason?: string | null;
  isActive?: boolean | null;
  allFacilities?: boolean | null;
  facilityIds?: string | null;
  recurring?: boolean | null;
}

export interface OrganizationHolidaySearchParams {
  name?: string;
  holidayType?: HolidayType;
  startDate?: string;
  endDate?: string;
  recurring?: boolean;
  allFacilities?: boolean;
  facilityId?: number;
}

export interface PatientAllergiesActiveIngredientResponse {
  id?: number;
  activeIngredientId?: number;
  createdBy?: string;
  createdDate?: string; // Instant → string (ISO)
  lastModifiedBy?: string;
  lastModifiedDate?: string; // Instant → string (ISO)
}

export interface PatientAllergiesResponseVM {
  id?: number;
  patientId?: number;
  encounterId?: number;

  allergenType?: string;
  allergenId?: number;
  severity?: string;

  medicationClassId?: number;
  criticality?: string;
  certainty?: string;
  treatmentStrategy?: string;

  onset?: string;
  onsetDateUndefined?: boolean;
  onsetDate?: string;

  typeOfPropensity?: string;
  byPatient?: boolean;
  sourceOfInformation?: string;
  note?: string;
  status: string;
  allergicReactions: string;

  resolvedBy?: string;
  resolvedDate?: string;

  cancelledBy?: string;
  cancelledDate?: string;
  cancellationReason?: string;
}
export interface PatientWarnings {
  id?: number;
  patientId: number;
  encounterId: number;
  warningType: string;
  warning: string;
  severity: string;
  onsetDateUndefined?: boolean;
  onsetDate?: string;
  byPatient?: boolean;
  sourceOfInformation?: string;
  note?: string;
  status?: string;
  actionTaken?: string;
  resolvedBy?: string;
  resolvedDate?: string;
  cancelledBy?: string;
  cancelledDate?: string;
  cancellationReason?: string;
  createdBy: string;
  createdDate: string;
}

export interface PatientPrescription {
  id: number;
  patientId: number;
  encounterId: number;
  prescriptionNum: number;
  prescriptionDate: string;
  urgencyLevel: string;
  status: string;
  fromFacilityId: number;
  fromDepartmentId: number;
  toFacilityId?: number | null;
  toDepartmentId?: number | null;
  createdBy: string;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
}

export interface PatientPrescriptionMedication {
  id: number;
  prescriptionHeaderId: number;
  medicationsId: number;
  instructionsType: null;
  instructions?: string | null;
  dose?: number | null;
  doesUnit?: string | null;
  rout?: string | null;
  frequency?: string | null;
  duration?: number | null;
  durationType?: string | null;
  chronicMedication?: boolean | null;
  maximumDose?: number | null;
  validUtil?: string | null;
  allowedSubstitute?: boolean | null;
  indicationManually?: string | null;
  indicationUse?: string | null;
  indicationIcd?: string | null;
  parametersToMonitor?: string | null;
  numberOfRefills?: number | null;
  refillValue?: number | null;
  refillUnit?: string | null;
  notes?: string | null;
  extraDocumentation?: string | null;
  administrationInstructions?: string | null;
  status?: null;
  createdBy: string;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
}

export interface ProgressNote {
  id: number;
  patient?: { id: number };
  patientId: number;
  encounterId: number;
  noteText: string;

  cancelledBy?: string | null;
  cancelledDate?: string | null;
  cancellationReason?: string | null;

  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
}

export interface ProgressNoteCreateVM {
  patientId: number;
  encounterId: number;
  noteText: string;
}

export interface ProgressNoteUpdateVM {
  id: number;
  noteText: string;
}

export interface ProgressNoteCancelVM {
  id: number;
  cancellationReason: string;
}

export type ProgressNoteLogVM = {
  id: number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  createdBy: string;
  createdDate: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;

  activeIngredients?: PatientAllergiesActiveIngredientResponse[];
};

export interface PatientAllergiesActiveIngredientCreate {
  activeIngredientId?: number;
}

export interface PatientAllergiesCreateDTO {
  patientId: number;
  encounterId: number;
  allergenType?: string;
  allergenId?: number;
  severity?: string;

  medicationClassId?: number;
  criticality?: string;
  certainty?: string;
  treatmentStrategy?: string;

  onset?: string;
  onsetDateUndefined?: boolean;
  onsetDate?: string;

  typeOfPropensity?: string;
  byPatient?: boolean;
  sourceOfInformation?: string;
  note?: string;
  status: string;
  allergicReactions?: string;

  activeIngredients?: number[];
}

export type PatientAllergiesUpdateDTO = {
  id: number;
  allergenType: string; // FOOD, MEDICATION, ...
  allergenId?: number;
  severity: string; // HIGH, LOW, MEDIUM
  medicationClassId?: number;
  criticality?: string;
  certainty?: string;
  treatmentStrategy?: string;
  onset?: string;
  onsetDateUndefined?: boolean;
  onsetDate?: string; // ISO string
  typeOfPropensity?: string;
  byPatient?: boolean;
  sourceOfInformation?: string;
  note?: string;
  allergicReactions?: string;
  activeIngredients?: number[];
  payload?: any;
};
export interface FavoriteDiagnosticTest {
  id?: number;
  userId?: number;
  testId?: number;
}

export interface FavoriteDiagnosticTestCreateDTO {
  userId: number;
  testId: number;
}
export enum DiagnosticStatus {
  NEW = 'NEW',
  SUBMITTED = 'SUBMITTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum DiagnosticOrderTestStatus {
  NEW = 'NEW',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  RESULT_READY = 'RESULT_READY',
  SAMPLE_COLLECTED = 'SAMPLE_COLLECTED',
  RESULT_APPROVED = 'RESULT_APPROVED',
  CANCELLED = 'CANCELLED',
  PARTIALLY = 'PARTIALLY',
  RESULT_REJECTED = 'RESULT_REJECTED',
  PATIENT_ARRIVED = 'PATIENT_ARRIVED'
}

export enum TestType {
  LAB = 'LAB',
  RAD = 'RAD'
}

export interface AuditingEntity {
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface PatientWarningsCreateDTO {
  patientId: number;
  encounterId: number;
  warningType: string;
  warning: string;
  severity: string;
  onsetDateUndefined?: boolean;
  onsetDate?: string;
  byPatient?: boolean;
  sourceOfInformation?: string;
  note?: string;
  status?: string;
  actionTaken?: string;
}

export type PatientWarningsUpdateDTO = {
  id: number;
  warningType: string;
  warning?: string;
  severity: string;
  onsetDateUndefined?: boolean;
  onsetDate?: string;
  byPatient?: boolean;
  sourceOfInformation?: string;
  note?: string;
  actionTaken?: string;
};
// CREATE
export type PatientProcedureCreateVM = {
  procedureId: number;
  patientId: number;
  encounterId: number;

  fromFacilityId: number;
  toFacilityId: number;
  fromDepartmentId: number;
  toDepartmentId?: number | null;

  indicationId: number;

  procedureLevel: ProcedureLevel;
  priority?: Priority;

  bodyPart: string;
  side?: string | null;

  scheduledDateTime?: string | null;

  notes?: string | null;
  extraDocumentation?: string | null;
};

// UPDATE
export type PatientProcedureUpdateVM = {
  id: number;

  procedureLevel?: ProcedureLevel;
  priority?: Priority;
  indicationId?: number;
  procedureId?: number;
  bodyPart: string;
  side?: string | null;
  toFacilityId: number;
  toDepartmentId?: number | null;

  scheduledDateTime?: string | null;

  notes?: string | null;
  extraDocumentation?: string | null;
};

export type PatientProcedureCancelVM = {
  id: number;
  cancellationReason: string;
  // ✅ شيلنا cancelledBy - بيتاخد من SecurityUtils
};

export interface DiagnosticOrder extends AuditingEntity {
  id?: number;
  patientId?: number;
  encounterId?: number;
  saveDraft?: boolean;
  status?: DiagnosticStatus;
  submittedBy?: string;
  submittedDate?: string;
  isUrgent?: boolean;
  labStatus?: DiagnosticStatus;
  radStatus?: DiagnosticStatus;
}

export interface DiagnosticOrderTest extends AuditingEntity {
  id?: number;

  orderId?: number;
  testId?: number;
  diagnosticTestId?: number;
  receivedDepartmentId?: number;

  reason?: string;
  notes?: string;

  processingStatus?: DiagnosticOrderTestStatus;

  submitDate?: string;

  orderType?: TestType;

  fromDepartmentId?: number;
  fromFacilityId?: number;
  toFacilityId?: number;

  /* ===== Status & lifecycle ===== */

  status?: DiagnosticOrderTestStatus;

  acceptedDate?: string;
  rejectedDate?: string;
  patientArrivedDate?: string;
  readyDate?: string;
  approvedDate?: string;
  cancelledDate?: string;

  acceptedBy?: string;
  rejectedBy?: string;
  rejectedReason?: string;

  patientArrivedNoteRad?: string;

  cancellationReason?: string;
  cancelledBy?: string;
}

export interface DiagnosticOrderCreateDTO {
  patientId: number;
  encounterId: number;

  saveDraft?: boolean;

  submittedBy?: string;
  submittedDate?: string;

  isUrgent?: boolean;

  labStatus?: DiagnosticStatus;
  radStatus?: DiagnosticStatus;
  fromDepartmentId?: number;
  fromFacilityId?: number;
}

export interface DiagnosticOrderUpdateDTO {
  id: number;
  patientId: number;
  encounterId: number;
  // saveDraft?: boolean;

  submittedBy?: string;
  submittedDate?: string;

  isUrgent?: boolean;
}

export interface DiagnosticOrderSubmitDTO {
  submittedBy?: string;
  submittedDate?: string;
}

export interface DiagnosticOrderTestCreateDTO {
  orderId: number;
  testId: number;
  receivedDepartmentId?: number;
  reason?: string;
  notes?: string;
  processingStatus?: DiagnosticOrderTestStatus;
  submitDate?: string;
  orderType?: TestType;
}

export interface DiagnosticOrderTestUpdateDTO extends DiagnosticOrderTestCreateDTO {
  id: number;
  status?: DiagnosticOrderTestStatus;
  cancellationReason?: string;
  rejectedReason?: string;
  acceptedBy?: string;
  rejectedBy?: string;
}

export interface DiagnosticOrderTestRejectDTO {
  rejectedReason: string;
}

export interface DiagnosticOrderTestCancelDTO {
  cancellationReason: string;
}

export interface BulkIdsDTO {
  ids: number[];
}

export interface BulkRejectDTO {
  ids: number[];
  rejectedReason: string;
}

export interface DiagnosticOrderTestResultCreateDTO {
  orderTestId: number;
  profileTestId?: number | null;

  resultValueNumber?: number | null;
  resultValueText?: string | null;

  marker?: string | null;
  normalRangeValue?: string | null;
}

export interface DiagnosticOrderTestResultUpdateDTO {
  id: number;

  orderTestId: number;
  profileTestId?: number | null;

  resultValueNumber?: number | null;
  resultValueText?: string | null;

  marker?: string | null;
  normalRangeValue?: string | null;
}

export interface DiagnosticOrderTestResultRejectDTO {
  rejectedReason: string;
}

export interface DiagnosticOrderTestResultResponseVM {
  id: number;

  orderId: number;
  orderTestId: number;
  profileTestId?: number | null;

  resultValueNumber?: number | null;
  resultValueText?: string | null;

  marker?: string | null;
  viewMarker?: string | null;
  normalRangeValue?: string | null;
  viewNormalRange?: string | null;

  processingStatus?: DiagnosticOrderTestStatus;

  approvedBy?: string | null;
  approvedDate?: string | null;

  rejectedBy?: string | null;
  rejectedDate?: string | null;
  rejectedReason?: string | null;

  reviewBy?: string | null;
  reviewDate?: string | null;

  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
}

export interface FilledProfileTestIdsParams {
  orderTestIds: number[];
}

/* ================= Diagnostic Order Test Result Technician Notes ================= */

export interface DiagnosticOrderTestResultTechnicianNote {
  id?: number;
  orderId?: number;
  orderTestId?: number;
  resultId?: number;
  note?: string;
  createdBy?: string;
  createdDate?: string;
}

export interface DiagnosticOrderTestResultTechnicianNoteCreateDTO {
  resultId: number;
  orderTestId: number;
  note: string;
}

export interface LabResultLogResponseVM {
  id: number;
  resultId: number;
  action: string;
  oldValue?: string;
  newValue?: string;
  resultDate: string;
  createdBy?: string;
}

export interface PatientArrivedCreateRequestDTO {
  patientArrivedDate?: string;
  arrivedAt?: string;
  patientArrivedNoteRad?: string;
}

export interface PatientArrivedResponseVM {
  id?: number;
  diagnosticOrderTestId?: number;

  arrivedAt?: string;
  patientArrivedNoteRad?: string;

  createdBy?: string;
  createdDate?: string;
}

export interface DiagnosticOrderTestReportCreateDTO {
  orderId: number;
  orderTestId: number;
  report: string;
  severity?: string;
}

export interface DiagnosticOrderTestReportUpdateDTO {
  id: number;
  report: string;
  severity?: string;
}

export interface DiagnosticOrderTestReportResponseVM {
  id?: number;

  orderId?: number;
  orderTestId?: number;

  report?: string;
  severity?: string;

  approvedBy?: string;
  approvedDate?: string;

  rejectedBy?: string;
  rejectedDate?: string;
  rejectedReason?: string;

  reviewBy?: string;
  reviewDate?: string;

  processingStatus?: string;
  imageStatus?: string;

  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface DiagnosticHistoryResultVM {
  orderId: number;
  orderTestId: number;
  resultId: number;
  profileTestId: number;

  resultDate: string;

  resultValueNumber: number | null;
  resultValueText: string | null;

  processingStatus: string;
  marker: string;
  normalRangeValue: string;

  reviewDate: string | null;
}

export interface ProfileTestGroupedHistoryVM {
  profileTestId: number;

  latestProcessingStatus: string;
  latestResultDate: string;

  results: DiagnosticHistoryResultVM[];
}

export interface GeneralAssessment {
  id?: number;
  patientId?: number | null;
  encounterId?: number | null;
  positionStatus?: string | null;
  bodyMovements?: string | null;
  levelOfConsciousness?: string | null;
  facialExpression?: string | null;
  speech?: string | null;
  moodBehavior?: string | null;
  memoryRemote?: boolean;
  memoryRecent?: boolean;
  signsOfAgitation?: boolean;
  signsOfDepression?: boolean;
  signsOfSuicidalIdeation?: boolean;
  signsOfSubstanceUse?: boolean;
  isTriage?: boolean;
}

export interface ChiefComplain {
  id?: number;

  // Domain: `patient` is a required ManyToOne. On the wire we typically send `patientId`.
  patientId?: number | null;

  encounterId?: number | null;

  chiefComplaint?: string | null;
  severity?: string | null;
  onsetDateTime?: string | Date | null; // Instant
  caseUnderstanding?: string | null;

  provocation?: string | null;
  palliation?: string | null;
  quality?: string | null;
  region?: string | null;

  patientCondition?: string | null;
  isTriage?: boolean;
}

export interface EmergencyTriage {
  id?: number;
  patientId?: number | null;
  encounterId?: number | null;
  createdDate?: string | Date | null;
  lastModifiedDate?: string | Date | null;

  emergencyLevel?: string | null;

  rightEyeLightResponse?: boolean;
  rightEyePupilSize?: string | null;

  leftEyeLightResponse?: boolean;
  leftEyePupilSize?: string | null;

  hpiAdditionalNotes?: string | null;

  lifeSaving?: string | null;
  unresponsive?: string | null;
  highRisk?: string | null;

  avpuScale?: string | null;
  painScore?: string | null;

  labsRequired?: string | null;
  imagingRequired?: string | null;
  ivFluidsRequired?: string | null;
  medicationRequired?: string | null;
  ecgRequired?: string | null;
  consultationRequired?: string | null;

  destination?: string | null;
  completedDate?: string | Date | null;
}


export type EmergencyTriageCreate = Pick<EmergencyTriage, 'patientId' | 'encounterId'> &
  Partial<EmergencyTriage>;

// PUT /api/patient/emergency-triage/{id}/eye-assessment
// Matches backend `EmergencyTriageUpdateDTO`
export type EmergencyTriageEyeAssessmentUpdate = {
  id: number;
  rightEyeLightResponse: boolean;
  rightEyePupilSize?: string | null;
  leftEyeLightResponse: boolean;
  leftEyePupilSize?: string | null;
  hpiAdditionalNotes?: string | null;
};

// PUT /api/patient/emergency-triage/{id}/level-assessment
export type EmergencyTriageLevelAssessmentUpdate = Pick<
  EmergencyTriage,
  | 'id'
  | 'lifeSaving'
  | 'unresponsive'
  | 'highRisk'
  | 'avpuScale'
  | 'painScore'
  | 'labsRequired'
  | 'imagingRequired'
  | 'ivFluidsRequired'
  | 'medicationRequired'
  | 'ecgRequired'
  | 'consultationRequired'
>;

// PUT /api/patient/emergency-triage/{id}/destination
export type EmergencyTriageDestinationUpdate = Pick<EmergencyTriage, 'id' | 'destination'>;


export type BillingItemType =
  | 'MEDICATION'
  | 'LABORATORY'
  | 'RADIOLOGY'
  | 'PATHOLOGY'
  | 'SERVICE'
  | 'PROCEDURE';

export type PatientServiceAndProduct = {
  id: number;
  patientId: number;
  encounterId: number;
  billingItemType: BillingItemType;

  brandMedicationId?: number | null;
  diagnosticTestId?: number | null;
  serviceId?: number | null;
  procedureId?: number | null;

  quantity: number;
  unitPrice: number;
  discountAmount: number;
  exemptionAmount: number;
  taxAmount: number;
  currency: string;

  isBilled: boolean;
  billingInvoiceId?: number | null;
  billingInvoiceItemId?: number | null;
};

export type PatientServiceProductCreateDTO = {
  patientId: number;
  encounterId: number;
  billingItemType: BillingItemType;

  brandMedicationId?: number | null;
  diagnosticTestId?: number | null;
  serviceId?: number | null;
  procedureId?: number | null;

  quantity: number;
  unitPrice: number;
  discountAmount?: number | null;
  exemptionAmount?: number | null;
  taxAmount?: number | null;
  currency: string;
};

export type PatientServiceProductUpdateDTO = {
  id: number;
  billingItemType: BillingItemType;

  brandMedicationId?: number | null;
  diagnosticTestId?: number | null;
  serviceId?: number | null;
  procedureId?: number | null;

  quantity: number;
  unitPrice: number;
  discountAmount?: number | null;
  exemptionAmount?: number | null;
  taxAmount?: number | null;
  currency: string;

  isBilled?: boolean | null;
  billingInvoiceId?: number | null;
  billingInvoiceItemId?: number | null;
};

// =============================
//  Consultation
// =============================

export type ConsultationStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'READY'
  | 'SUBMITTED';

export type ConsultationLevel = 'CRITICAL' | 'URGENT' | 'ROUTINE';

export type DestinationType = 'DEPARTMENT' | 'CONSULTANT';

export interface Consultation {
  id?: number;

  patientId?: number | null;
  encounterId: number;

  fromFacilityId: number;
  toFacilityId: number;
  fromDepartmentId: number;
  toDepartmentId?: number | null;

  consultationNumber?: number | null;

  destinationType: DestinationType;
  consultationType: string;
  consultantSpeciality?: string | null;
  consultationMethod: string;
  practitionerId?: number | null;
  consultationLevel: ConsultationLevel;
  consultationContent: string;

  notes?: string | null;
  extraDocument?: string | null;
  approvalNumber?: number | null;

  status: ConsultationStatus;

  responseDate?: string | null;
  responseBy?: string | null; // ✅ String - CAPTURE من SecurityUtils
  responseText?: string | null;

  rejectedDate?: string | null;
  rejectedBy?: string | null; // ✅ String - CAPTURE من SecurityUtils
  rejectReason?: string | null;

  cancellationReason?: string | null;
  cancelledDate?: string | null;
  cancelledBy?: string | null; // ✅ String - CAPTURE من SecurityUtils

  confirmedDate?: string | null;
  confirmedBy?: string | null; // ✅ String - CAPTURE من SecurityUtils

  submittedDate?: string | null;
  submittedBy?: string | null; // ✅ String - CAPTURE من SecurityUtils

  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
}

// DTOs - Create
export interface ConsultationCreateVM {
  patientId: number;
  encounterId: number;
  fromFacilityId: number;
  toFacilityId: number;
  fromDepartmentId: number;
  toDepartmentId?: number | null;
  consultationType: string;
  consultantSpeciality?: string | null;
  practitionerId?: number | null;
  destinationType: DestinationType;
  consultationMethod: string;
  consultationLevel: ConsultationLevel;
  consultationContent: string;
  notes?: string | null;
  extraDocument?: string | null;
  approvalNumber?: number | null;
}

// Update
export interface ConsultationUpdateVM {
  id: number;
  destinationType: DestinationType;
  toFacilityId: number;
  toDepartmentId?: number | null;
  consultantSpeciality?: string | null;
  practitionerId?: number | null;
  consultationMethod: string;
  consultationType: string;
  consultationLevel: ConsultationLevel;
  consultationContent: string;
  notes?: string | null;
  extraDocument?: string | null;
  approvalNumber?: number | null;
}

// Cancel - بس reason، الـ cancelledBy من SecurityUtils
export interface ConsultationCancelVM {
  cancellationReason: string;
}

// Reject - بس reason، الـ rejectedBy من SecurityUtils
export interface ConsultationRejectVM {
  reason: string;
}

// Response - بس responseText، الـ responseBy من SecurityUtils
export interface ConsultationResponseVM {
  responseText: string;
}

// Submit
export interface ConsultationSubmitRequestVM {
  consultationIds: number[];
}

export interface ConsultationSubmitErrorVM {
  consultationId: number;
  consultationNumber: number;
  error: string;
}

export interface ConsultationSubmitResultVM {
  submittedCount: number;
  errors: ConsultationSubmitErrorVM[];
}

// export type DiagnosticStatus = 'NEW' | 'SUBMITTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface TelephonicConsultations {
  id?: number;
  patientId?: number | null;
  encounterId: number;
  practitionerId: number;
  dateOfCall: string;
  consultationContent: string;
  approvalNumber?: number | null;
  notes?: string | null;
  extraDocumentation?: string | null;
  status?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null; // ✅ String
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
}

export interface TelephonicConsultationCreateVM {
  patientId: number;
  encounterId: number;
  practitionerId: number;
  dateOfCall: string;
  consultationContent: string;
  approvalNumber?: number | null;
  notes?: string | null;
  extraDocumentation?: string | null;
}

export interface TelephonicConsultationUpdateVM {
  id: number;
  practitionerId: number;
  dateOfCall: string;
  consultationContent: string;
  approvalNumber?: number | null;
  notes?: string | null;
  extraDocumentation?: string | null;
}

export interface TelephonicConsultationCancelVM {
  reason: string;
  // ✅ شيلنا cancelledBy
}
export type NextOfKin = {
  id: number;
  patientId: number;
  name: string;
  relationship: string;
  address: string;
  email: string;
  mobileNumber: string;
  telephone?: string | null;
  internationalNumber?: string | null;
  landlineNumber?: string | null;
};

export type NextOfKinCreateDTO = {
  patientId: number;
  name: string;
  relationship: string;
  address: string;
  email: string;
  mobileNumber: string;
  telephone?: string | null;
  internationalNumber?: string | null;
  landlineNumber?: string | null;
};

export type NextOfKinUpdateDTO = {
  name: string;
  relationship: string;
  address: string;
  email: string;
  mobileNumber: string;
  telephone?: string | null;
  internationalNumber?: string | null;
  landlineNumber?: string | null;
};
export interface EncounterAssessment {
  id?: number;
  patientId: number | null;
  userId: number | null;
  encounterId: number | null;
  assessment: string | null;

  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

export interface EncounterPlan {
  id?: number;
  patientId: number | null;
  encounterId: number | null;
  planInstructions: string | null;

  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

export interface PatientDiagnosis {
  id?: number;
  patientId: number | null;
  encounterId: number | null;
  diagnosisId: number | null;
  type: string | null;
  suspected: boolean | null;
  major: boolean | null;

  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}
export interface EncounterAssessment {
  id?: number;
  patientId: number | null;
  encounterId: number | null;
  assessment: string | null;

  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

export interface EncounterPlan {
  id?: number;
  patientId: number | null;
  encounterId: number | null;
  planInstructions: string | null;

  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}

export interface PatientDiagnosis {
  id?: number;
  patientId: number | null;
  encounterId: number | null;
  diagnosisId: number | null;
  type: string | null;
  suspected: boolean | null;
  major: boolean | null;

  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
}
export interface VitalSigns {
  id?: number;

  patientId: number;
  encounterId: number;

  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  measurementSite?: string | null;

  heartRate?: number | null;
  temperature?: number | null;
  oxygenSaturation?: number | null;
  respiratoryRate?: number | null;

  isTriage?: boolean | null;
  isActive: boolean;

  notes?: string | null;

  createdDate?: Date | string | null;
  lastModifiedDate?: Date | string | null;

}

export interface BodyMeasurements {
  id?: number;

  patientId: number;
  encounterId: number;

  weight?: number | null;
  height?: number | null;
  headCircumference?: number | null;

  isActive: boolean;

  createdDate?: Date | string | null;
  lastModifiedDate?: Date | string | null;
}

export interface PatientObservationsComplaints {
  id?: number;

  patientId: number;
  encounterId: number;

  reasonOfVisit?: string | null;
  latestFunctionalStatus?: string | null;
  latestCognitiveCheck?: string | null;

  isActive: boolean;
  functionalStatus?: string | null;
  cognitiveCheck?: string | null;
  createdDate?: Date | string | null;
  lastModifiedDate?: Date | string | null;
}

export interface PainAssessment {
  id?: number;

  patientId: number;
  encounterId: number;

  painDegree?: string | null;
  painLevel?: 'NO_PAIN' | 'MILD' | 'MODERATE' | 'SEVERE' | string | null;
  painDescription?: string | null;

  isActive: boolean;

  createdDate?: Date | string | null;
  lastModifiedDate?: Date | string | null;
}

export interface AdditionalMeasurements {
  id?: number;

  patientId: number;
  encounterId: number;

  ageGroup: string;
  hearingTest?: string | null;

  dehydration?: boolean;
  nasalFlaring?: boolean;
  responseToLight?: boolean;
  pupilResponse?: boolean;
  abilityToFollowTarget?: boolean;
  colorTesting?: boolean;
  fallRisk?: boolean;
  visionProblemsAffectingFunction?: boolean;
  hearingProblemsAffectingFunction?: boolean;

  details?: string | null;
  actionToTake?: string | null;

  isActive: boolean;

  createdDate?: Date | string | null;
  lastModifiedDate?: Date | string | null;
}
export interface SampleLabelVM {
  orderTestId: number;
  patientName: string;
  facilityName: string;
  mrn: string;
  testName: string;
  sampleDateTime: string;
  sampleQuantity: number;
  sampleUnit: string;
};

export interface PatientRelation {
  patientId: number;
  relativePatientId: number;
  relationType: string;
  categoryType?: string | null;
  isActive?: boolean;
}

/**
 * relations_matrix response
 */
export interface RelationsMatrix {
  id: number;
  firstPatientGender: string | null;
  secondPatientGender: string | null;
  firstRelationCode: string;
  secondRelationCode: string;
}
export interface PatientAdministrativeWarningsResponseVM {
  id: number;
  patient?: PatientBasicInformationResponseVM | null;
  warningType: string;
  description?: string | null;
  resolved?: boolean | null;
  resolvedBy?: string | null;
  resolvedDate?: string | null;
  undoResolvedBy?: string | null;
  undoResolvedDate?: string | null;
  createdBy?: string | null;
  createdDate?: string | null;
}

export interface PatientAdministrativeWarningsCreateDTO {
  patientId: number;
  warningType: string;
  description?: string;
}

export interface PatientAdministrativeWarningsResolveDTO {
  id: number;
}

export interface PatientAdministrativeWarningsUndoResolveDTO {
  id: number;
}
export interface ReferralRequest {
  id: number | undefined;

  patientId: number;
  encounterId: number | null;

  referralType: string;

  fromFacilityId: number;
  toFacilityId: number;

  fromDepartmentId: number;
  toDepartmentId: number;

  referralReason: string;

  priority: string | null;

  status?: string;

  rejectReason?: string | null;
  rejectedDate?: string | null;
  rejectedBy?: string | null;

  acceptedDate?: string | null;
  acceptedBy?: string | null;
}

export type PatientInformationReportVM = {
  patientId: number
  fullName: string
  mrn: string
  dateOfBirth: string
  age: number
  gender: string
  photoUrl?: string

  documentType?: string
  documentNumber?: string

  mobileNumber?: string
  secondaryPhone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  country?: string

  emergencyName?: string
  emergencyRelationship?: string
  emergencyPhone?: string

  registrationDate?: string
  insuranceProvider?: string
  policyNumber?: string

  preferredHealthProfessional?: string
}

export type PatientLabelVM = {
  patientId: number
  patientFullName: string
  mrn: string
  dateOfBirth: string
  age: number
  gender: string
  registrationDate: string
}

export type PatientWristbandVM = {
  fullName: string
  medicalRecordNumber: string
  dateOfBirth: string
  gender: string

  barcode: string
  qrCode: string

  allergyAlert?: string
  bloodGroup?: string

  admissionDateTime?: string
  facilityName?: string
}

export interface NurseSummaryPatientInfoVM {
  patientId: number;
  fullName: string;
  medicalRecordNumber: string;
  dateOfBirth: string | null;
  age: number | null;
  gender: string | null;
}

export interface NurseSummaryEncounterInfoVM {
  encounterId: number;
  encounterNumber: string | null;
  encounterDate: string | null;
  encounterType: string | null;
  encounterReason: string | null;
  priority: string | null;
  status: string | null;
  chiefComplaint: string | null;
  facilityName: number | null;
  departmentName: number | null;
  createdDate: string | null;
}

export interface NurseSummaryObservationVM {
  reasonOfVisit: string | null;
  functionalStatus: string | null;
  patientConditions: string | null;
  cognitiveCheck: string | null;
}

export interface NurseSummaryVitalSignsVM {
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  measurementSite: string | null;
  heartRate: number | null;
  temperature: number | null;
  oxygenSaturation: number | null;
  respiratoryRate: number | null;
  notes: string | null;
}

export interface NurseSummaryBodyMeasurementsVM {
  weight: number | null;
  height: number | null;
  headCircumference: number | null;
}

export interface NurseSummaryAdditionalMeasurementsVM {
  ageGroup: string | null;
  hearingTest: string | null;
  dehydration: boolean | null;
  nasalFlaring: boolean | null;
  responseToLight: boolean | null;
  pupilResponse: boolean | null;
  abilityToFollowTarget: boolean | null;
  colorTesting: boolean | null;
  fallRisk: boolean | null;
  visionProblemsAffectingFunction: boolean | null;
  hearingProblemsAffectingFunction: boolean | null;
  details: string | null;
  actionToTake: string | null;
}

export interface NurseSummaryAllergyVM {
  id: number;
  allergenType: string | null;
  allergenId: number | null;
  severity: string | null;
  criticality: string | null;
  certainty: string | null;
  treatmentStrategy: string | null;
  onset: string | null;
  onsetDate: string | null;
  typeOfPropensity: string | null;
  byPatient: boolean | null;
  sourceOfInformation: string | null;
  allergicReactions: string | null;
  note: string | null;
  status: string | null;
}

export interface NurseSummaryWarningVM {
  id: number;
  warningType: string | null;
  warning: string | null;
  severity: string | null;
  onsetDate: string | null;
  byPatient: boolean | null;
  sourceOfInformation: string | null;
  note: string | null;
  actionTaken: string | null;
  status: string | null;
}

export interface NurseSummaryVaccinationVM {
  id: number;
  vaccineId: number | null;
  vaccineBrandId: number | null;
  vaccineDoseId: number | null;
  vaccineLotNumber: string | null;
  dateAdministered: string | null;
  status: string | null;
  administeredLocation: string | null;
  administrationReactions: string | null;
  isExternalFacility: boolean | null;
  externalFacilityName: string | null;
  notes: string | null;
}

export interface NurseSummaryServiceProductVM {
  id: number;
  category: string | null;
  serviceId: number | null;
  productId: number | null;
  quantity: number | null;
}

export interface NurseSummaryReportVM {
  patientInfo: NurseSummaryPatientInfoVM | null;
  encounterInfo: NurseSummaryEncounterInfoVM | null;
  observation: NurseSummaryObservationVM | null;
  vitalSigns: NurseSummaryVitalSignsVM | null;
  bodyMeasurements: NurseSummaryBodyMeasurementsVM | null;
  additionalMeasurements: NurseSummaryAdditionalMeasurementsVM | null;
  allergies: NurseSummaryAllergyVM[];
  warnings: NurseSummaryWarningVM[];
  vaccinations: NurseSummaryVaccinationVM[];
  servicesAndProducts: NurseSummaryServiceProductVM[];
  generatedAt: string | null;
}

export type PolicyDefinition = {
  id?: number;
  facilityId?: number;
  facilityName?: string;
  code: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
};

export type PolicyDefinitionCreateDTO = {
  facilityId: number;
  code: string;
  name: string;
  description?: string | null;
};

export type PolicyDefinitionUpdateDTO = {
  id: number;
  facilityId: number;
  code: string;
  name: string;
  description?: string | null;
};
export type PatientDiagnosisFlag = {
  encounterId: number;
  hasPrimaryDiagnoses: boolean;
};
export interface Room {
  id?: number;
  facilityId: number | null;
  departmentType: string | null;
  departmentId: number | null;
  name: string;
  type: string | null;
  floor?: string | null;
  isSpecificGender: boolean;
  gender?: string | null;
  isActive: boolean;
  appointable?: boolean | null;
  parallelCapacityValue: number | null;
  defaultDurationMinutes?: number | null;
  defaultBufferBeforeMinutes?: number | null;
  defaultBufferAfterMinutes?: number | null;
}

export interface Bed {
  id?: number;
  roomId: number | null;
  name: string;
  locationDetails?: string | null;
  type: string | null;
  status: string | null;
  isActive: boolean;
}

export interface BedRoomService {
  id?: number;
  roomId: number | null;
  serviceId: number | null;
  bedSpecific: boolean;
  bedId?: number | null;
  rule?: string | null;
  isActive: boolean;
}
export interface EncounterAssignToBed {
  id?: number;
  encounter?: any | null;
  patient?: any | null;
  roomId: number | null;
  bedId: number | null;
  departmentId: number | null;
  admissionReason?: string | null;
  assignedAt?: string | null;
  releasedAt?: string | null;
  isActive: boolean;
}
export interface BedTransaction {
  id?: number;
  encounter?: any | null;
  patient?: any | null;
  fromRoomId?: number | null;
  fromBedId?: number | null;
  toRoomId?: number | null;
  toBedId?: number | null;
  departmentId: number | null;
  transactionType: string | null;
  transactionDate?: string | null;
}
export interface PatientEncounterDischarge {
  encounterId: number | null;
  dischargeType: string | null;
  dischargeAt: string | null;
}
export interface CurrentMedication {
  patientId: number;
  activeIngredientId: number;
  instructions?: string | null;
  startDate: string | Date | null;
}

export type CurrentMedicationCreate = CurrentMedication;

export type CurrentMedicationUpdate = CurrentMedication & {
  id: number;
};

export type CurrentMedicationForm = CurrentMedication & {
  id?: number;
};
