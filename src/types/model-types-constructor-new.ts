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
  role: '',
  dob: false,
  lastName: false,
  documentNo: false,
  mobileNumber: false,
  gender: false,
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
  isActive: true,
  createdBy: '',
  createdDate: undefined,
  lastModifiedBy: undefined,
  lastModifiedDate: undefined,
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
