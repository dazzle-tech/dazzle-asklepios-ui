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
}


export interface Candidate {
  id?: number;
  role?: string;
  dob?: boolean;
  lastName?: boolean;
  documentNo?: boolean;
  mobileNumber?: boolean;
  gender?: boolean;
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
  createdBy?: string;
  createdDate?: Date | null;
  lastModifiedBy?: string;
  lastModifiedDate?: Date | null;
};

export interface Language {
  id: number;
  langKey: string;
  langName: string;
  direction: 'LTR' | 'RTL';
  details?: string | null;
}

export interface LanguageTranslation {
  id: number;
  langKey: string;
  translationKey: string;
  originalText: string;
  translationText?: string;
  verified: boolean;
  translated: boolean;
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
  createdBy: string;
  createdDate: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  spaceKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  type?: string;
  details?: string;
  source?: string;
}
// Response Types
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

// Request Types
export interface UploadAttachmentParams {
  patientId: number;
  files: File[];
  type?: string;
  details?: string;
  source?: string;
}

