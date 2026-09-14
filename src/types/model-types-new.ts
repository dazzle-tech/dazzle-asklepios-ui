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
  hasResetKey?: boolean;
  allowOngoingVisit: boolean;
  canUnDischargeUrgentCare: boolean;
  canUnCompleteEncounter: boolean;
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
  requirePreAssessment: boolean,
  workingDays?: OrganizationWorkingDay[];
}

export interface DepartmentResponseVM {
  id: number;
  facilityId: number | null;
  name: string;
  departmentType?: string | null;
  appointable?: boolean | null;
  departmentCode?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  encounterType?: string | null;
  isActive?: boolean | null;
  hasMedicalSheets?: boolean | null;
  hasNurseMedicalSheets?: boolean | null;
  parallelCapacityEnabled?: boolean | null;
  parallelCapacityValue?: number | null;
  defaultDurationMinutes?: number | null;
  defaultBufferBeforeMinutes?: number | null;
  defaultBufferAfterMinutes?: number | null;
  requirePractitioner?: boolean | null;
  requireBilling?: boolean | null;
  requirePreAssessment?: boolean | null;
  workingDays?: OrganizationWorkingDay[] | null;
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
  defaultLabDepartmentId?: number | null;
  defaultRadDepartmentId?: number | null;
  defaultLabDepartmentName?: string | null;
  defaultRadDepartmentName?: string | null;
  approvingDiagnosticTestSettlePayment?: boolean;
  
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
  defaultLabDepartmentId?: number | null;
  defaultRadDepartmentId?: number | null;
  approvingDiagnosticTestSettlePayment?: boolean;
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
  departmentName?: string | null;
  facilityName?: string | null;
}

export interface UserDepartmentResponseVM {
  id: number | null;
  userId: number | null;
  facilityId: number | null;
  facilityName: string | null;
  departmentId: number | null;
  departmentName: string | null;
  isActive?: boolean | null;
  isDefault?: boolean | null;
}

export interface UserBookableDepartment {
  id?: number;
  userId: number;
  departmentId: number;
  facilityId?: number;
  isActive?: boolean;
}

export interface UserBookableDepartmentCreateVM {
  userId: number;
  departmentId: number;
}

export interface UserBookableDepartmentResponseVM {
  id: number | null;
  userId: number | null;
  facilityId: number | null;
  facilityName: string | null;
  departmentId: number | null;
  departmentName: string | null;
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
  billingRuleId?: number | null,
}

export interface ServiceItem {
  id?: number;
  type: string; // @Enumerated(EnumType.STRING)
  sourceId: number; // FK to the source entity (e.g., Department id)
  specialty?: string | null; // sub-specialty LOV key (required for DEPARTMENTS)
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
  specialty?: string | null;
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
  specialty?: string | null;
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

export interface AvailabilityTemplateIntervalBreakCreateDTO {
  intervalId: number;
  startTime: string;
  endTime: string;
}

export interface AvailabilityTemplateIntervalBreakResponseVM {
  id?: number | null;
  intervalId?: number | null;
  templateId?: number | null;
  startTime?: string | null;
  endTime?: string | null;
}

export interface AvailabilityTemplateResponseVM {
  id: number;
  facilityId: number;
  departmentId: number;
  resourceId: number;
  templateName: string;
  templateType: string;
  templateColor?: string | null;
  status?: string;
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
  allowWalkInBooking?: boolean | null;
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
  status?: string;
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
  allowWalkInBooking: boolean;
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
  startDate: Date;
  endDate: Date;
  deferred: boolean;
  deferredAt?: string | null;
  scope: string;
  holidayHandlingMode?: string | null;
  policyAssignmentIds?: number[];

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
  requireConfirmation?: boolean | null;
  requirePractitioner?: boolean | null;
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

export interface AppointmentFromTemplateRescheduleDTO {
  oldAppointmentId: number;
  newAppointmentId: number;
  rescheduleReason: string;
}

export interface DiagnosticTestAppointmentRescheduleDTO {
  orderTestId: number;
  newAppointmentId: number;
  rescheduleReason: string;
}

export interface AppointmentSearchFilterMultiDepartmentDTO {
  facility?: number | null;
  departmentIds?: number[] | null;
  resourceType?: TemplateType | null;
  resourceId?: number | null;
  status?: AppointmentStatus[] | null;
  bookingMode?: BookingMode[] | null;
  patientId?: number | null;
  startDate?: Date | null;
  endDate?: Date | null; 
}

/** @deprecated Use AppointmentSearchFilterMultiDepartmentDTO */
export type AppointmentFromTemplateSearchFilterDTO = AppointmentSearchFilterMultiDepartmentDTO;

/** GET `/appointments/bulk-reschedule/preview/{batchId}` — BulkReschedulePreviewVM */
export interface BulkReschedulePreviewVM {
  affectedAppointmentCount?: number | null;
}

/** POST `/appointments/bulk-reschedule` — BulkAppointmentRescheduleDTO */
export interface BulkAppointmentRescheduleDTO {
  originalAvailabilityGenerationBatchId: number;
  replacementAvailabilityGenerationBatchId: number;
}

/** POST `/appointments/bulk-reschedule` — BulkAppointmentRescheduleResponseVM */
export interface BulkAppointmentRescheduleResponseVM {
  success: boolean;
  /** When mapping fails, backend may return ids that could not be matched to replacement slots */
  unmatchedAppointmentIds?: number[] | null;
  unmatchedOldAppointmentIds?: number[] | null;
  message?: string | null;
}

/** GET `/appointments/transfer/sources|targets` — AppointmentTransferVM */
export interface AppointmentTransferVM {
  id: number;
  patientId: number;
  patientName: string;
  medicalRecordNumber: string;
  departmentId: number;
  departmentName: string;
  practitionerId: number;
  practitionerName: string;
  resourceType: TemplateType;
  resourceId: number;
  startDatetime: string;
  endDatetime: string;
  status: AppointmentStatus;
  bookingMode: BookingMode;
}

/** POST `/appointments/bulk-transfer` — AppointmentTransferMappingDTO */
export interface AppointmentTransferMappingDTO {
  oldAppointmentId: number;
  newAppointmentId: number;
}

/** POST `/appointments/bulk-transfer` — BulkAppointmentTransferDTO */
export interface BulkAppointmentTransferDTO {
  transfers: AppointmentTransferMappingDTO[];
}

/** POST `/appointments/bulk-transfer` — BulkAppointmentTransferResponseVM */
export interface BulkAppointmentTransferResponseVM {
  success: boolean;
  message: string;
  transferredCount: number;
  oldAppointmentIds: number[];
  newAppointmentIds: number[];
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
  preferredDate?: string | null;
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
  preferredDate?: string | null;
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
 *  Appointment Waiting List
 * ========================= */

export type WaitingListPriority = string;
export type WaitingListStatus = string;

export interface AppointmentWaitingListVM {
  id?: number | null;
  patientId?: number | null;
  patientName?: string | null;
  patientMrn?: string | null;
  departmentId?: number | null;
  serviceId?: number | null;
  practitionerId?: number | null;
  priority?: WaitingListPriority | null;
  status?: WaitingListStatus | null;
  preferredDate?: string | null;
  expectedDurationMinutes?: number | null;
  reason?: string | null;
  notes?: string | null;
  bookingGroupId?: number | null;
  bookedAt?: string | null;
  createdDate?: string | null;
}

export interface AppointmentWaitingListCreateDTO {
  patientId: number;
  facilityId: number;
  departmentId: number;
  serviceId?: number | null;
  practitionerId?: number | null;
  priority?: WaitingListPriority | null;
  preferredDate?: string | null;
  expectedDurationMinutes: number;
  reason?: string | null;
  notes?: string | null;
}

export interface AppointmentWaitingListBookDTO {
  appointmentIds: number[];
  notes?: string | null;
}

export interface AppointmentWaitingListRemoveDTO {
  reason: string;
}

export type WaitingListBookingMode = string;

export interface WaitingListAvailableSlotVM {
  appointmentId?: number | null;
  startDatetime?: string | null;
  endDatetime?: string | null;
  status?: string | null;
  bookingMode?: WaitingListBookingMode | null;
  practitionerId?: number | null;
  serviceId?: number | null;
}

export interface WaitingListAvailableSlotsByBookingModeVM {
  SLOT?: WaitingListAvailableSlotVM[] | null;
  BUFFER?: WaitingListAvailableSlotVM[] | null;
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
  workingDays?: OrganizationWorkingDay[];
  createdBy?: string;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
  nationalNumber?: string | null;
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
  documentDefinitionId?: number | null;
  documentVersionId?: number | null;
  documentDefinition?: {
    id?: number;
    code?: string;
    name?: string;
  } | null;
  documentVersion?: {
    id?: number;
    version?: number;
    fileName?: string;
  } | null;
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
  documentDefinitionId?: number | null;
  documentVersionId?: number | null;
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
  billingRuleId?: number | null;
}
// DiagnosticTest matches the domain entity fields (incl. raw DB strings + transient lists)

export interface DiagnosticTest {
  id?: number;
  type: string;
  name: string;
  shortName:string;
  internalCode: string;
  hl7IntegrationCode:string;
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
  modality:string
  billingRuleId?: number | null;
}
export interface DiagnosticOrderTestCollectedSampleDTO {
  orderId: number;
  orderTestId: number;
  unit: string;
  quantity: number | string;
  collectedAt: Date | string;
  expiryDate: Date | string | null;
  sourceOfSample: string | null;

}

export interface DiagnosticOrderTestCollectedSampleBulkSameDTO {
  orderId: number;
  orderTestIds: number[];
  unit: string;
  quantity: number | string;
  collectedAt: Date | string;
  expiryDate: Date | string;
  sourceOfSample: string;
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
  isLookAlikeSoundAlike?: boolean;
  highAlert?: boolean | null;
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
  billingRuleId?: number | null;
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

  preferredLanguage?: string | null;
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

  isCchiPatient?: boolean | null;
  documentId?: string | null;

  isVerified?: boolean | null;
  isCompletedPatient?: boolean | null;
  securityAccessLevel?: string | null;
  bloodGroup?: string | null;
  patientConditions?: string | null;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: Date | null;
  patientStatus?: string | null;
  mergedIntoPatientId?: number | null;
  mergedAt?: Date | null;
  mergedBy?: string | null;
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
  countryId?: number | null;
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
  itemType: string | null;

