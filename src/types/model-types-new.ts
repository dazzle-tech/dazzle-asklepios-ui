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
  hasMedicalSheets:boolean;
   hasNurseMedicalSheets:boolean
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
  type: string ;
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
  facilityId?: number;          // FK
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
  facilityId?: number;          // FK
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
  timing?:String;
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

  lovKeys?: string[];
}


export interface ProcedureCoding {
  id?: number;
  procedureId?: number | null;        
  codeType: string | null ;         
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
