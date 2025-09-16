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
  genderLkey?: number | null;
  jobRoleLkey?: number | null;
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