  serviceId?: number | null;
  brandMedicationId?: number | null;
  diagnosticTestId?: number | null;
  procedureId?: number | null;

  price: number | string;
  discountAllowed: boolean;
  isActive: boolean;

  createdDate?: Date | string | null;
  lastModifiedDate?: Date | string | null;
}

export interface PriceListItem {
  id?: number;
  priceListId: number;
  itemType: string | null;

  serviceId?: number | null;
  brandMedicationId?: number | null;
  diagnosticTestId?: number | null;
  procedureId?: number | null;

  price: number | string;
  discountAllowed: boolean;
  isActive: boolean;

  createdDate?: Date | string | null;
  lastModifiedDate?: Date | string | null;
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
  status?: string;
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

  // Waseel / NPHIES
  nphiesId?: string;
  waseelPayerId?: string;
  tpaNphiesId?: string;
  isWaseelEnabled: boolean;

  isActive: boolean;

  createdDate?: Date | null;
  lastModifiedDate?: Date | null;
}

export interface PayorPlan {
  id?: number;

  payorId?: number;
  name: string;
  planType: string | null;

  // Waseel / CCHI
  networkId?: string;
  coverageType?: string;
  payerNphiesId?: string;
  waseelPlanId?: string;

  isActive: boolean;

  createdDate?: Date | null;
  lastModifiedDate?: Date | null;
}

export interface NphiesPayer {
  id?: number;

  nphiesId: string;
  nameEn: string;
  nameAr?: string | null;

  isActive: boolean;

  createdDate?: Date | string | null;
  lastModifiedDate?: Date | string | null;
}

export interface PayorPlanItem {
  id?: number;
  planId: number;
  itemType: string;
  amount?: number | null;
  coverageType: string;
  isActive: boolean;
  preAuthorization?: boolean;
  brandMedicationId?: number | null;
  diagnosticTestId?: number | null;
  serviceId?: number | null;
  procedureId?: number | null;
  createdDate?: Date | string | null;
  lastModifiedDate?: Date | string | null;
}

export interface PayorPlanCoverageClass {
  id?: number;

  planId?: number;
  coverageClassType: string | null;
  coverageClassValue: string;
  coverageClassName?: string;

  isActive: boolean;

  createdDate?: Date | null;
  lastModifiedDate?: Date | null;
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
  countryId?: number | null;
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

  payorId?: number | null;
  planId?: number | null;

  payerName?: string | null;
  payerNphiesId?: string | null;

  policyHolderId?: number | null;

  policyNumber: number | string;
  groupNumber?: number | string | null;

  expirationDate: string;

  remainingBenefits?: number | string | null;
  remainingDeductibles?: number | string | null;

  memberCardId?: string | null;

  networkId?: string | null;
  sponsorNumber?: string | null;

  coverageType?: string | null;
  relationWithSubscriber?: string | null;

  policyClassName?: string | null;
  policyHolderName?: string | null;

  groupName?: string | null;
  planCode?: string | null;
  eligibilityStatus?: string | null;
  siteEligibility?: string | null;
  inforce?: string | null;
  gpVisitCopay?: number | string | null;
  specialistVisitsLimit?: number | null;
  eligibilityBenefitsJson?: string | null;
  lastEligibilityRequestId?: number | null;
  lastEligibilitySyncedAt?: Date | string | null;

  issueDate?: string | null;

  patientShare?: number | string | null;
  maxLimit?: number | string | null;

  waseelNewPlan?: boolean | null;

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

  status?: string;

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

  specialty?: string | null;
  practitionerId?: number | null;
  appointmentId?: string | null;
  encounterType: string;
  encounterReason: string;

  followUpEncounterId?: number | null;
  followUpEncounter?: {
    id: number;
    encounterNumber?: string | null;
    createdDate?: Date | string | null;
    createdAt?: Date | string | null;
  } | null;
  createdDate?: Date | string | null;
  createdAt?: Date | string | null;

  priorityLevel: string;

  originType?: string | null;
  originName?: string | null;

  notes?: string | null;

  encounterStatus?: string | null;
  treatmentStatus?: string;
  /** @deprecated use treatmentStatus */
  status?: string;
  encounterDate?: Date | null;
  startedDate?: string | null;
  startedBy?: string | null;
  physicalExaminationSummery?: string | null;
  historyOfPresentIllness?: string | null;
  coverageType?: string | null;
  patientInsuranceId?: number | null;

}

export type PatientBasicInformationResponseVM = {
  firstName: string;
  secondName?: string;
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
  countryId?: number | null;
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

  policyNumber: number | string;
  groupNumber?: number | string | null;

  expirationDate: string; // LocalDate -> string (YYYY-MM-DD)
  remainingBenefits?: number | string | null;
  remainingDeductibles?: number | string | null;

  memberCardId?: string | null;
  payerNphiesId?: string | null;
  networkId?: string | null;
  sponsorNumber?: string | null;
  coverageType?: string | null;
  relationWithSubscriber?: string | null;
  policyClassName?: string | null;
  policyHolderName?: string | null;
  issueDate?: string | null; // LocalDate -> string (YYYY-MM-DD)
  patientShare?: number | string | null;
  maxLimit?: number | string | null;
  waseelNewPlan?: boolean | null;

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

  status?: string;

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
  encounterStatus?: string | null;
  treatmentStatus?: string;
  /** @deprecated use treatmentStatus */
  status?: string;

  followUpEncounter?: {
    id: number;
    encounterNumber?: string | null;
    createdDate?: string | null;
    createdAt?: string | null;
  } | null;

  originType?: string | null;
  originName?: string | null;
  notes?: string | null;
  chiefComplaint?: string | null;

  hasPrescription: boolean;
  hasOrder: boolean;
  isObserved: boolean;
  physicalExaminationSummery?: string | null;
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
  historyOfPresentIllness?: string | null;
  coverageType?: string | null;
  patientInsuranceId?: number | null;
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
  countryId?: number | null;
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
  patientId?: number | null;
  encounterId?: number | null;
}
export interface PatientInsurance {
  id?: number;
  patientId: number;
  payorId: number;
  planId?: number | null;
  policyHolderId?: number | null;

  policyNumber: number | string;
  groupNumber?: number | string | null;

  expirationDate: string; // LocalDate -> string (YYYY-MM-DD)
  remainingBenefits?: number | string | null;
  remainingDeductibles?: number | string | null;

  memberCardId?: string | null;
  payerNphiesId?: string | null;
  networkId?: string | null;
  sponsorNumber?: string | null;
  coverageType?: string | null;
  relationWithSubscriber?: string | null;
  policyClassName?: string | null;
  policyHolderName?: string | null;
  issueDate?: string | null; // LocalDate -> string (YYYY-MM-DD)
  patientShare?: number | string | null;
  maxLimit?: number | string | null;
  waseelNewPlan?: boolean | null;

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
  result?: string | null;

  status?: ProcStatus;

  cancelledDate?: string | null;
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

  status?: string;

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

  status?: string;
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

  encounterStatus?: string | null;
  treatmentStatus?: string;
  /** @deprecated use treatmentStatus */
  status?: string;

  chiefComplaint?: string | null;

  startedDate?: string | null;
  startedBy?: string | null;

  hasPrescription: boolean;
  hasOrder: boolean;
  isObserved: boolean;
  physicalExaminationSummery?: string | null;
  historyOfPresentIllness?: string | null;
  coverageType?: string | null;
  patientInsuranceId?: number | null;
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
  insuranceOutstandingAmount?: number;
  walletBalance: number;
  reservedBalance?: number;
  consumedAmount?: number;
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
  patientId?: number | null;
  encounterId?: number | null;
  dataJson: string | null;
  createdBy?: string | null;
  createdDate?: string | null;
}

export interface FormEntryCreateVM {
  title: string;
  templateId: number;
  facilityId: number;
  departmentId: number;
  dataJson: string;
  patientId?: number | null;
  encounterId?: number | null;
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

/** Form model aligned with EmailSettings entity. */
export interface EmailSettings {
  id?: number;
  /** @NotNull, max 255 */
  serverName?: string;
  /** @NotNull, max 255 */
  host?: string;
  /** @NotNull, max 500 */
  description?: string;
  /** @NotNull */
  smtpPort?: number;
  /** @NotNull, max 255 */
  fromAddress?: string;
  /** @NotNull */
  password?: string;
  /** @NotNull */
  protocol?: string;
  /** @NotNull */
  tls?: boolean;
  /** optional, max 255 */
  emailPrefix?: string | null;
  /** optional */
  emailFooter?: string | null;
}

export interface EmailSettingsCreateDTO {
  serverName: string;
  host: string;
  description: string;
  smtpPort: number;
  fromAddress: string;
  password: string;
  protocol: string;
  tls: boolean;
  emailPrefix?: string | null;
  emailFooter?: string | null;
}

export interface EmailSettingsUpdateDTO extends EmailSettingsCreateDTO {
  id: number;
}

export interface EmailSettingsTestConnectionDTO {
  id?: number;
  serverName: string;
  host: string;
  smtpPort: number;
  fromAddress: string;
  password: string;
  protocol: string;
  tls: boolean;
}

export interface EmailSettingsResponseVM {
  id: number;
  serverName: string;
  host: string;
  description: string;
  smtpPort: number;
  fromAddress: string;
  password: string;
  protocol: string;
  tls: boolean;
  emailPrefix?: string | null;
  emailFooter?: string | null;
}

/** Form model aligned with WhatsAppSettings entity. */
export interface WhatsAppSettings {
  id?: number;
  /** @NotNull, max 255 */
  name?: string;
  /** @NotNull, max 500 */
  description?: string;
  /** @NotNull */
  apiVersion?: string;
  /** @NotNull */
  phoneNumberId?: string;
  /** @NotNull */
  whatsappBusinessAccountId?: string;
  /** @NotNull */
  accessToken?: string;
  /** @NotNull */
  verifyToken?: string;
  /** optional, max 500 */
  webhookUrl?: string | null;
  /** @NotNull */
  enabled?: boolean;
}

export interface WhatsAppSettingsCreateDTO {
  name: string;
  description: string;
  apiVersion: string;
  phoneNumberId: string;
  whatsappBusinessAccountId: string;
  accessToken: string;
  verifyToken: string;
  webhookUrl?: string | null;
  enabled: boolean;
}

export interface WhatsAppSettingsUpdateDTO extends WhatsAppSettingsCreateDTO {
  id: number;
}

export interface WhatsAppSettingsTestConnectionDTO {
  apiVersion: string;
  phoneNumberId: string;
  accessToken: string;
}

export interface WhatsAppSettingsResponseVM {
  id: number;
  name: string;
  description: string;
  apiVersion: string;
  phoneNumberId: string;
  whatsappBusinessAccountId: string;
  accessToken: string;
  verifyToken: string;
  webhookUrl?: string | null;
  enabled: boolean;
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
  allergenName?: string;
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
  status?: string;
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
  prescriptionNum: string;
  prescriptionDate: string;
  urgencyLevel: string;
  status?: string;
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
  medicationsId: number | null;
  activeIngredientId: number | null;
  otherMedicationName?: string | null;
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
  cancellationReason?:string|null;
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
  action: string;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  payload?: string;
  oldNoteText?: string;
  newNoteText?: string;
};

export interface PatientAllergiesActiveIngredientCreate {
  activeIngredientId?: number;
}

export interface PatientAllergiesCreateDTO {
  patientId: number;
  encounterId: number;
  allergenType?: string;
  allergenId?: number;
  allergenName?: string;
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
  status?: string;
  allergicReactions?: string;

