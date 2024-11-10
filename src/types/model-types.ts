export interface ApAccessRole { 
	key:string;
	name:string;
	description:string;
	accessLevel:number;
	passwordErrorRetires:number;
	passwordExpires:boolean;
	passwordExpiresAfterDays:number;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApAccessRoleAuthorization { 
	key:string;
	accessRoleKey:string;
	authorizationType:string;
	authorizationObjectKey:string;
	authorizationLevel:number;
	accessLevel:number;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApAccessRoleScreen { 
	key:string;
	accessRoleKey:string;
	screenKey:string;
	canRead:boolean;
	canWrite:boolean;
	canDelete:boolean;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApAccessToken { 
	key:string;
	userKey:string;
	canExpire:boolean;
	expiresAt:number;
	accessToken:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApActiveIngredient { 
	key:string;
	code:string;
	name:string;
	hasSalt:boolean;
	saltLkey:string;
	medicalCategoryLkey:string;
	isControlled:boolean;
	controlledLkey:string;
	hasSynonyms:boolean;
	chemicalFormula:string;
	drugTypeLkey:string;
	drugClassLkey:string;
	hasBlackBoxWarning:boolean;
	blackBoxWarning:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
	mechanismOfAction:string;
	toxicityMaximumDose:string;
	toxicityMaximumDosePerUnitLkey:string;
	toxicityDetails:string;
	pregnancyCategoryLkey:string;
	pregnancyNotes:string;
	lactationRiskLkey:string;
	lactationRiskNotes:string;
	doseAdjustmentRenal:boolean;
	doseAdjustmentHepatic:boolean;
	pharmaAbsorption:string;
	pharmaRouteOfElimination:string;
	pharmaVolumeOfDistribution:string;
	pharmaHalfLife:string;
	pharmaProteinBinding:string;
	pharmaClearance:string;
	pharmaMetabolism:string;
	doseAdjPugA:string;
	doseAdjPugB:string;
	doseAdjPugC:string;
	doseAdjRenalOne:string;
	doseAdjRenalTwo:string;
	doseAdjRenalThree:string;
	doseAdjRenalFour:string;
} 

export interface ApActiveIngredientAdverseEffect { 
	key:string;
	activeIngredientKey:string;
	adverseEffectLkey:string;
	isOther:boolean;
	otherDescription:string;
	typeLkey:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApActiveIngredientContraindication { 
	key:string;
	activeIngredientKey:string;
	contraindication:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApActiveIngredientDrugInteraction { 
	key:string;
	activeIngredientKey:string;
	interactedActiveIngredientKey:string;
	severityLkey:string;
	description:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApActiveIngredientFoodInteraction { 
	key:string;
	activeIngredientKey:string;
	foodDescription:string;
	severityLkey:string;
	description:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApActiveIngredientIndication { 
	key:string;
	activeIngredientKey:string;
	indication:string;
	isOffLabel:boolean;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApActiveIngredientRecommendedDosage { 
	key:string;
	activeIngredientKey:string;
	indicationLkey:string;
	variableLkey:string;
	dosage:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApActiveIngredientSpecialPopulation { 
	key:string;
	activeIngredientKey:string;
	additionalPopulationLkey:string;
	considerations:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApActiveIngredientSynonym { 
	key:string;
	activeIngredientKey:string;
	synonym:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApAddresses { 
	key:string;
	entityId:string;
	entityTypeLkey:string;
	addressTypeLkey:string;
	streetAddressLine1:string;
	streetAddressLine2:string;
	countryLkey:string;
	stateProvinceRegionLkey:string;
	cityLkey:string;
	postalCode:string;
	additionalInfo:string;
	latitude:string;
	longitude:string;
	isActive:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApAgeGroup { 
	key:string;
	ageGroupLkey:string;
	fromAge:number;
	toAge:number;
	fromAgeUnitLkey:string;
	toAgeUnitLkey:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApAllergens { 
	key:string;
	allergenCode:string;
	allergenName:string;
	allergenTypeLkey:string;
	description:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApAttachment { 
	key:string;
	attachmentType:string;
	referenceObjectKey:string;
	extraDetails:string;
	fileName:string;
	contentType:string;
	fileContent:uint8array;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
	details:string;
	accessTypeLkey:string;
} 

export interface ApCatalogDiagnosticTest { 
	key:string;
	testKey:string;
	catalogKey:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApCdt { 
	key:string;
	typeLkey:string;
	cdtCode:string;
	description:string;
	classLkey:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApCdtDentalAction { 
	key:string;
	dentalActionKey:string;
	cdtKey:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApClinicalDocumentation { 
	key:string;
	patientKey:string;
	encounterKey:string;
	docTypeLkey:string;
	docCategoryLkey:string;
	docContent:string;
	userKey:string;
	userRoleLkey:string;
	facilityKey:string;
	docStatusLkey:string;
	docFormTypeKey:string;
	docFormKey:string;
	createdDatetime:Date;
	approvedDatetime:Date;
	approvedByUserKey:string;
	approvedByUserRoleLkey:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApDentalAction { 
	key:string;
	description:string;
	type:string;
	imageName:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
	favorite:boolean;
} 

export interface ApDentalChart { 
	key:string;
	encounterKey:string;
	patientKey:string;
	chartDate:Date;
	type:string;
	chartSequence:number;
	status:string;
	treatmentPlan:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApDentalChartProgressNote { 
	key:string;
	chartKey:string;
	note:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApDentalChartTooth { 
	key:string;
	chartKey:string;
	toothNumber:string;
	missing:boolean;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
	toothNumberNumeric:number;
} 

export interface ApDentalPlannedTreatment { 
	key:string;
	patientKey:string;
	encounterKey:string;
	type:string;
	visitNumber:number;
	cdtKey:string;
	toothKey:string;
	note:string;
	surfaceLkey:string;
	billingTypeLkey:string;
	fees:number;
	insurance:number;
	discount:number;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
	statusLkey:string;
	source:string;
	sourceKey:string;
} 

export interface ApDepartment { 
	key:string;
	facilityKey:string;
	name:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
	departmentTypeLkey:string;
	appointable:boolean;
	hasTriage:boolean;
	departmentCode:string;
} 

export interface ApDiagnosticTest { 
	key:string;
	testTypeLkey:string;
	testName:string;
	internalCode:string;
	internationalCodeOne:string;
	internationalCodeTwo:string;
	internationalCodeThree:string;
	ageSpecific:boolean;
	genderSpecific:boolean;
	genderLkey:string;
	specialPopulation:boolean;
	price:number;
	currencyLkey:string;
	specialNotes:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApDiagnosticTestAgeType { 
	key:string;
	testKey:string;
	ageFrom:number;
	ageTo:number;
	ageTypeLkey:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApDiagnosticTestCatalogHeader { 
	key:string;
	description:string;
	typeLkey:string;
	departmentKey:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
	testKey:string;
	catalogKey:string;
} 

export interface ApDiagnosticTestEyeExam { 
	key:string;
	testKey:string;
	eyeExamCategoryLkey:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApDiagnosticTestGenetics { 
	key:string;
	testKey:string;
	internationalCodingTypeLkey:string;
	childCodeLkey:string;
	pathologyCategoryLkey:string;
	specimenTypeLkey:string;
	methodologyLkey:string;
	turnaroundTime:string;
	timeUnitLkey:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApDiagnosticTestPathology { 
	key:string;
	testKey:string;
	internationalCodingTypeLkey:string;
	childCodeLkey:string;
	pathologyCategoryLkey:string;
	specimenTypeLkey:string;
	analysisProcedureLkey:string;
	turnaroundTime:string;
	timeUnitLkey:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApDiagnosticTestRadiology { 
	key:string;
	testKey:string;
	internationalCodingTypeLkey:string;
	childCodeLkey:string;
	radCategoryLkey:string;
	imageDuration:string;
	timeUnitLkey:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
	labCatalogLkey:string;
	propertyLkey:string;
	systemLkey:string;
	scaleLkey:string;
	reagentsLkey:string;
	methodLkey:string;
	timingLkey:string;
	resultType:string;
	resultUnitLkey:string;
} 

export interface ApDiagnosticTestSpecialPopulation { 
	key:string;
	testKey:string;
	specialPopulationLkey:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApDvmRule { 
	key:string;
	screenMetadataKey:string;
	ruleDescription:string;
	fieldKey:string;
	fieldName:string;
	fieldDataType:string;
	isFieldLov:boolean;
	isFieldRef:boolean;
	ruleType:string;
	ruleValue:string;
	ruleValueTwo:string;
	isDependant:boolean;
	dependantRuleCheck:string;
	dependantRuleKey:string;
	validationType:string;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

export interface ApEncounter { 
	key:string;
	patientKey:string;
	patientFullName:string;
	patientAge:string;
	encounterStatusLkey:string;
	encounterClassLkey:string;
	encounterPriorityLkey:string;
	encounterTypeLkey:string;
	serviceTypeLkey:string;
	patientStatusLkey:string;
	episodeCareKey:string;
	basedOnLkey:string;
	basedOnKey:string;
	partOfEncounterKey:string;
	attendingPhysicianKey:string;
	responsiblePhysicianKey:string;
	facilityKey:string;
	appointmentKey:string;
	virtualService:boolean;
	plannedStartDate:Date;
	plannedEndDate:Date;
	actualStartDate:Date;
	actualEndDate:Date;
	actualLengthHrs:number;
	reasonLkey:string;
	primaryDiagnoseKey:string;
	dietPreferenceLkey:string;
	dietPreferenceText:string;
	valuableItemsText:string;
	specialArrangementLkey:string;
	specialArrangementText:string;
	specialCourtesyLkey:string;
	admissionOrigin:string;
	admissionSource:string;
	readmission:boolean;
	dischargeDestination:string;
	dischargeDisposition:string;
	locationTypeLkey:string;
	locationKey:string;
	followUpEncounterKey:string;
	queueNumber:number;
	billingAccountKey:string;
	paymentTypeLkey:string;
	payerTypeLkey:string;
	payerKey:string;
	insurancePlan:string;
	payerMemberId:string;
	referralNumber:string;
	accessLevel:number;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
	departmentKey:string;
	dischargeTypeLkey:string;
	actualLengthMinutes:number;
	chiefComplaint:string;
	hpiSummery:string;
	hpiKey:string;
	pastMedicalHistorySummery:string;
	pastMedicalHistoryKey:string;
	rosSummery:string;
	rosKey:string;
	assessmentSummery:string;
	assessmentKey:string;
	physicalExamSummery:string;
	physicalExamSummeryKey:string;
	progressNote:string;
	dischargeNote:string;
	dischargeSummery:string;
	visitId:string;
	encounterNotes:string;
	sourceName:string;
} 

export interface ApEncounterAppliedService { 
	key:string;
	encounterKey:string;
	serviceKey:string;
	categoryLkey:string;
	source:string;
	sourceKey:string;
	extraDetails:string;
	price:number;
	createdBy:string;
	updatedBy:string;
	deletedBy:string;
	createdAt:number;
	updatedAt:number;
	deletedAt:number;
	isValid:boolean;
} 

