import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest, ListRequestAllValues } from '@/types/types';
import { fromListRequestToQueryParams,fromListRequestAllValueToQueryParams } from '@/utils';
import {
  ApAccessRole,
  ApAccessRoleScreen,
  ApAllergens,
  ApCatalogDiagnosticTest,
  ApCdt,
  ApCdtDentalAction,
  ApDentalAction,
  ApDepartment,
  ApDiagnosticTest,
  ApDiagnosticTestGenetics,
  ApDiagnosticTestLaboratory,
  ApDiagnosticTestNormalRange,
  ApDiagnosticTestRadiology,
  ApDiagnosticTestSpecialPopulation,
  ApDuplicationCandidateSetup,
  ApFacility,
  ApLov,
  ApLovValues,
  ApModule,
  ApPractitioner,
  ApProcedureCoding,
  ApProcedurePriceList,
  ApProcedureSetup,
  ApScreen,
  ApService,
  ApServiceCdt,
  ApUser,
  ApUserFacilitiyDepartments,
  ApUserMedicalLicense,
  ApVaccine,
  ApVaccineBrands,
  ApVaccineDose,
  ApVaccineDosesInterval

} from '@/types/model-types';

export const setupService = createApi({
  reducerPath: 'setupApi',
  baseQuery: baseQuery,
  endpoints: builder => ({
    getLicense: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/user-midical-license-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveUserMidicalLicense: builder.mutation({
      query: (userMedicalLicense: ApUserMedicalLicense) => ({
        url: `/setup/save-user-midical-license`,
        method: 'POST',
        body: userMedicalLicense
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    removeUserMidicalLicense: builder.mutation({
      query: (userMedicalLicense: ApUserMedicalLicense) => ({
        url: `/setup/remove-user-midical-license`,
        method: 'POST',
        body: userMedicalLicense,
      }),
    }),
    getFacilities: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/facility-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveFacility: builder.mutation({
      query: (facility: ApFacility) => ({
        url: `/setup/save-facility`,
        method: 'POST',
        body: facility
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    saveFacilityDepartment: builder.mutation({
      query: (facilityDepartment: ApUserFacilitiyDepartments) => ({
        url: `/setup/save-facility-department`,
        method: 'POST',
        body: facilityDepartment
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    removeFacility: builder.mutation<void, ApFacility>({
      query: (facility: ApFacility) => ({
        url: `/setup/remove-facility`,
        method: 'POST',
        body: facility,
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
    }),
    getAccessRoles: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/access-role-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveAccessRole: builder.mutation({
      query: (facility: ApFacility) => ({
        url: `/setup/save-access-role`,
        method: 'POST',
        body: facility
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    saveDiagnosticsTestSpecialPopulation: builder.mutation<void, { queryParams: { diagnosticTestId: string }, body: ApDiagnosticTestSpecialPopulation }>({
      query: ({ queryParams, body }) => ({
        url: '/setup/save-diagnostic-test-special-population',
        method: 'POST',
        params: queryParams,
        body: body,
      }), onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getLovs: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/lov-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveLov: builder.mutation({
      query: (lov: ApLov) => ({
        url: `/setup/save-lov`,
        method: 'POST',
        body: lov
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getLovValues: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/lov-value-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 0
    }),
    saveLovValue: builder.mutation({
      query: (lovValue: ApLovValues) => ({
        url: `/setup/save-lov-value`,
        method: 'POST',
        body: lovValue
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    removeUser: builder.mutation({
      query: ({ user }) => ({
        url: `/setup/remove-user`,
        method: 'POST',
        body: user,
      }),
    }),
    deactivateUser: builder.mutation({
      query: ({ user }) => ({
        url: `/setup/deactivate-activate-user`,
        method: 'POST',
        body: user,
      }),
    }),
    getUsers: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/user-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),

    getUserRecord: builder.query({
      query: (data: { userId: string }) => ({
        url: `/setup/get-user-record`,
        headers: {
          userId: data.userId, 
        },
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    
    saveUser: builder.mutation({
      query: (user: ApUser) => ({
        url: `/setup/save-user`,
        method: 'POST',
        body: user
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    resetUserPassword: builder.mutation({
      query: (user: ApUser) => ({
        url: `/setup/user-password-reset`,
        method: 'POST',
        body: user,

      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
    }),
    getModules: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/module-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    getUomGroups: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/uom-groups-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    removeUomGroup: builder.mutation({
      query: ({ uomGroup, facilityId, accessToken, accessLevel, lang }) => ({
        url: `/setup/remove-uom-groups`,
        method: 'POST',
        body: uomGroup,
      }),
      onQueryStarted: onQueryStarted,
    }),
    saveModule: builder.mutation({
      query: (module: ApModule) => ({
        url: `/setup/save-module`,
        method: 'POST',
        body: module
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    saveUomGroup: builder.mutation({
      query: (uomGroups: ApUomGroups) => ({
        url: `/setup/save-uom-groups`,
        method: 'POST',
        body: uomGroups
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getScreens: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/screen-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveScreen: builder.mutation({
      query: (screen: ApScreen) => ({
        url: `/setup/save-screen`,
        method: 'POST',
        body: screen
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getScreenAccessMatrix: builder.query({
      query: (accessRole: ApAccessRole) => ({
        url: `/setup/screen-access-matrix?accessRoleKey=${accessRole.key}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveScreenAccessMatrix: builder.mutation({
      query: (records: ApAccessRoleScreen[]) => ({
        url: `/setup/save-screen-access-matrix`,
        method: 'POST',
        body: records
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getLovAllValues: builder.query({
      query: (listRequest: ListRequestAllValues) => ({
        url: `/utility/get-lov-all-values?${fromListRequestAllValueToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    getLovValuesByCode: builder.query({
      query: (code: String) => ({
        url: `/utility/get-lov-values-by-code?code=${code}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 900 // 15 minutes
    }),
    getLovValuesByCodeAndParent: builder.query({
      query: input => ({
        url: `/utility/get-lov-values-by-code?code=${input.code}&parentValueKey=${input.parentValueKey}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 900 // 15 minutes
    }),
    getMetadata: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/dvm/metadata-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    getMetadataFields: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/dvm/metadata-fields-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    getPractitioners: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/practitioner-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    savePractitioner: builder.mutation({
      query: (practitioner: ApPractitioner) => ({
        url: `/setup/save-practitioner`,
        method: 'POST',
        body: practitioner
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getDepartments: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/department-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    getUserDepartments: builder.query({
      query: (key) => {
        return { url: `/setup/user-departments?key=${key}` };
      },
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveDepartment: builder.mutation({
      query: (department: ApDepartment) => ({
        url: `/setup/save-department`,
        method: 'POST',
        body: department
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getAllergens: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/allergens-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveAllergens: builder.mutation({
      query: (allergens: ApAllergens) => ({
        url: `/setup/save-allergens`,
        method: 'POST',
        body: allergens
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getDentalActions: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/dental-action-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveDentalAction: builder.mutation({
      query: (dentalAction: ApDentalAction) => ({
        url: `/setup/save-dental-action`,
        method: 'POST',
        body: dentalAction
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    linkCdtAction: builder.mutation({
      query: (cdtDentalAction: ApCdtDentalAction) => ({
        url: `/setup/link-cdt-action`,
        method: 'POST',
        body: cdtDentalAction
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    unlinkCdtAction: builder.mutation({
      query: (cdtDentalAction: ApCdtDentalAction) => ({
        url: `/setup/unlink-cdt-action`,
        method: 'POST',
        body: cdtDentalAction
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getCdts: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/cdt-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    getCdtsByTreatment: builder.query({
      query: (treatmentKey: any) => ({
        url: `/setup/cdt-list-by-treatment`,
        headers: {
          treatmentKey: treatmentKey
        }
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveCdt: builder.mutation({
      query: (cdt: ApCdt) => ({
        url: `/setup/save-cdt`,
        method: 'POST',
        body: cdt
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getServices: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/service-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveService: builder.mutation({
      query: (service: ApService) => ({
        url: `/setup/save-service`,
        method: 'POST',
        body: service
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    linkCdtService: builder.mutation({
      query: (cdtService: ApServiceCdt) => ({
        url: `/setup/link-cdt-service`,
        method: 'POST',
        body: cdtService
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    unlinkCdtService: builder.mutation({
      query: (cdtService: ApServiceCdt) => ({
        url: `/setup/unlink-cdt-service`,
        method: 'POST',
        body: cdtService
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getIcdList: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/icd-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 3600
    }),
    getDiagnosticsTestNormalRangeList: builder.query({
          query: (listRequest: ListRequest) => ({
            url: `/setup/diagnostic-test-normal-range-list?${fromListRequestToQueryParams(listRequest)}`
          }),
          onQueryStarted: onQueryStarted,
          keepUnusedDataFor: 5
        }),
        saveDiagnosticsTestNormalRange: builder.mutation({
          query: (data: { diagnosticTestNormalRange: ApDiagnosticTestNormalRange; lov; }) => {
            const param = data.lov;
            return {
              url: `/setup/save-diagnostic-test-normal-range?lov=${param}`,
              method: 'POST',
              body: data.diagnosticTestNormalRange,
            }
    
          }, onQueryStarted: onQueryStarted,
          transformResponse: (response: any) => {
            return response.object;
          }
        }),
    getDiagnosticsTestList: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/diagnostic-test-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    getDiagnosticsTestLaboratoryList: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/diagnostic-test-laboratory-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    getDiagnosticsTestPathologyList: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/diagnostic-test-pathology-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    getDiagnosticsTestType: builder.query({
      query: (testTypeKey: string) => ({
        headers: {
          testTypeKey
        },
        url: `/setup/diagnostic-test-type`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveDiagnosticsTest: builder.mutation({
      query: (diagnosticTest: ApDiagnosticTest) => ({
        url: `/setup/save-diagnostic-test`,
        method: 'POST',
        body: diagnosticTest,
      }), onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.data;
      }
    }),
    saveDiagnosticsTestLaboratory: builder.mutation({
      query: (diagnosticTestLaboratory: ApDiagnosticTestLaboratory) => ({
        url: `/setup/save-diagnostic-test-laboratory`,
        method: 'POST',
        body: diagnosticTestLaboratory,
      }), onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.data;
      }
    }),
    saveDiagnosticsTestPathology: builder.mutation({
      query: (diagnosticTestLaboratory: ApDiagnosticTestLaboratory) => ({
        url: `/setup/save-diagnostic-test-pathology`,
        method: 'POST',
        body: diagnosticTestLaboratory,
      }), onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.data;
      }
    }),
    removeCatalogDiagnosticTest: builder.mutation({
      query: (data: { diagnosticTest: ApDiagnosticTest; catalogKey: string }) => ({
        url: `/setup/remove-catalog-diagnostic-test`,
        method: 'POST',
        body: data.diagnosticTest,
        headers: {
          catalogKey: data.catalogKey
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getDiagnosticsTestGeneticsList: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/diagnostic-test-genetics-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveDiagnosticsTestGenetics: builder.mutation({
      query: (diagnosticTestGenetics: ApDiagnosticTestGenetics) => ({
        url: `/setup/save-diagnostic-test-genetics`,
        method: 'POST',
        body: diagnosticTestGenetics,
      }), onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.data;
      }
    }),
    getDiagnosticsTestRadiologyList: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/diagnostic-test-radiology-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveDiagnosticsRadiologyTest: builder.mutation({
      query: (diagnosticTestRadiology: ApDiagnosticTestRadiology) => ({
        url: `/setup/save-diagnostic-test-radiology`,
        method: 'POST',
        body: diagnosticTestRadiology,
      }), onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.data;
      }
    }),
    getDiagnosticsTestCatalogHeaderList: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/diagnostic-test-catalog-header-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveDiagnosticsTestCatalogHeader: builder.mutation({
      query: (diagnosticTest: ApDiagnosticTest) => ({
        url: `/setup/save-diagnostic-test-catalog-header`,
        method: 'POST',
        body: diagnosticTest
      }), onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    removeDiagnosticsTestCatalogHeader: builder.mutation({
      query: (diagnosticTest: ApDiagnosticTest) => ({
        url: `/setup/remove-diagnostic-test-catalog-header`,
        method: 'POST',
        body: diagnosticTest
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getDiagnosticsTestSpecialPopulationList: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/setup/diagnostic-test-special-population-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    getCatalogDiagnosticsTestList: builder.query({
      query: (catalogKey: string) => ({
        headers: {
          catalogKey
        },
        url: `/setup/catalog-diagnostic-test-list`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveCatalogDiagnosticsTest: builder.mutation({
      query: (catalogDiagnosticTestRecords: ApCatalogDiagnosticTest[]) => ({
        url: `/setup/save-catalog-diagnostic-test`,
        method: 'POST',
        body: catalogDiagnosticTestRecords
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }

    }),
    getDiagnosticsTestNotSelectedList: builder.query({
      query: (data: { catalogKey: string, type: string }) => ({
        headers: {
          catalogKey: data.catalogKey,
          type: data.type
        },
        url: `/setup/diagnostic-test-no-catalog-list`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    removeUserFacilityDepartment: builder.mutation({
      query: (facilityDepartment: ApUserFacilitiyDepartments) => ({
        url: `/setup/remove-user-facility-department`,
        method: 'POST',
        body: facilityDepartment,
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
    }),

    removePractitioner: builder.mutation({
      query: (practitioner: ApPractitioner) => ({
        url: `/setup/remove-practitioner`,
        method: 'POST',
        body: practitioner,
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
    }),

    deactiveActivePractitioner: builder.mutation({
      query: (practitioner: ApPractitioner) => ({
        url: `/setup/deactive-avtice-practitioner`,
        method: 'POST',
        body: practitioner,
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
    }),
    saveAgeGroup: builder.mutation({
      query: (agegroup: ApAgeGroup) => ({
        url: `/setup/save-age-group`,
        method: 'POST',
        body:agegroup,
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response;
      },
    }),
    getAgeGroup: builder.query({
      query: (listRequest: ListRequest) => ({
         url: `/setup/age-group-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveVaccine: builder.mutation({
      query: (vaccine: ApVaccine) => ({
        url: `/setup/save-vaccine`,
        method: 'POST',
        body: vaccine
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }

    }),
    getVaccineList: builder.query({
      query: (listRequest: ListRequest) => ({
         url: `/setup/vaccine-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    removeVaccine: builder.mutation({
      query: (vaccine: ApVaccine) => ({
        url: `/setup/remove-vaccine`,
        method: 'POST',
        body: vaccine,
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
    }),
    deactiveActivVaccine: builder.mutation({
      query: (vaccine: ApVaccine) => ({
        url: `/setup/deactive-avtice-vaccine`,
        method: 'POST',
        body: vaccine,
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
    }),
    saveVaccineBrand: builder.mutation({
      query: (brand: ApVaccineBrands) => ({
        url: `/setup/save-vaccine-brands`,
        method: 'POST',
        body: brand
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }

    }),
    getVaccineBrandsList: builder.query({
      query: (listRequest: ListRequest) => ({
         url: `/setup/vaccine-brands-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    deactiveActivVaccineBrands: builder.mutation({
      query: (vaccineBrand: ApVaccineBrands) => ({
        url: `/setup/deactive-avtice-vaccine-brand`,
        method: 'POST',
        body: vaccineBrand,
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
    }),

    getDoseNumbersList: builder.query({
      query: (data: {key: string }) => ({
        url: `/setup/vaccine-doses-numbers-list`,
        headers: {
        key: data.key
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
      keepUnusedDataFor: 0
    }),
    saveVaccineDose: builder.mutation({
      query: (brand: ApVaccineDose) => ({
        url: `/setup/save-vaccine-dose`,
        method: 'POST',
        body: brand  }),
        onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
        }
  
      }),

    saveProcedure: builder.mutation({
      query: (p: ApProcedureSetup) => ({
        url: `/setup/save-procedure`,
        method: 'POST',
        body: p

      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }

    }),

    getVaccineDosesList: builder.query({
      query: (listRequest: ListRequest) => ({
         url: `/setup/vaccine-doses-list?${fromListRequestToQueryParams(listRequest)}`
        }),
        onQueryStarted: onQueryStarted,
        keepUnusedDataFor: 5
      })
   , getProcedureList: builder.query({
      query: (listRequest: ListRequest) => ({
         url: `/setup/procedure-list?${fromListRequestToQueryParams(listRequest)}`

      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),

    removeVaccineDose: builder.mutation({
      query: (vaccineDose: ApVaccineDose) => ({
        url: `/setup/remove-vaccine-dose`,
        method: 'POST',
        body: vaccineDose,
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
    }),
    saveVaccineDosesInterval: builder.mutation({
      query: (interval: ApVaccineDosesInterval) => ({
        url: `/setup/save-vaccine-doses-interval`,
        method: 'POST',
        body: interval
      }),}),
    removeProcedure: builder.mutation({
      query: (P: ApProcedureSetup) => ({
        url: `/setup/remove-procedure`,
        method: 'POST',
        body: P,
      }),}),
    saveProcedureCoding: builder.mutation({
      query: (p: ApProcedureCoding) => ({
        url: `/setup/save-procedure-coding`,
        method: 'POST',
        body: p

      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }

    }),

    getVaccineDosesIntervalList: builder.query({
      query: (listRequest: ListRequest) => ({
         url: `/setup/vaccine-doses-interval-list?${fromListRequestToQueryParams(listRequest)}`
        }),
        onQueryStarted: onQueryStarted,
        keepUnusedDataFor: 5
      }),
    getProcedureCodingList: builder.query({
      query: (listRequest: ListRequest) => ({
         url: `/setup/procedure-coding-list?${fromListRequestToQueryParams(listRequest)}`

      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),

    removeVaccineDoseInterval: builder.mutation({
      query: (interval: ApVaccineDosesInterval) => ({
        url: `/setup/remove-vaccine-doses-interval`,
        method: 'POST',
        body: interval,
      }),}),
    removeProcedureCoding: builder.mutation({
      query: (P: ApProcedureCoding) => ({
        url: `/setup/remove-coding`,
        method: 'POST',
        body: P,
      }),}),
    saveProcedurePriceList: builder.mutation({
      query: (p: ApProcedurePriceList) => ({
        url: `/setup/save-procedure-price-list`,
        method: 'POST',
        body: p

      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;

      },
    }),

    getProcedurePriceList: builder.query({
      query: (listRequest: ListRequest) => ({
         url: `/setup/procedure-price-list-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),

    removeProcedurePriceList: builder.mutation({
      query: (P: ApProcedurePriceList) => ({
        url: `/setup/remove-price-list`,
        method: 'POST',
        body: P,
      }),}),

      saveDuplicationCandidateSetup: builder.mutation({
        query: (p: ApDuplicationCandidateSetup) => ({
          url: `/setup/save-duplication_candidate_setup`,
          method: 'POST',
          body: p
  
        }),
        onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
  
        },
      }),
  
      getDuplicationCandidateSetupList: builder.query({
        query: (listRequest: ListRequest) => ({
           url: `/setup/duplication_candidate_setup-list?${fromListRequestToQueryParams(listRequest)}`
        }),
        onQueryStarted: onQueryStarted,
        keepUnusedDataFor: 5
      }),
      getCptList: builder.query({
        query: (listRequest: ListRequest) => ({
          url: `/setup/cpt-list?${fromListRequestToQueryParams(listRequest)}`
        }),
        onQueryStarted: onQueryStarted,
        keepUnusedDataFor: 3600
      }),
      getLoincList: builder.query({
        query: (listRequest: ListRequest) => ({
          url: `/setup/loinc-list?${fromListRequestToQueryParams(listRequest)}`
        }),
        onQueryStarted: onQueryStarted,
        keepUnusedDataFor: 3600
      }),
   

  })

});

export const {
  useGetLicenseQuery,
  useSaveUserMidicalLicenseMutation,
  useRemoveUserMidicalLicenseMutation,
  useGetFacilitiesQuery,
  useSaveFacilityMutation,
  useRemoveFacilityMutation,
  useGetAccessRolesQuery,
  useSaveAccessRoleMutation,
  useGetLovsQuery,
  useRemoveUomGroupMutation,
  useSaveLovMutation,
  useGetLovValuesQuery,
  useSaveLovValueMutation,
  useGetUsersQuery,
  useSaveUserMutation,
  useGetModulesQuery,
  useGetUomGroupsQuery,
  useSaveModuleMutation,
  useSaveUomGroupMutation,
  useGetScreensQuery,
  useSaveScreenMutation,
  useGetScreenAccessMatrixQuery,
  useSaveScreenAccessMatrixMutation,
  useGetLovAllValuesQuery,
  useGetLovValuesByCodeQuery,
  useGetLovValuesByCodeAndParentQuery,
  useGetMetadataQuery,
  useGetMetadataFieldsQuery,
  useGetPractitionersQuery,
  useSavePractitionerMutation,
  useRemovePractitionerMutation,
  useDeactiveActivePractitionerMutation,
  useGetDepartmentsQuery,
  useSaveDepartmentMutation,
  useGetAllergensQuery,
  useSaveAllergensMutation,
  useGetDentalActionsQuery,
  useSaveDentalActionMutation,
  useLinkCdtActionMutation,
  useUnlinkCdtActionMutation,
  useGetCdtsQuery,
  useGetCdtsByTreatmentQuery,
  useSaveCdtMutation,
  useGetServicesQuery,
  useSaveServiceMutation,
  useLinkCdtServiceMutation,
  useUnlinkCdtServiceMutation,
  useGetIcdListQuery,
  useGetDiagnosticsTestNormalRangeListQuery,
  useSaveDiagnosticsTestNormalRangeMutation,
  useSaveDiagnosticsTestMutation,
  useGetDiagnosticsTestListQuery,
  useGetDiagnosticsTestTypeQuery,
  useSaveDiagnosticsTestCatalogHeaderMutation,
  useGetDiagnosticsTestCatalogHeaderListQuery,
  useSaveCatalogDiagnosticsTestMutation,
  useGetCatalogDiagnosticsTestListQuery,
  useSaveDiagnosticsTestSpecialPopulationMutation,
  useSaveDiagnosticsRadiologyTestMutation,
  useGetDiagnosticsTestLaboratoryListQuery,
  useSaveDiagnosticsTestLaboratoryMutation,
  useGetDiagnosticsTestPathologyListQuery,
  useSaveDiagnosticsTestPathologyMutation,
  useGetDiagnosticsTestRadiologyListQuery,
  useGetDiagnosticsTestGeneticsListQuery,
  useGetDiagnosticsTestNotSelectedListQuery,
  useRemoveCatalogDiagnosticTestMutation,
  useRemoveUserMutation,
  useGetUserDepartmentsQuery,
  useResetUserPasswordMutation,
  useSaveFacilityDepartmentMutation,
  useRemoveUserFacilityDepartmentMutation,
  useGetUserRecordQuery,
  useSaveAgeGroupMutation,
  useGetAgeGroupQuery,
  useSaveVaccineMutation,
  useGetVaccineListQuery,
  useRemoveVaccineMutation,
  useDeactiveActivVaccineMutation,
  useSaveVaccineBrandMutation,
  useGetVaccineBrandsListQuery,
  useDeactiveActivVaccineBrandsMutation,
 
  useGetDoseNumbersListQuery,
  useSaveVaccineDoseMutation,
  useGetVaccineDosesListQuery,
  useRemoveVaccineDoseMutation,
  useSaveVaccineDosesIntervalMutation,
  useGetVaccineDosesIntervalListQuery,
  useRemoveVaccineDoseIntervalMutation,
  useGetProcedureListQuery,
  useSaveProcedureMutation,
  useGetProcedureCodingListQuery,
  useGetProcedurePriceListQuery,
  useSaveProcedureCodingMutation,
  useSaveProcedurePriceListMutation,
  useRemoveProcedureMutation,
  useRemoveProcedurePriceListMutation,
  useRemoveProcedureCodingMutation,
  useGetDuplicationCandidateSetupListQuery,
  useSaveDuplicationCandidateSetupMutation,
  useGetCptListQuery,
  useGetLoincListQuery,
  useDeactivateUserMutation
} = setupService;
