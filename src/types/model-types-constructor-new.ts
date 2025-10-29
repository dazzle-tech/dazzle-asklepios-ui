import { tr } from "date-fns/locale";
import * as modelTypes from "./model-types-new";
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
};

export const newCandidate: modelTypes.Candidate = {
  id: undefined,
  rule: '',
  fields: {}, 
  isActive: true,
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
}

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
  ruleId:undefined,

} 

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
}

export const newRole: modelTypes.Role = {
  id: undefined,
  name: '',
  type: '',
  facilityId: null,
}
export const newUserRole: modelTypes.UserRole = {
  roleId: undefined,
  userId: undefined,
}
export const newUserDepartment: modelTypes.UserDepartment = {
  id: undefined,
  userId: undefined,
  departmentId: undefined,
  isActive: true
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
  source: undefined,
};

export const newUploadResponse: modelTypes.UploadResponse = {
  id: undefined,
  filename: '',
  mimeType: '',
  sizeBytes: 0,
  downloadUrl: '',
};

export const newDownloadTicket: modelTypes.DownloadTicket = {
  url: '',
  expiresInSeconds: 0,
};

export const newUploadAttachmentParams: modelTypes.UploadAttachmentParams = {
  patientId: undefined,
  files: [],
  type: undefined,
  details: undefined,
  source: undefined,
}
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
  facilityId: undefined, 

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
  isActive: true,
};
export const newLanguage: modelTypes.Language = {
  id: undefined,
  langKey: undefined,
  langName: undefined,
  direction: undefined,
  details: undefined,
}

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
  jobRole: '',
  gender: '',
  isActive: true,
};

export const newLanguageTranslation: modelTypes.LanguageTranslation = {
  id: undefined,
  langKey: undefined,          
  translationKey: undefined,   
  originalText: undefined,     
  translationText: undefined,
  verified: undefined,
  translated: undefined,
}
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
  facilityId: undefined,
};
export const newAllergen: modelTypes.Allergen = {
  id: undefined,
  code: '',
  name: '',
  type: null,           
  description: '',
  isActive: true,
  createdBy: '',
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null,
};

export const newDiagnosticTest: modelTypes.DiagnosticTest = {
  id: undefined,
  type: '',
  name: '',
  internalCode: '',           
  ageSpecific: false,            
  genderSpecific: false,        
  gender: '',                 
  specialPopulation: false,     
  price: null,                    
  currency: '',               
  specialNotes: '',         
  isActive: true,  
  isProfile: false,             
  appointable: false,           
  createdDate: null,            
  createdBy: '',               
  lastModifiedBy: '',          
  lastModifiedDate: null,  
}