  activeIngredients?: number[];
}

export type PatientAllergiesUpdateDTO = {
  id: number;
  allergenType: string; // FOOD, MEDICATION, ...
  allergenId?: number;
  allergenName?: string;
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
  EXAM_DONE = 'EXAM_DONE',
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
  result?: string | null;
  acceptUncoveredAsCash?: boolean;
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
  result?: string | null;
};

export type PatientProcedureCancelVM = {
  id: number;
  cancellationReason: string;
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

  undoAcceptReason?: string;
  undoAcceptBy?: string;
  undoAcceptDate?: string;
  icdDiagnosisId?: number;
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
  icdDiagnosisId?: number;
  acceptUncoveredAsCash?: boolean;
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
export interface BulkCancelDTO {
  ids: number[];
  cancellationReason: string;
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

export type CTASEmergencyTriageLevelUpdate = Pick<
  EmergencyTriage,
  | 'id'
  | 'emergencyLevel'
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
  serviceSource: ServiceSource;
  SourceId?: number | null;
  paymentStatus?: string | null;
  createdDate?: string | null;
  preAuthorizationStatus?: string | null;
  preAuthorizationReferenceNo?: string | null;
  preAuthorizationRequired?: boolean | null;
  itemName?: string | null;
  itemCode?: string | null;
  priceSource?: string | null;
  netAmount?: number | null;
  patientShareAmount?: number | null;
  insuranceShareAmount?: number | null;
};

export enum ServiceSource {
  LABORATORY = 'LABORATORY',
  RADIOLOGY = 'RADIOLOGY',
  PROCEDURE = 'PROCEDURE',
  CONSULTATION_PORTAL = 'CONSULTATION_PORTAL',
  SERVICE_AND_PRODUCT = 'SERVICE_AND_PRODUCT',
  DENTAL_PROCEDURE = 'DENTAL_PROCEDURE',
  ENCOUNTER_DEFAULT_SERVICE = 'ENCOUNTER_DEFAULT_SERVICE',
  PRESCRIPTION = 'PRESCRIPTION',
}

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
  serviceSource: ServiceSource;
  SourceId?: number | null; // ID of the source entity (e.g., diagnostic order test ID, procedure ID, etc.)
  acceptUncoveredAsCash?: boolean | null;
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
  goals: string | null;
  treatmentPlan: string | null;

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
  goals: string | null;
  treatmentPlan: string | null;

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

  byPatient?: boolean;

  sourceOfInformation?: string | null;

  latestFunctionalStatus?: string | null;

  latestCognitiveCheck?: string | null;

  patientConditions?: string | null;

  isActive: boolean;

  functionalStatus?: string | null;

  cognitiveCheck?: string | null;

  bloodGroup?: string | null;

  createdDate?: Date | string | null;

  lastModifiedDate?: Date | string | null;
}

export interface PainAssessment {
  id?: number;

  patientId: number;
  encounterId: number;

  painDegree?: string | null;
  painLevel?: 'NO_PAIN' | 'MILD' | 'MODERATE' | 'SEVERE' | string | null;
  painAssessmentType?: 'NUMERIC' | 'FLACC' | 'FACES' | string | null;
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

export type PolicyResourceType = string;

export type PolicyAssignment = {
  id?: number;
  policyId: number;
  policy?: PolicyDefinition;
  facilityId: number;
  resourceType: PolicyResourceType;
  resourceId: number;
  isActive?: boolean;
  isRequired?: boolean;
};

export type PolicyAssignmentCreateDTO = {
  policyId: number;
  resourceType: PolicyResourceType;
  resourceId: number;
  isRequired: boolean;
};

export type PolicyAssignmentUpdateDTO = {
  id: number;
  isRequired: boolean;
};
export type AppointmentPolicyAssignment = {
  id?: number;
  policyId: number;
  policyAssignmentId: number;
  appointment: AppointmentFromTemplate;
  isApplied?: boolean;
  isRequired?: boolean;
};
export type AppointmentPolicyAssignmentResponseVM = {
  id?: number;
  policyId: number;
  policyAssignmentId: number;
  appointment: AppointmentFromTemplate;
  isApplied?: boolean;
  isRequired?: boolean;
  policyName?: string;
  policyCode?: string;
};

export type AppointmentPolicyAssignmentAppliedUpdateDTO = {
  id: number;
  isApplied: boolean;
};

export type AppointmentPolicyAssignmentAppliedBulkUpdateDTO = {
  updates: AppointmentPolicyAssignmentAppliedUpdateDTO[];
};

export type SkillDefinition = {
  id?: number;
  facilityId?: number;
  facilityName?: string;
  code: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
  type?: string;
};

export type SkillDefinitionCreateDTO = {
  facilityId: number;
  code: string;
  name: string;
  description?: string | null;
  type: string;
};

export type SkillDefinitionUpdateDTO = {
  id: number;
  facilityId: number;
  code: string;
  name: string;
  description?: string | null;
  type: string;
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
  dischargeAt: Date | string | null;
}
export interface CurrentMedication {
  patientId: number;
  activeIngredientId: number;
  dosage?: number | null;
  unit?: string | null;
  frequency?: string | null;
  startDate: string | Date | null;
}

export type CurrentMedicationCreate = CurrentMedication;

export type CurrentMedicationUpdate = CurrentMedication & {
  id: number;
};

export type CurrentMedicationForm = CurrentMedication & {
  id?: number;
};


export interface PatientUccMedicationOrder {
  id?: number;

  patientId: number;
  encounterId: number;

  activeIngredientId: number;

  instructionType: 'MANUAL_INSTRUCTIONS' | 'CUSTOM_INSTRUCTIONS';
  instructionText?: string | null;

  dose?: number | null;
  doseUnit?: string | null;
  route?: string | null;
  frequency?: string | null;

  isHighAlert?: boolean | null;

  status?:
  | 'WAITING_DOUBLE_CHECK'
  | 'ADMINISTERED'
  | 'CANCELLED'
  | 'DISCARDED'
  | 'NEW'
  | 'SUBMITTED';

  submittedDate?: string | Date | null;
  submittedBy?: string | null;

  administeredDate?: string | Date | null;
  administeredBy?: string | null;

  doubleCheckedDate?: string | Date | null;
  doubleCheckedBy?: string | null;

  discardedDate?: string | Date | null;
  discardedBy?: string | null;
  discardReason?: string | null;

  cancelledDate?: string | Date | null;
  cancelledBy?: string | null;
  cancellationReason?: string | null;
  createdBy?: string | null;
  createdDate?: string | Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | Date | null;
}

// ------------------- Dental Procedures -------------------

export type ToothNumber =
  | 'Tooth1' | 'Tooth2' | 'Tooth3' | 'Tooth4' | 'Tooth5' | 'Tooth6' | 'Tooth7' | 'Tooth8'
  | 'Tooth9' | 'Tooth10' | 'Tooth11' | 'Tooth12' | 'Tooth13' | 'Tooth14' | 'Tooth15' | 'Tooth16'
  | 'Tooth17' | 'Tooth18' | 'Tooth19' | 'Tooth20' | 'Tooth21' | 'Tooth22' | 'Tooth23' | 'Tooth24'
  | 'Tooth25' | 'Tooth26' | 'Tooth27' | 'Tooth28' | 'Tooth29' | 'Tooth30' | 'Tooth31' | 'Tooth32';
export interface DentalProcedureResponseVM {
  id?: number;
  patientId?: number;
  encounterId?: number;
  toothNumber?: ToothNumber;
  surface?: string;
  anesthesiaUsed?: string | null;
  dose?: number | null;
  unit?: string | null;
  fillingMaterial?: string | null;
  procedureId?: number | null;
  serviceId?: number | null;
  cdtCodeId?: number | null;
  notes?: string | null;
  cancelled?: boolean;
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
  cancelledBy?: string | null;
  cancelledDate?: string | null;
  cancellationReason?: string | null;
}

export interface DentalProcedureCreateDTO {
  patientId: number;
  encounterId: number;
  toothNumber: ToothNumber;
  surface: string;
  anesthesiaUsed?: string | null;
  dose?: number | null;
  unit?: string | null;
  fillingMaterial?: string | null;
  procedureId: number;
  serviceId?: number | null;
  cdtCodeId?: number | null;
  notes?: string | null;
  acceptUncoveredAsCash?: boolean | null;
}

export interface DentalProcedureUpdateDTO {
  id: number;
  toothNumber: ToothNumber;
  surface: string;
  anesthesiaUsed?: string | null;
  dose?: number | null;
  unit?: string | null;
  fillingMaterial?: string | null;
  procedureId: number;
  serviceId?: number | null;
  cdtCodeId?: number | null;
  notes?: string | null;
}
export interface GlasgowComaScaleAssessment {
  id?: number;
  encounter?: any | null;
  patient?: any | null;

  eyeOpening: string | null;
  eyeOpeningScore?: number | null;

  verbalResponse: string | null;
  verbalResponseScore?: number | null;

  motorResponse: string | null;
  motorResponseScore?: number | null;

