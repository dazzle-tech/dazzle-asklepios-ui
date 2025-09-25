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
	id?:string;
	name?:string;
	emailAddress?:string;
	phone1?:string;
	phone2?:string;
	fax?:string;
	addressId?:string;
	type:string;
	defaultCurrency:string;
  isActive?: boolean;
} 

export interface CreateFacility { 
	name?:string;
	emailAddress?:string;
	phone1?:string;
	phone2?:string;
	fax?:string;
	addressId?:string;
	type:string;
	defaultCurrency:string;
  isActive?: boolean;
} 



export interface Role { 
	id?:string;
	name?:string;
	type?:string;
	facilityId?:string;
} 
