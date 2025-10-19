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
  code?:string;
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
  code?:string;
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
export interface UserRole { 
	roleId?:string;
  userId?:string;
}
export interface UserDepartment {
  id?:number;
  userId: number;
  facilityId?: string | null;
  departmentId: number;
  isActive?: boolean;
  createdBy?: string;
  createdDate?:Date|null;
  lastModifiedBy?: string;
  lastModifiedDate?:Date|null;
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