  totalScore?: number | null;
  scoreInterpretation?: string | null;
}

// ------------------- Waseel Eligibility -------------------

export interface EligibilityCheckRequest {
  patientId?: number | null;
  patientInsuranceId?: number | null;
  serviceDate?: string | null;
  benefits?: boolean | null;
  discovery?: boolean | null;
  validation?: boolean | null;
  transfer?: boolean | null;
  emergency?: boolean | null;
  destinationId?: string | null;
}

export interface EligibilityCheckResult {
  eligibilityRequestId?: number | null;
  apiStatus?: string | null;
  statusCode?: string | null;
  message?: string | null;
  eligibilityResponseId?: string | null;
  eligibilityResponseUrl?: string | null;
  requestStatus?: string | null;
}

export interface EligibilityCheckResponse {
  eligibilityRequestId?: number | null;
  apiStatus?: string | null;
  statusCode?: string | null;
  message?: string | null;
  eligibilityResponseId?: string | null;
  eligibilityResponseUrl?: string | null;
  requestStatus?: string | null;
}

// ------------------- Waseel Pre-Authorization -------------------

export interface PreAuthorizationTrackingItemResponse {
  id?: number | null;
  sequence?: number | null;
  itemType?: string | null;
  itemCode?: string | null;
  itemDescription?: string | null;
  nonStandardCode?: string | null;
  nonStandardDesc?: string | null;
  isPackage?: boolean | null;
  isMaternity?: boolean | null;
  quantity?: number | string | null;
  quantityCode?: string | null;
  unitPrice?: number | string | null;
  discount?: number | string | null;
  factor?: number | string | null;
  taxPercent?: number | string | null;
  tax?: number | string | null;
  patientSharePercent?: number | string | null;
  patientShare?: number | string | null;
  payerShare?: number | string | null;
  net?: number | string | null;
  startDate?: string | null;
  endDate?: string | null;
  waseelItemId?: number | null;
  itemDecision?: string | null;
  reasonCodes?: string | null;
}

export interface PreAuthorizationTrackingResponse {
  id?: number | null;

  patientId?: number | null;
  encounterId?: number | null;
  patientInsuranceId?: number | null;
  payorId?: number | null;
  payorPlanId?: number | null;

  providerId?: string | null;
  providerNphiesId?: string | null;

  transactionId?: number | null;
  outgoingTransactionId?: string | null;
  approvalRequestId?: number | null;
  approvalResponseId?: number | null;
  preAuthRefNo?: string | null;

  eligibilityResponseId?: string | null;
  eligibilityResponseUrl?: string | null;
  eligibilityOfflineId?: string | null;
  eligibilityOfflineDate?: string | null; // LocalDate -> string (YYYY-MM-DD)

  dateOrdered?: string | null; // LocalDate -> string (YYYY-MM-DD)

  payeeId?: number | null;
  payeeType?: string | null;

  preauthType?: string | null;
  preauthSubType?: string | null;

  episodeId?: string | null;
  prescription?: string | null;

  transfer?: boolean | null;
  isNewBorn?: boolean | null;
  destinationId?: string | null;

  encounterStatus?: string | null;
  encounterClass?: string | null;
  serviceType?: string | null;
  serviceEventType?: string | null;
  serviceProvider?: number | null;
  encounterStartDate?: string | null; // LocalDate -> string (YYYY-MM-DD)
  encounterEndDate?: string | null; // LocalDate -> string (YYYY-MM-DD)

  totalNet?: number | string | null; // BigDecimal

  status?: string | null;
  outcome?: string | null;
  message?: string | null;
  disposition?: string | null;
  statusReason?: string | null;

  isCancelled?: boolean | null;
  cancelReason?: string | null;
  cancelStatus?: string | null;
  cancelOutcome?: string | null;
  cancelMessage?: string | null;

  searchCompleted?: boolean | null;
  canCommunicate?: boolean | null;
  canCancel?: boolean | null;
  canResubmit?: boolean | null;
  resubmittedFromId?: number | null;
  resubmittedAsId?: number | null;
  waseelClaimItemIds?: number[] | null;
  items?: PreAuthorizationTrackingItemResponse[] | null;
  communicationCount?: number | null;

  createdDate?: string | null; // Instant -> string (ISO)
  createdBy?: string | null;
  lastModifiedDate?: string | null; // Instant -> string (ISO)
  lastModifiedBy?: string | null;
}

export interface PreAuthorizationCommunicationPayloadHistory {
  contentType?: 'TEXT' | 'ATTACHMENT' | 'TEXT_AND_ATTACHMENT' | string | null;
  payloadValue?: string | null;
  claimItemId?: number | null;
  attachmentId?: number | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  sizeBytes?: number | null;
  isSentToWaseel?: boolean | null;
  downloadUrl?: string | null;
}

export interface PreAuthorizationCommunicationHistoryResponse {
  trackId?: number | null;
  trackType?: string | null;
  status?: string | null;
  outcome?: string | null;
  message?: string | null;
  communicationId?: number | null;
  transactionId?: number | null;
  approvalResponseId?: number | null;
  createdDate?: string | null;
  createdBy?: string | null;
  payloads?: PreAuthorizationCommunicationPayloadHistory[] | null;
}

export interface EncounterPreAuthorizationRefreshItem {
  patientServiceProductId?: number | null;
  preAuthorizationRequestId?: number | null;
  approvalRequestId?: number | null;
  preAuthorizationStatus?: string | null;
  waseelStatus?: string | null;
  canPayAsCash?: boolean | null;
  canClonePreAuthorization?: boolean | null;
}

export interface EncounterPreAuthorizationRefreshResponse {
  encounterId?: number | null;
  refreshedRequestCount?: number | null;
  approvedItemCount?: number | null;
  rejectedItemCount?: number | null;
  pendingItemCount?: number | null;
  canCloseCalculation?: boolean | null;
  message?: string | null;
  items?: EncounterPreAuthorizationRefreshItem[] | null;
}

export interface PreAuthorizationCommunicationRequest {
  preAuthorizationId?: number;
  claimResponseId?: number;
  payloads?: {
    attachmentName?: string;
    attachmentType?: string;
    claimItemId?: number;
    createdDate?: string;
    payloadAttachment?: string;
    payloadValue?: string;
    attachmentId?: number;
  }[];
}

export type CancelReason =
  | 'SERVICE_NOT_PERFORMED'
  | 'WRONG_INFORMATION'
  | 'TRANSACTION_ALREADY_SUBMITTED';

export type PreAuthorizationCancelRequest = {
  preAuthorizationId?: number;
  approvalRequestId?: number;
  cancelReason?: CancelReason;
};

export interface PatientProblem {
  id?: number;
  patient?: any | null;

  condition: string | null;
  dateOfDiagnosis?: string | Date | null;
  conditionStatus: string | null;
  type: string | null;
  dateOfResolution?: string | Date | null;
  byPatient: boolean | null;
  sourceOfInformation?: string | null;
  status?: string | null;
  cancelledBy?: string | null;
  cancelledDate?: string | Date | null;
  cancellationReason?: string | null;
  createdBy?: string | null;
  createdDate?: string | Date | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | Date | null;


}

export interface OCRParsingResponseDTO {
   type: string | null;
   documentNumber: number | null;
   familyName: string | null;
   givenNames: string | null;
   nationality: string | null,
   dateOfBirth: Date | null,  // change it later
   sex : string | null, // change it later
   placeOfBirth: string;
}

export interface MedicationTestValidationPatient {
  mrn: string;
  fullName?: string;
  gender?: string;
  dob?: string;
  [k: string]: any;
}

export interface MedicationTestValidationEncounter {
  visitId?: string;
  visitType?: string;
  plannedStartDate?: string;
  chiefComplaint?: string;
  patientAge?: string;
  diagnosis?: string;
  [k: string]: any;
}

export interface MedicationTestValidationDiagnosis {
  type?: string;
  value?: string;
  [k: string]: any;
}

export interface MedicationValidationRequestDTO {
  patientId: number;
  encounterId: number;
  // [k: string]: any;
}

export interface TestValidationRequestDTO {
  patientId: number;
  encounterId: number;
  // [k: string]: any;
}

export interface ValidationQuickSummaryDTO {
  overall_status?: string;
  top_priority?: string;
  [k: string]: any;
}

export interface DetailedValidationDTO {
  item?: string;
  severity?: string;
  issue?: string;
  recommendation?: string;
  evidence?: string;
  [k: string]: any;
}

export interface RecommendedAlternativeDTO {
  original_item?: string;
  alternative?: string;
  rationale?: string;
  [k: string]: any;
}

export interface ValidationResponseDTO {
  quick_summary?: ValidationQuickSummaryDTO;
  detailed_validations?: DetailedValidationDTO[];
  recommended_alternatives?: RecommendedAlternativeDTO[];
  confidence_score?: number;
  timestamp?: string;
  [k: string]: any;
}



export type WaseelSbsImportResult = {
  totalRows: number;
  successRows: number;
  failedRows: number;
  message: string;
  errorDetails?: string;
};

export type WaseelSbsCatalog = {
  id: number;
  waseelItemType?: string;
  sbsCode: string;
  updateType?: string;
  revisionDetails?: string;
  shortDescription?: string;
  longDescription?: string;
  isActive: boolean;
};

export type WaseelItemMapping = {
  id: number;
  itemType?: string;
  sourceId?: number;
  itemCode?: string;
  itemName?: string;
  sbsCatalogId: number;
  waseelItemType?: string;
  sbsCode: string;
  sbsDescription?: string;
  isActive: boolean;
  notes?: string;
};

export type PriceListSetupType =
  | 'CASH'
  | 'SELF_PAY'
  | 'INSURANCE'
  | 'CORPORATE'
  | 'PACKAGE'
  | 'EMPLOYEE';

export type PriceListSetupStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'EXPIRED'
  | 'CANCELLED';

export type PriceListItemType =
  | 'MEDICATION'
  | 'LABORATORY'
  | 'RADIOLOGY'
  | 'PATHOLOGY'
  | 'SERVICE'
  | 'PROCEDURE';

export type PricingMethod =
  | 'FIXED_PRICE'
  | 'DISCOUNT'
  | 'MARKUP'
  | 'NO_CHARGE'
  | 'MANUAL';

