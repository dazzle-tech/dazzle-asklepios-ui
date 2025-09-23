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
export const newDepartment:modelTypes.Department = { 
  id:undefined,
  facilityId:undefined,
  name:'',
  createdBy:'',
  createdDate:undefined,
  lastModifiedBy:undefined,
  lastModifiedDate:undefined,
  departmentType:undefined,
  appointable:undefined,
  departmentCode:'',
  phoneNumber:'',
  email:'',
  encounterType:undefined,
  isActive:true,
}

export const newFacility:modelTypes.Facility = { 
  id:undefined,
  name:'',
	emailAddress:'',
	phone1:'',
	phone2:'',
	fax:'',
	addressId:'',
	type:'',
	defaultCurrency:'',
  isActive: true,
} 

export const newCreateFacility:modelTypes.CreateFacility = { 
  name:'',
	emailAddress:'',
	phone1:'',
	phone2:'',
	fax:'',
	addressId:'',
	type:'',
	defaultCurrency:'',
  isActive: true,
} 

export const newRole:modelTypes.Role = { 
	id:undefined,
	name:'',
	type:'',
	facilityId: null,
} 

export const newUserRole:modelTypes.UserRole = { 
  roleId:undefined,
  userId:undefined,
}













