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
  jobRole: null,
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
  hasMedicalSheets:false,
 hasNurseMedicalSheets:false
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
  ruleId:null,

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

export const newUploadAttachmentParams: modelTypes.UploadPatientAttachmentParams = {
  patientId: undefined,
  file: undefined,
  type: undefined,
  details: undefined,
  source: undefined,
}

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
  sourceId: undefined,
};

export const newUploadEncounterAttachmentParams: modelTypes.UploadEncounterAttachmentParams = {
  encounterId: undefined,
  file: undefined,
  type: undefined,
  details: undefined,
  source: undefined,
  sourceId: undefined,
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
  appointable: false,
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
};


// default empty object
export const newDiagnosticTestProfile: modelTypes.DiagnosticTestProfile = {
  id: undefined,
  testId: undefined,
  name: '',
  resultUnit: ''}


export const newPathology: modelTypes.Pathology = {
  id: undefined,
  testId: undefined,
  category: "",
  specimenType: "",
  analysisProcedure: "",
  turnaroundTime: undefined,
  timeUnit: "",
  testDescription: "",
  sampleHandling: "",
  medicalIndications: "",
  criticalValues: "",
  preparationRequirements: "",
};

export const newRadiology: modelTypes.Radiology = {
  id: undefined,
  testId: 0,
  category: "",
  imageDuration: null,
  testInstructions: "",
  medicalIndications: "",
  turnaroundTimeUnit: "",
  turnaroundTime: undefined,
  associatedRisks: "",
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

  resultType: "", 
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

  lovKeys: [],
};