  export type PriceListSetup = {
  id?: number;

  facilityId?: number;
  facilityName?: string;

  type?: PriceListSetupType;

  payerId?: number;
  payerName?: string;

  name?: string;
  description?: string;

  versionNumber?: number;

  effectiveFrom?: string;
  effectiveTo?: string;

  status?: PriceListSetupStatus;

  currency?: string;

  isActive?: boolean;
};

export type PriceListSetupItem = {
  id?: number;

  priceListSetupId?: number;

  waseelItemMappingId?: number;
  sbsCatalogId?: number;

  itemType?: PriceListItemType;

  sourceId?: number;

  itemCode?: string;
  nonStandardCode?: string | null;
  itemName?: string;


  unitPrice?: number;
  discountPercentage?: number;

  isActive?: boolean;

  requiresPreAuthorization?: boolean;
};
export type SavePriceListSetupItemRequest = {
  waseelItemMappingId?: number | null;
  sbsCatalogId?: number | null;
  itemType: PriceListItemType;
  sourceId: number;
  itemCode: string;
  nonStandardCode?: string | null;
  itemName: string;
  pricingMethod: PricingMethod;
  unitPrice: number;
  discountPercentage: number;
  isActive?: boolean;
  requiresPreAuthorization?: boolean;
};
export type SavePriceListSetupRequest = {
  facilityId: number;
  type: PriceListSetupType;
  payerId?: number | null;
  name: string;
  description?: string | null;
  versionNumber: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  currency: string;
  status?: PriceListSetupStatus;
};

export enum BillingTrigger {
  ENCOUNTER_CREATED = 'ENCOUNTER_CREATED',
  TREATMENT_STARTED = 'TREATMENT_STARTED',
  ORDERED = 'ORDERED',
  DISPENSED = 'DISPENSED',
  SERVICE_COMPLETED = 'SERVICE_COMPLETED',
  CHECKOUT = 'CHECKOUT',
  MANUAL = 'MANUAL',
  DEBIT_NOTE = 'DEBIT_NOTE'
}

export enum BillingEventType {
  ENCOUNTER_CREATED = 'ENCOUNTER_CREATED',
  TREATMENT_STARTED = 'TREATMENT_STARTED',
  ITEM_ORDERED = 'ITEM_ORDERED',
  ITEM_DISPENSED = 'ITEM_DISPENSED',
  SERVICE_COMPLETED = 'SERVICE_COMPLETED',
  ITEM_UPDATED = 'ITEM_UPDATED',
  ITEM_CANCELLED = 'ITEM_CANCELLED',
  ENCOUNTER_CANCELLED = 'ENCOUNTER_CANCELLED',
  CHECKOUT = 'CHECKOUT',
  MANUAL = 'MANUAL',
  DEBIT_NOTE = 'DEBIT_NOTE'
}

export enum BillingSettlementPath {
  REMAINING_TO_PAY = 'REMAINING_TO_PAY',
  LEDGER_DEBIT_AT_CHECKOUT = 'LEDGER_DEBIT_AT_CHECKOUT',
  MANUAL = 'MANUAL'
}

export type BillingRuleEvaluationRequest = {
  billingItemType: BillingItemType;
  billingEvent: BillingEventType;
  serviceId?: number | null;
  procedureId?: number | null;
  diagnosticTestId?: number | null;
  brandMedicationId?: number | null;
};

export type BillingRuleEvaluationResponse = {
  ruleFound: boolean;
  billingRuleId?: number | null;
  billingRuleName?: string | null;
  billingItemType?: BillingItemType | null;
  billingTrigger?: BillingTrigger | null;
  settlementPath?: BillingSettlementPath | null;
  billingEvent?: BillingEventType | null;
  eventMatches?: boolean;
  billsOnCurrentEvent?: boolean;
  message?: string | null;
};

export type BillingRule = {
  id?: number;
  name?: string;
  billingItemType?: BillingItemType;
  billingTrigger?: BillingTrigger;
  isDefault?: boolean;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
};

export type SaveBillingRuleRequest = {
  id?: number | null;
  name: string;
  billingItemType: BillingItemType;
  billingTrigger: BillingTrigger;
  isDefault: boolean;
};

export type BillingConfigurationKey =
  | 'DEFAULT_CURRENCY_ID'
  | 'DEFAULT_PRICE_LIST_ID'
  | 'DEFAULT_CASH_PAYER_ID'
  | 'DEFAULT_PAYMENT_METHOD_ID'
  | 'DEFAULT_TAX_ID'
  | 'DECIMAL_PRECISION'
  | 'ROUNDING_METHOD'
  | 'PRICES_INCLUDE_TAX'
  | 'APPLY_TAX_AUTOMATICALLY'
  | 'ALLOW_TAX_OVERRIDE'
  | 'ALLOW_INVOICE_WITHOUT_PAYER'
  | 'ALLOW_MANUAL_PRICE_OVERRIDE'
  | 'REQUIRE_PRICE_OVERRIDE_REASON'
  | 'ALLOW_NEGATIVE_INVOICE_LINES'
  | 'REQUIRE_ENCOUNTER_REFERENCE'
  | 'REQUIRE_PATIENT_REFERENCE'
  | 'ALLOW_DRAFT_INVOICE'
  | 'AUTO_FINALIZE_INVOICE'
  | 'ALLOW_DISCOUNT'
  | 'ALLOW_MANUAL_DISCOUNT'
  | 'MAXIMUM_MANUAL_DISCOUNT_PERCENTAGE'
  | 'REQUIRE_DISCOUNT_REASON'
  | 'ALLOW_PARTIAL_PAYMENT'
  | 'ALLOW_MULTIPLE_PAYMENT_METHODS'
  | 'ALLOW_OVERPAYMENT'
  | 'ALLOW_PAYMENT_BEFORE_INVOICE_FINALIZATION'
  | 'AUTO_CLOSE_FULLY_PAID_INVOICE'
  | 'ALLOW_UNALLOCATED_PAYMENT'
  | 'ALLOW_INVOICE_CANCELLATION'
  | 'REQUIRE_CANCELLATION_REASON'
  | 'ALLOW_CANCELLATION_AFTER_PAYMENT'
  | 'ALLOW_CREDIT_NOTES'
  | 'REQUIRE_CREDIT_NOTE_REASON'
  | 'ALLOW_REOPEN_FINALIZED_INVOICE'
  | 'REQUIRE_CANCELLATION_APPROVAL'
  | 'INVOICE_PREFIX'
  | 'CREDIT_NOTE_PREFIX'
  | 'RECEIPT_PREFIX'
  | 'PAYMENT_PREFIX'
  | 'INCLUDE_YEAR'
  | 'INCLUDE_FACILITY_CODE'
  | 'SEQUENCE_LENGTH'
  | 'RESET_FREQUENCY'
  | 'NUMBER_SEPARATOR';

export type BillingConfigurationValueType =
  | 'STRING'
  | 'BOOLEAN'
  | 'INTEGER'
  | 'LONG'
  | 'DECIMAL'
  | 'ENUM'
  | 'DATE'
  | 'DATETIME'
  | 'JSON';

export type BillingConfigurationStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'INACTIVE';

export type BillingConfiguration = {
  id?: number;

  facilityId?: number;

  configurationKey?:
    BillingConfigurationKey;

  valueType?:
    BillingConfigurationValueType;

  configurationValue?: string;

  enumCode?: string | null;

  description?: string | null;

  active?: boolean;

  status?:
    BillingConfigurationStatus;

  createdBy?: string;

  createdDate?: string;

  lastModifiedBy?: string;

  lastModifiedDate?: string;
};

export type SaveBillingConfigurationRequest = {
  facilityId: number;

  configurationKey:
    BillingConfigurationKey;

  valueType:
    BillingConfigurationValueType;

  configurationValue: string;

  enumCode?: string | null;

  description?: string | null;

  active: boolean;

  status:
    BillingConfigurationStatus;
};

export type FinancialDocumentNumbering = {
  id?: number;

  facilityId?: number;

  documentType?: string;

  prefix?: string;

  sequenceLength?: number;

  includeYear?: boolean;

  includeFacilityCode?: boolean;

  numberSeparator?: string;

  resetFrequency?: string;

  startingNumber?: number;

  active?: boolean;

  status?: BillingConfigurationStatus;
};

export type SaveFinancialDocumentNumberingRequest = {
  id?: number | null;

  facilityId: number;

  documentType: string;

  prefix: string;

  sequenceLength: number;

  includeYear: boolean;

  includeFacilityCode: boolean;

  numberSeparator: string;

  resetFrequency: string;

  startingNumber: number;

  active: boolean;

  status: BillingConfigurationStatus;
};

export type FinancialDocumentNumberingBulkRequest = {
  facilityId: number;

  configurations: SaveFinancialDocumentNumberingRequest[];
};

export type FinancialDocumentSequenceStatus = {
  documentType?: string;

  periodKey?: string;

  lastNumber?: number;

  nextNumber?: number;

  sampleDocumentNumber?: string;
};

export type AllocateFinancialDocumentNumberRequest = {
  documentType: string;
  requestId: string;
};

export type AllocatedFinancialDocumentNumber = {
  facilityId: number;
  documentType: string;
  documentNumber: string;
  sequenceNumber: number;
  periodKey?: string;
  requestId: string;
  configurationId?: number;
};

export type TaxType =
  | 'PERCENTAGE'
  | 'FIXED_AMOUNT';

export type TaxCalculationType =
  | 'EXCLUSIVE'
  | 'INCLUSIVE';

export type TaxApplicableOn =
  | 'INVOICE'
  | 'INVOICE_LINE'
  | 'SERVICE'
  | 'PRODUCT';

/*
 * إذا كان Currency موجودًا عندك مسبقًا،
 * لا تعيدي تعريفه.
 */
export type Currency =
  string;

export type Tax = {
  id?: number;

  facilityId?: number;

  code?: string;

  name?: string;

  taxType?: TaxType;

  percentage?: number | null;

  fixedAmount?: number | null;

  currency?: Currency | null;

  calculationType?:
    TaxCalculationType;

  applicableOn?:
    TaxApplicableOn;

  validFrom?: string;

  validTo?: string | null;

  isDefault?: boolean;

  active?: boolean;

  description?: string | null;
};

export type SaveTaxRequest = {
  facilityId: number;

  code: string;

  name: string;

  taxType: TaxType;

  percentage?: number | null;

  fixedAmount?: number | null;

  currency?: Currency | null;

  calculationType:
    TaxCalculationType;

  applicableOn:
    TaxApplicableOn;

  validFrom: string;

  validTo?: string | null;

  isDefault?: boolean;

  active?: boolean;

  description?: string | null;
};

export type DiscountType =
  | 'PERCENTAGE'
  | 'FIXED_AMOUNT';

export type DiscountApplicableOn =
  | 'INVOICE'
  | 'INVOICE_LINE'
  | 'SERVICE'
  | 'PRODUCT';


export type Discount = {
  id?: number;

  facilityId?: number;

  code?: string;

  name?: string;

  discountType?:
    DiscountType;

  percentage?:
    number | null;

  fixedAmount?:
    number | null;

  currency?:
    Currency | null;

  applicableOn?:
    DiscountApplicableOn;

  validFrom?: string;

  validTo?:
    string | null;

  maximumDiscountAmount?:
    number | null;

  minimumInvoiceAmount?:
    number | null;

  requiresReason?:
    boolean;

  requiresApproval?:
    boolean;

  combinable?:
    boolean;

  isDefault?:
    boolean;

  active?:
    boolean;

  description?:
    string | null;
};

export type SaveDiscountRequest = {
  facilityId: number;

  code: string;

  name: string;

  discountType:
    DiscountType;

  percentage?:
    number | null;

  fixedAmount?:
    number | null;

  currency?:
    Currency | null;

  applicableOn:
    DiscountApplicableOn;

  validFrom: string;

  validTo?:
    string | null;

  maximumDiscountAmount?:
    number | null;

  minimumInvoiceAmount?:
    number | null;

  requiresReason?:
    boolean;

  requiresApproval?:
    boolean;

  combinable?:
    boolean;

  isDefault?:
    boolean;

  active?:
    boolean;

  description?:
    string | null;
};
export type BillingWalletStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'BLOCKED'
  | 'CLOSED';

export type BillingChargeStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'PARTIALLY_ALLOCATED'
  | 'FULLY_ALLOCATED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'REVERSED';

export type BillingChargeLineStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'PARTIALLY_ALLOCATED'
  | 'FULLY_ALLOCATED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'REVERSED';

export type BillingResponsibilityStatus =
  | 'CALCULATED'
  | 'PARTIALLY_ALLOCATED'
  | 'FULLY_ALLOCATED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'SUPERSEDED';

export type ResponsiblePartyType =
  | 'PATIENT'
  | 'INSURANCE'
  | 'OTHER_PAYER';

export type ResponsibilityRole =
  | 'PRIMARY'
  | 'SECONDARY'
  | 'TERTIARY'
  | string;

export type BillingLedgerSourceChannel =
  | 'BILLING_ENGINE'
  | 'CASHIER'
  | 'PATIENT_PORTAL'
  | 'INSURANCE'
  | 'API'
  | 'SYSTEM'
  | 'MANUAL';

export type BillingPaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export type BillingPaymentTransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'REVERSED';

export type BillingPaymentTransactionType =
  | 'PAYMENT'
  | 'AUTHORIZATION'
  | 'CAPTURE'
  | 'REFUND'
  | 'VOID'
  | 'REVERSAL';

export type BillingRefundStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'PROCESSING'
  | 'PARTIALLY_COMPLETED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'REVERSED'
  | 'FAILED';

export type BillingRefundSourceType =
  | 'ORIGINAL_PAYMENT'
  | 'AVAILABLE_WALLET'
  | string;

export type BillingCancellationReason =
  | 'SERVICE_DELETED'
  | 'QUANTITY_ZERO'
  | 'ENCOUNTER_CANCELLED'
  | 'SERVICE_CANCELLED'
  | 'ORDER_CANCELLED'
  | 'CLINICAL_DECISION'
  | 'DUPLICATE_ENTRY'
  | 'MANUAL_CANCELLATION';

export type BillingWalletSummary = {
  walletId: number | null;
  creditedAmount: number;
  availableBalance: number;
  reservedBalance: number;
  consumedAmount: number;
  refundedAmount: number;
  currency: Currency | null;
  status: BillingWalletStatus | null;
};

export type BillingResponsibilitySummary = {
  responsibilityId: number;
  responsiblePartyType: ResponsiblePartyType;
  responsibilityRole: ResponsibilityRole;
  payerId: number | null;
  patientInsuranceId: number | null;
  responsibilityAmount: number;
  allocatedAmount: number;
  outstandingAmount: number;
  coveragePercentage: number;
  deductibleAmount: number;
  copayAmount: number;
  coinsuranceAmount: number;
  nonCoveredAmount: number;
  currency: Currency;
  status: BillingResponsibilityStatus;
};

export type EncounterBillingItemSummary = {
  patientServiceProductId: number | null;
  chargeLineId: number;
  billingItemType: string | null;
  sourceId: number | null;
  itemCode: string | null;
  itemName: string | null;
  itemDescription?: string | null;
  serviceSource?: string | null;
  quantity: number;
  unitPrice: number;
  setupUnitPrice?: number | null;
  priceSource?: string | null;
  priceListItemCode?: string | null;
  grossAmount: number;
  discountAmount: number;
  exemptionAmount: number;
  taxAmount: number;
  netAmount: number;
  patientResponsibilityAmount: number;
  insuranceResponsibilityAmount: number;
  otherPayerResponsibilityAmount: number;
  reservedAmount: number;
  allocatedAmount: number;
  outstandingAmount: number;
  exempted: boolean;
  currency: Currency;
  status: BillingChargeLineStatus;
  chargedAt?: string | null;
  responsibilities: BillingResponsibilitySummary[];
};

export type WaseelBenefitDetail = {
  categoryKey?: string | null;
  itemName?: string | null;
  itemCode?: string | null;
  typeDisplay?: string | null;
  typeCode?: string | null;
  value?: string | null;
  unit?: string | null;
};

export type InsuranceBenefitRule = {
  id?: number | null;
  benefitCategory?: string | null;
  itemName?: string | null;
  itemCode?: string | null;
  networkType?: string | null;
  providerType?: string | null;
  term?: string | null;
  unit?: string | null;
  currency?: string | null;
  maximumBenefit?: number | null;
  approvalLimit?: number | null;
  patientCopaymentPercentage?: number | null;
  patientMaximumCopayment?: number | null;
  globalDefault?: boolean | null;
  exceptionsJson?: string | null;
};

export type WaseelCoverageDetails = {
  eligibilityRequestId?: number | null;
  eligibilityResponseId?: string | null;
  patientInsuranceId?: number | null;
  memberId?: string | null;
  policyNumber?: string | null;
  policyHolder?: string | null;
  network?: string | null;
  inforce?: string | null;
  coverageStatus?: string | null;
  copaymentPercent?: number | null;
  copaymentCap?: number | null;
  eligibilityCheckedAt?: string | null;
  benefits?: WaseelBenefitDetail[];
  benefitRules?: InsuranceBenefitRule[];
  policyClassName?: string | null;
  expiryDate?: string | null;
  payerName?: string | null;
  coverageType?: string | null;
  relationWithSubscriber?: string | null;
  planCode?: string | null;
  groupName?: string | null;
  groupNumber?: string | null;
};

export type EncounterBillingSummary = {
  chargeId: number | null;
  chargeNumber: string | null;
  patientId: number;
  encounterId: number;
  chargeDate: string | null;
  currency: Currency | null;
  grossAmount: number;
  discountAmount: number;
  exemptionAmount: number;
  taxAmount: number;
  netAmount: number;
  allocatedAmount: number;
  outstandingAmount: number;
  lineCount: number;
  chargeStatus: BillingChargeStatus | null;
  patientResponsibilityAmount: number;
  patientAllocatedAmount: number;
  patientOutstandingAmount: number;
  patientWalletSettledAmount?: number;
  patientDebitSettledAmount?: number;
  insuranceResponsibilityAmount: number;
  insuranceAllocatedAmount: number;
  insuranceOutstandingAmount: number;
  otherPayerResponsibilityAmount: number;
  otherPayerAllocatedAmount: number;
  otherPayerOutstandingAmount: number;
  wallet: BillingWalletSummary;
  invoiceId?: number | null;
  invoiceNumber?: string | null;
  invoiceTotalAmount?: number;
  invoicePaidAmount?: number;
  invoiceOutstandingAmount?: number;
  items: EncounterBillingItemSummary[];
  coverageType?: string | null;
  patientInsuranceId?: number | null;
};

export type CreateAdvancePaymentRequest = {
  patientId: number;
  encounterId?: number | null;
  facilityId?: number | null;
  paymentCategory: string;
  payerType: string;
  payerId?: number | null;
  amount: number;
  currency: Currency;
  paymentStatus: BillingPaymentStatus;
  transactionType: BillingPaymentTransactionType;
  paymentMethodId: number;
  paymentMethodCode: string;
  transactionStatus: BillingPaymentTransactionStatus;
  receiptNumber?: string | null;
  externalReference?: string | null;
  authorizationCode?: string | null;
  processorReference?: string | null;
  cardLastFour?: string | null;
  bankReference?: string | null;
  cashRegisterId?: number | null;
  notes?: string | null;
  patientServiceProductIds?: number[];
  requestId: string;
};

export type BillingPaymentReservationResult = {
  patientServiceProductId: number;
  reservationId: number | null;
  reservationNumber: string | null;
  itemDescription?: string | null;
  billingItemType?: string | null;
  patientResponsibilityAmount: number;
  reservedAmount: number;
  uncoveredAmount: number;
  fullyCovered: boolean;
};

export type BillingPaymentResult = {
  paymentId: number;
  paymentNumber: string;
  receiptNumber?: string | null;
  paymentTransactionId: number | null;
  paymentTransactionNumber: string | null;
  walletId: number;
  paymentAmount: number;
  walletAvailableBalance: number;
  walletReservedBalance: number;
  walletConsumedAmount: number;
  walletRefundedAmount: number;
  totalReservedAmount: number;
  currency: Currency;
  paymentStatus: BillingPaymentStatus;
  transactionStatus: BillingPaymentTransactionStatus | null;
  reservations: BillingPaymentReservationResult[];
};

export type BillingCheckoutRequest = {
  chargeId: number;
  allowDebit: boolean;
  creditLimit: number;
  debitApprovalRequired: boolean;
  approvedBy?: string | null;
  debitDueDate?: string | null;
  checkoutBy: string;
  requestId: string;
  sourceChannel: BillingLedgerSourceChannel;
};

export type BillingCheckoutLineResult = {
  chargeLineId: number;
  patientServiceProductId: number;
  responsibilityId: number;
  originalResponsibilityAmount: number;
  reservedAllocationAmount: number;
  availableWalletAllocationAmount: number;
  debitAllocationAmount: number;
  finalOutstandingAmount: number;
  settled: boolean;
};

export type BillingCheckoutResult = {
  chargeId: number;
  chargeNumber: string;
  patientId: number;
  encounterId: number;
  netAmount: number;
  reservedAllocatedAmount: number;
  availableWalletAllocatedAmount: number;
  debitCreatedAmount: number;
  patientOutstandingAmount: number;
  insuranceOutstandingAmount: number;
  otherPayerOutstandingAmount: number;
  totalOutstandingAmount: number;
  currency: Currency;
  chargeStatus: BillingChargeStatus;
  patientSettled: boolean;
  financiallyClosed: boolean;
  lines: BillingCheckoutLineResult[];
};

export type BillingCancellationRequest = {
  patientServiceProductId: number;
  cancellationReason: BillingCancellationReason;
  reason: string;
  cancelledBy: string;
  requestId: string;
  sourceChannel: BillingLedgerSourceChannel;
};

export type BillingCancellationResult = {
  patientServiceProductId: number;
  chargeId: number | null;
  chargeLineId: number | null;
  walletAllocationReversedAmount: number;
  debitAllocationReversedAmount: number;
  totalReversedAllocationAmount: number;
  releasedReservationAmount: number;
  walletAvailableBalance: number;
  walletReservedBalance: number;
  walletConsumedAmount: number;
  cancelled: boolean;
};

export type BillingRefundRequest = {
  patientId: number;
  encounterId?: number | null;
  originalPaymentId?: number | null;
  originalPaymentTransactionId?: number | null;
  refundSourceType: BillingRefundSourceType;
  requestedAmount: number;
  refundMethodCode: string;
  refundMethodId: number;
  requestedBy: string;
  reason: string;
  externalReference?: string | null;
  processorReference?: string | null;
  referenceDocumentType?: string | null;
  referenceDocumentId?: number | null;
  referenceDocumentNumber?: string | null;
  notes?: string | null;
  requestId: string;
  sourceChannel: BillingLedgerSourceChannel;
};

export type BillingRefundResult = {
  refundId: number;
  refundNumber: string;
  refundPaymentTransactionId: number | null;
  refundPaymentTransactionNumber: string | null;
  walletId: number;
  originalPaymentId: number | null;
  requestedAmount: number;
  approvedAmount: number;
  refundedAmount: number;
  reversedAmount: number;
  walletAvailableBalance: number;
  walletReservedBalance: number;
  walletConsumedAmount: number;
  walletRefundedAmount: number;
  currency: Currency;
  refundSourceType: BillingRefundSourceType;
  status: BillingRefundStatus;
};

export type BillingRefundReversalRequest = {
  refundId: number;
  amount: number;
  reason: string;
  reversedBy: string;
  requestId: string;
  sourceChannel: BillingLedgerSourceChannel;
};

export type BillingRefundReversalResult = {
  originalRefundId: number;
  reversalRefundId: number;
  reversalRefundNumber: string;
  reversedAmount: number;
  remainingReversibleAmount: number;
  walletAvailableBalance: number;
  walletRefundedAmount: number;
  originalRefundStatus: BillingRefundStatus;
  reversalStatus: BillingRefundStatus;
};

/*
 * Add these types to:
 * src/types/model-types-new.ts
 */

export type BillingCoverageType =
  | 'SELF_PAY'
  | 'INSURANCE';

export type PrepareDefaultServiceItem = {
  serviceId: number;
  quantity: number;
  sequence: number;
  isExempted: boolean;
};

export type PrepareDefaultServicesRequest = {
  patientId: number;
  facilityId: number;
  currency: Currency;
  coverageType: BillingCoverageType;
  patientInsuranceId: number | null;
  items: PrepareDefaultServiceItem[];
  requestId: string;
  payZeroNow?: boolean | null;
  acceptUncoveredAsCash?: boolean | null;
};

export type PreparedDefaultServiceResult = {
  patientServiceProductId: number;
  serviceId: number;
  sequence: number;
  billingResult: BillingOperationResult;
};

export type PrepareDefaultServicesResult = {
  patientId: number;
  encounterId: number;
  facilityId: number;
  coverageType: BillingCoverageType;
  patientInsuranceId: number | null;
  items: PreparedDefaultServiceResult[];
  processed: boolean;
  message: string;
};

export type PreviewDefaultServicesPricingRequest = {
  patientId: number;
  facilityId: number;
  currency: Currency;
  coverageType: BillingCoverageType;
  patientInsuranceId: number | null;
  items: PrepareDefaultServiceItem[];
};

export type PreviewDefaultServicePricingResult = {
  serviceId: number;
  sequence: number;
  setupUnitPrice: number | null;
  unitPrice: number | null;
  grossAmount: number | null;
  discountAmount: number | null;
  taxAmount: number | null;
  netAmount: number | null;
  priceSource: string | null;
  priceListItemCode: string | null;
  patientShareAmount?: number | null;
  insuranceShareAmount?: number | null;
  insuranceVisit?: boolean;
  coveredByInsurance?: boolean;
  requiresCashConfirmation?: boolean;
  notCoveredReason?: string | null;
  cashUnitPrice?: number | null;
};

export type PreviewDefaultServicesPricingResult = {
  patientId: number;
  encounterId: number;
  facilityId: number;
  coverageType: BillingCoverageType;
  patientInsuranceId: number | null;
  currency: Currency;
  grossAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  items: PreviewDefaultServicePricingResult[];
};

export type BillingOperationResult = {
  patientServiceProductId: number;
  chargeId: number | null;
  chargeLineId: number | null;
  pricingSnapshotId: number | null;
  grossAmount: number;
  discountAmount: number;
  exemptionAmount: number;
  taxAmount: number;
  netAmount: number;
  patientResponsibilityAmount: number;
  insuranceResponsibilityAmount: number;
  reservedAmount: number;
  processed: boolean;
  message: string | null;
};

/*
 * Keep your existing billing types below these additions:
 *
 * BillingWalletStatus
 * BillingChargeStatus
 * BillingChargeLineStatus
 * BillingResponsibilityStatus
 * ResponsiblePartyType
 * BillingWalletSummary
 * EncounterBillingItemSummary
 * EncounterBillingSummary
 * CreateAdvancePaymentRequest
 * BillingPaymentResult
 * BillingCheckoutRequest
 * BillingCheckoutResult
 * BillingCancellationRequest
 * BillingCancellationResult
 * BillingRefundRequest
 * BillingRefundResult
 * BillingRefundReversalRequest
 * BillingRefundReversalResult
 */
export type NotificationTemplateChannel = 'EMAIL' | 'IN_APP' | 'SMS' | 'WHATSAPP' | 'PUSH';

export type WhatsAppLanguageCode = string;

export type WhatsAppTemplateCategory = string;

export type WhatsAppHeaderType = string;

export type WhatsAppButtonType = string;

export interface WhatsAppButton {
  type?: WhatsAppButtonType | null;
  text?: string | null;
  url?: string | null;
  phoneNumber?: string | null;
  couponCode?: string | null;
  flowId?: string | null;
}

export interface WhatsAppTemplateParameter {
  parameterName?: string | null;
  exampleValue?: string | null;
}

export type NotificationModule = string;

export type NotificationCategory = string;

export type NotificationPriority = string;

export type RecipientRule =
  | 'PATIENT_EMAIL'
  | 'PATIENT_PHONE'
  | 'PATIENT_USER'
  | 'PRACTITIONER_EMAIL'
  | 'PRACTITIONER_PHONE'
  | 'DATA'
  | 'STATIC'
  | 'PRACTITIONER_USER'
  | 'DEPARTMENT_USERS'
  | 'CURRENT_USER'
  | 'CURRENT_USER_PHONE'
  | 'CREATED_BY_USER'
  | 'CREATED_BY_USER_PHONE';

export interface NotificationHeaderResponseVM {
  id?: number;
  facilityId?: number | null;
  code: string;
  name: string;
  description?: string | null;
  module?: NotificationModule | null;
  category?: NotificationCategory | null;
  priority?: NotificationPriority | null;
  isActive?: boolean;
}

export interface NotificationHeaderCreateDTO {
  facilityId?: number | null;
  code: string;
  name: string;
  description?: string | null;
  module?: NotificationModule | null;
  category?: NotificationCategory | null;
  priority?: NotificationPriority | null;
  isActive?: boolean;
}

export interface NotificationHeaderUpdateDTO {
  facilityId?: number | null;
  code: string;
  name: string;
  description?: string | null;
  module?: NotificationModule | null;
  category?: NotificationCategory | null;
  priority?: NotificationPriority | null;
  isActive?: boolean;
}

export interface NotificationHeaderSearchDTO {
  code?: string | null;
  name?: string | null;
  module?: NotificationModule | null;
  category?: NotificationCategory | null;
  priority?: NotificationPriority | null;
}

export interface NotificationTemplateResponseVM {
  id?: number;
  notificationHeaderId: number;
  channel: NotificationTemplateChannel;
  language: string;
  subject?: string | null;
  title?: string | null;
  body?: string | null;
  toRecipientRule?: string | null;
  ccRecipientRule?: string | null;
  bccRecipientRule?: string | null;
  phoneRecipientRule?: string | null;
  whatsappTemplateName?: string | null;
  whatsappLanguageCode?: WhatsAppLanguageCode | null;
  whatsappParameters?: WhatsAppTemplateParameter[] | null;
  whatsappMetaTemplateId?: string | null;
  whatsappTemplateStatus?: string | null;
  whatsappTemplateCategory?: WhatsAppTemplateCategory | null;
  whatsappTemplateVersion?: number | null;
  whatsappMetaTemplateFooter?: string | null;
  whatsappMetaTemplateButtons?: WhatsAppButton[] | null;
  whatsappHeaderType?: WhatsAppHeaderType | null;
  isActive?: boolean;
}

export interface NotificationTemplateCreateDTO {
  notificationHeaderId: number;
  channel: NotificationTemplateChannel;
  language: string;
  subject?: string | null;
  title?: string | null;
  body?: string | null;
  toRecipientRule?: string | null;
  ccRecipientRule?: string | null;
  bccRecipientRule?: string | null;
  phoneRecipientRule?: string | null;
  whatsappTemplateName?: string | null;
  whatsappLanguageCode?: WhatsAppLanguageCode | null;
  whatsappParameters?: WhatsAppTemplateParameter[] | null;
  whatsappTemplateCategory?: WhatsAppTemplateCategory | null;
  whatsappMetaTemplateFooter?: string | null;
  whatsappMetaTemplateButtons?: WhatsAppButton[] | null;
  whatsappHeaderType?: WhatsAppHeaderType | null;
  isActive?: boolean;
}

export interface NotificationTemplateUpdateDTO {
  notificationHeaderId: number;
  channel: NotificationTemplateChannel;
  language: string;
  subject?: string | null;
  title?: string | null;
  body?: string | null;
  toRecipientRule?: string | null;
  ccRecipientRule?: string | null;
  bccRecipientRule?: string | null;
  phoneRecipientRule?: string | null;
  whatsappTemplateName?: string | null;
  whatsappLanguageCode?: WhatsAppLanguageCode | null;
  whatsappParameters?: WhatsAppTemplateParameter[] | null;
  whatsappTemplateCategory?: WhatsAppTemplateCategory | null;
  whatsappMetaTemplateFooter?: string | null;
  whatsappMetaTemplateButtons?: WhatsAppButton[] | null;
  whatsappHeaderType?: WhatsAppHeaderType | null;
}

export type NotificationChannel = NotificationTemplateChannel;

export type NotificationStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'
  | 'CANCELLED';

export interface NotificationResponseVM {
  id?: number;
  facilityId?: number | null;
  notificationHeaderId?: number | null;
  notificationTemplateId?: number | null;
  code?: string | null;
  channel?: NotificationChannel | null;
  language?: string | null;
  status?: NotificationStatus | null;
  priority?: NotificationPriority | null;
  recipientType?: string | null;
  recipientId?: number | null;
  recipientName?: string | null;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  toEmails?: string[] | null;
  ccEmails?: string[] | null;
  bccEmails?: string[] | null;
  toPhone?: string | null;
  subject?: string | null;
  title?: string | null;
  body?: string | null;
  dataJson?: Record<string, unknown> | null;
  recipientJson?: Record<string, unknown> | null;
  resolvedRecipientsJson?: Record<string, unknown> | null;
  channelPayload?: Record<string, unknown> | null;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
  providerName?: string | null;
  providerMessageId?: string | null;
  providerStatus?: string | null;
  providerResponse?: Record<string, unknown> | null;
  errorMessage?: string | null;
  retryCount?: number | null;
  maxRetryCount?: number | null;
  nextRetryDate?: string | Date | null;
  sentDate?: string | Date | null;
  deliveredDate?: string | Date | null;
  readDate?: string | Date | null;
  failedDate?: string | Date | null;
}

export interface NotificationSearchDTO {
  code?: string | null;
  status?: NotificationStatus | null;
  priority?: NotificationPriority | null;
  language?: string | null;
  recipientType?: string | null;
  recipientId?: number | null;
  recipientName?: string | null;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  toPhone?: string | null;
  providerName?: string | null;
  providerMessageId?: string | null;
  providerStatus?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
  dateFrom?: string | Date | null;
  dateTo?: string | Date | null;
}

export type NotificationEventType =
  | 'CREATED'
  | 'PROCESSING'
  | 'SENT_TO_PROVIDER'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'
  | 'RETRY'
  | 'CANCELLED'
  | 'WEBHOOK_STATUS_UPDATE';

export interface NotificationEventResponseVM {
  id?: number;
  notificationId?: number | null;
  eventType?: NotificationEventType | null;
  oldStatus?: NotificationStatus | null;
  newStatus?: NotificationStatus | null;
  providerName?: string | null;
  providerMessageId?: string | null;
  providerStatus?: string | null;
  message?: string | null;
  errorMessage?: string | null;
  eventPayload?: Record<string, unknown> | null;
  createdDate?: string | Date | null;
}

export type ClaimStatus =
  | 'DRAFT'
  | 'SUBMITTING'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'FAILED';

export interface ClaimTrackingItemResponse {
  id?: number | null;
  sequence?: number | null;
  patientServiceProductId?: number | null;
  financialDocumentItemId?: number | null;
  billingChargeLineId?: number | null;
  itemType?: string | null;
  itemCode?: string | null;
  itemDescription?: string | null;
  invoiceNo?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  net?: number | null;
  patientShare?: number | null;
  payerShare?: number | null;
}

export interface ClaimValidationError {
  code?: string | null;
  message?: string | null;
  section?: string | null;
}

export interface ClaimTrackingResponse {
  id?: number | null;
  patientId?: number | null;
  encounterId?: number | null;
  financialDocumentId?: number | null;
  preAuthorizationId?: number | null;
  patientInsuranceId?: number | null;
  claimType?: string | null;
  claimSubType?: string | null;
  uploadName?: string | null;
  uploadId?: number | null;
  provClaimNo?: string | null;
  claimReference?: string | null;
  preAuthRefNo?: string | null;
  approvalResponseId?: number | null;
  totalNet?: number | null;
  status?: ClaimStatus | string | null;
  outcome?: string | null;
  message?: string | null;
  submittedAt?: string | Date | null;
  createdDate?: string | Date | null;
  createdBy?: string | null;
  lastModifiedDate?: string | Date | null;
  lastModifiedBy?: string | null;
  canResubmit?: boolean | null;
  canRefreshUpload?: boolean | null;
  items?: ClaimTrackingItemResponse[] | null;
  validationErrors?: ClaimValidationError[] | null;
  statusDescription?: string | null;
}

export interface ClaimSubmissionResponse {
  id?: number | null;
  encounterId?: number | null;
  financialDocumentId?: number | null;
  preAuthorizationId?: number | null;
  claimType?: string | null;
  claimSubType?: string | null;
  uploadName?: string | null;
  uploadId?: number | null;
  provClaimNo?: string | null;
  claimReference?: string | null;
  preAuthRefNo?: string | null;
  totalNet?: number | null;
  status?: ClaimStatus | string | null;
  outcome?: string | null;
  message?: string | null;
  submittedAt?: string | Date | null;
}

export interface PendingClaimInvoiceResponse {
  financialDocumentId?: number | null;
  documentNumber?: string | null;
  encounterId?: number | null;
  encounter?: PatientEncounter | null;
  encounterType?: string | null;
  patientId?: number | null;
  patient?: Patient | null;
  payorId?: number | null;
  claimReference?: string | null;
  totalAmount?: number | null;
  currency?: string | null;
  createdDate?: string | Date | null;
  claimType?: string | null;
  claimSubType?: string | null;
  matchingItemCount?: number | null;
  matchingNetAmount?: number | null;
}

export interface ClaimBatchSubmitResponse {
  uploadName?: string | null;
  uploadId?: number | null;
  outcome?: string | null;
  message?: string | null;
  submittedClaimCount?: number | null;
  claims?: ClaimSubmissionResponse[] | null;
}

export interface WaseelClaimUploadResponse {
  transcationLogId?: number | null;
  message?: string | null;
  uploadId?: number | null;
  providerId?: number | null;
  uploadName?: string | null;
  uploadDate?: string | null;
  noOfNotUploadedClaims?: number | null;
  noOfUploadedClaims?: number | null;
  totalAmtOfUploadedClaims?: number | null;
  noOfAcceptedClaims?: number | null;
  totalAmtOfAcceptedClaims?: number | null;
  noOfNotAcceptedClaims?: number | null;
  totalAmtOfNotAcceptedClaims?: number | null;
  lastModifiedDate?: string | null;
  ratioOfAccepted?: number | null;
  ratioOfNotAccepted?: number | null;
}

export interface ClaimSettlementRowResponse {
  claimId?: number | null;
  settlementNo?: string | null;
  settlementDate?: string | null;
  insuranceCompany?: string | null;
  tpa?: string | null;
  claimNo?: string | null;
  claimDate?: string | null;
  billedAmount?: number | null;
  approvedAmount?: number | null;
  rejectedAmount?: number | null;
  patientShare?: number | null;
  insuranceAmount?: number | null;
  paidAmount?: number | null;
  outstandingAmount?: number | null;
  settlementStatus?: string | null;
  patientId?: number | null;
  patientName?: string | null;
  medicalRecordNumber?: string | null;
  sexAtBirth?: string | null;
  dateOfBirth?: string | null;
  invoiceNumber?: string | null;
  visitNumber?: string | null;
  visitType?: string | null;
}

export interface InsurancePayerReceivablesSummaryResponse {
  payerId?: number | null;
  payerName?: string | null;
  currency?: string | null;
  totalBilled?: number | null;
  totalReceived?: number | null;
  outstandingBalance?: number | null;
  pendingClaims?: number | null;
  paidClaims?: number | null;
  partiallyPaidClaims?: number | null;
  rejectedClaims?: number | null;
  cancelledClaims?: number | null;
  overallStatus?: string | null;
}

export interface PatientEncounterFieldAudit {
  id: number;
  patientEncounter: PatientEncounter;
  fieldName: string;
  operationType: string;
  oldValue: string | null;
  newValue: string | null;
  logDate: string;
  logBy: string | null;
}

export interface EncounterAssessmentLog {
  id: number;
  encounterAssessment: EncounterAssessment;
  fieldName: string;
  operationType: string;
  oldValue: string | null;
  newValue: string | null;
  logDate: string;
  logBy: string | null;
}

export interface EncounterPlanFieldAudit {
  id: number;
  encounterPlanId: number;
  fieldName: string;
  operationType: string;
  oldValue?: string | null;
  newValue?: string | null;
  logDate: string;
  logBy: string;
}

export interface FLACCPainScale {
  id: number;

  patientId: number;
  encounterId: number;

  face: string;
  legs: string;
  activity: string;
  cry: string;
  consolability: string;

  totalScore: number;
  status: string;

  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;

  createdBy: string;
  createdDate: string;

  lastModifiedBy?: string;
  lastModifiedDate?: string;
  painLevel?: string;
}

export interface FLACCPainScaleCreateDTO {
  patientId: number;
  encounterId: number;

  face: string;
  legs: string;
  activity: string;
  cry: string;
  consolability: string;
}

export interface FLACCPainScaleUpdateDTO {
  id: number;

  patientId: number;
  encounterId: number;

  face: string;
  legs: string;
  activity: string;
  cry: string;
  consolability: string;
}