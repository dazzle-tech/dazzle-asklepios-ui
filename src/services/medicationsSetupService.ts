import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';
import {
  ApActiveIngredient,
  ApActiveIngredientAdverseEffect,
  ApActiveIngredientContraindication,
  ApActiveIngredientDrugInteraction,
  ApActiveIngredientFoodInteraction,
  ApActiveIngredientIndication,
  ApActiveIngredientRecommendedDosage,
  ApActiveIngredientSpecialPopulation,
  ApActiveIngredientSynonym,
  ApPrescriptionInstruction,
  ApGenericMedication,
  ApGenericMedicationActiveIngredient
} from '@/types/model-types';

export const medicationsSetupService = createApi({
  reducerPath: 'medicationsSetupApi',
  baseQuery: baseQuery,
  endpoints: builder => ({
    getGenericMedication: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/medications/generic-medication-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    removeGenericMedication: builder.mutation({
      query: (genericMedication: ApGenericMedication) => ({
        url: `/medications/remove-generic-medication`,
        method: 'POST',
        body: genericMedication
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    saveGenericMedication: builder.mutation({
      query: (data: { genericMedication: ApGenericMedication; roa; }) => {
         const param = data.roa;
        return{
            url: `/medications/save-generic-medication?roa=${param}`,
        method: 'POST',
        body: data.genericMedication,
        }
      
      },onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getGenericMedicationActiveIngredient: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/medications/generic-medication-active-ingredient-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    removeGenericMedicationActiveIngredient: builder.mutation({
      query: (genericMedicationActiveIngredient: ApGenericMedicationActiveIngredient) => ({
        url: `/medications/remove-generic-medication-active-ingredient`,
        method: 'POST',
        body: genericMedicationActiveIngredient
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    saveGenericMedicationActiveIngredient: builder.mutation({
      query: (genericMedicationActiveIngredient: ApGenericMedicationActiveIngredient) => ({
        url: `/medications/save-generic-medication-active-ingredient`,
        method: 'POST',
        body: genericMedicationActiveIngredient
      }),onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getPrescriptionInstruction: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/medications/prescription-instruction-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    removePrescriptionInstruction: builder.mutation({
      query: (prescriptionInstruction: ApPrescriptionInstruction) => ({
        url: `/medications/remove-prescription-instruction`,
        method: 'POST',
        body: prescriptionInstruction
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    savePrescriptionInstruction: builder.mutation({
      query: (prescriptionInstruction: ApPrescriptionInstruction) => ({
        url: `/medications/save-prescription-instruction`,
        method: 'POST',
        body: prescriptionInstruction
      }),onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),

    getActiveIngredientSynonym: builder.query({
        query: (listRequest: ListRequest) => ({
          url: `/medications/active-ingredient-synonym-list?${fromListRequestToQueryParams(listRequest)}`
        }),
        onQueryStarted: onQueryStarted,
        keepUnusedDataFor: 5
      }),
      removeActiveIngredientSynonym: builder.mutation({
        query: (activeIngredientSynonym: ApActiveIngredientSynonym) => ({
          url: `/medications/remove-active-ingredient-synonym`,
          method: 'POST',
          body: activeIngredientSynonym
        }),
        onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
        }
      }),
      saveActiveIngredientSynonym: builder.mutation({
        query: (activeIngredientSynonym: ApActiveIngredientSynonym) => ({
          url: `/medications/save-active-ingredient-synonym`,
          method: 'POST',
          body: activeIngredientSynonym
        }),onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
        }
      }),
      getActiveIngredientAdverseEffect: builder.query({
        query: (listRequest: ListRequest) => ({
          url: `/medications/active-ingredient-adverse-effect-list?${fromListRequestToQueryParams(listRequest)}`
        }),
        onQueryStarted: onQueryStarted,
        keepUnusedDataFor: 5
      }),
      removeActiveIngredientAdverseEffect: builder.mutation({
        query: (activeIngredientAdverseEffect: ApActiveIngredientAdverseEffect) => ({
          url: `/medications/remove-active-ingredient-adverse-effect`,
          method: 'POST',
          body: activeIngredientAdverseEffect
        }),
        onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
        }
      }),
      saveActiveIngredientAdverseEffect: builder.mutation({
        query: (activeIngredientAdverseEffect: ApActiveIngredientAdverseEffect) => ({
          url: `/medications/save-active-ingredient-adverse-effect`,
          method: 'POST',
          body: activeIngredientAdverseEffect
        }),onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
        }
      }),
      getActiveIngredientSpecialPopulation: builder.query({
        query: (listRequest: ListRequest) => ({
          url: `/medications/active-ingredient-special-population-list?${fromListRequestToQueryParams(listRequest)}`
        }),
        onQueryStarted: onQueryStarted,
        keepUnusedDataFor: 5
      }),
      removeActiveIngredientSpecialPopulation: builder.mutation({
        query: (activeIngredientSpecialPopulation: ApActiveIngredientSpecialPopulation) => ({
          url: `/medications/remove-active-ingredient-special-population`,
          method: 'POST',
          body: activeIngredientSpecialPopulation
        }),
        onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
        }
      }),
      saveActiveIngredientSpecialPopulation: builder.mutation({
        query: (ApActiveIngredientSpecialPopulation: ApActiveIngredientSpecialPopulation) => ({
          url: `/medications/save-active-ingredient-special-population`,
          method: 'POST',
          body: ApActiveIngredientSpecialPopulation
        }),onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
        }
      }),
      getActiveIngredientFoodInteraction: builder.query({
        query: (listRequest: ListRequest) => ({
          url: `/medications/active-ingredient-food-interaction-list?${fromListRequestToQueryParams(listRequest)}`
        }),
        onQueryStarted: onQueryStarted,
        keepUnusedDataFor: 5
      }),
      removeActiveIngredientFoodInteraction: builder.mutation({
        query: (activeIngredientFoodInteraction: ApActiveIngredientFoodInteraction) => ({
          url: `/medications/remove-active-ingredient-food-interaction`,
          method: 'POST',
          body: activeIngredientFoodInteraction
        }),
        onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
        }
      }),
      saveActiveIngredientFoodInteraction: builder.mutation({
        query: (activeIngredientFoodInteraction: ApActiveIngredientFoodInteraction) => ({
          url: `/medications/save-active-ingredient-food-interaction`,
          method: 'POST',
          body: activeIngredientFoodInteraction
        }),onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
        }
      }),
      getActiveIngredientDrugInteraction: builder.query({
        query: (listRequest: ListRequest) => ({
          url: `/medications/active-ingredient-drug-interaction-list?${fromListRequestToQueryParams(listRequest)}`
        }),
        onQueryStarted: onQueryStarted,
        keepUnusedDataFor: 5
      }),
      removeActiveIngredientDrugInteraction: builder.mutation({
        query: (activeIngredientDrugInteraction: ApActiveIngredientDrugInteraction) => ({
          url: `/medications/remove-active-ingredient-drug-interaction`,
          method: 'POST',
          body: activeIngredientDrugInteraction
        }),
        onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
        }
      }),
      saveActiveIngredientDrugInteraction: builder.mutation({
        query: (activeIngredientDrugInteraction: ApActiveIngredientDrugInteraction) => ({
          url: `/medications/save-active-ingredient-drug-interaction`,
          method: 'POST',
          body: activeIngredientDrugInteraction
        }),onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
        }
      }),
      getActiveIngredientRecommededDosage: builder.query({
        query: (listRequest: ListRequest) => ({
          url: `/medications/active-ingredient-recommended-dosage-list?${fromListRequestToQueryParams(listRequest)}`
        }),
        onQueryStarted: onQueryStarted,
        keepUnusedDataFor: 5
      }),
      removeActiveIngredientRecommendedDosage: builder.mutation({
        query: (activeIngredientRecommendedDosage: ApActiveIngredientRecommendedDosage) => ({
          url: `/medications/remove-active-ingredient-recommended-dosage`,
          method: 'POST',
          body: activeIngredientRecommendedDosage
        }),
        onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
        }
      }),
      saveActiveIngredientRecommendedDosage: builder.mutation({
        query: (activeIngredientRecommendedDosage: ApActiveIngredientRecommendedDosage) => ({
          url: `/medications/save-active-ingredient-recommended-dosage`,
          method: 'POST',
          body: activeIngredientRecommendedDosage
        }),onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
        }
      }),
      getActiveIngredientContraindication: builder.query({
        query: (listRequest: ListRequest) => ({
          url: `/medications/active-ingredient-contraindication-list?${fromListRequestToQueryParams(listRequest)}`
        }),
        onQueryStarted: onQueryStarted,
        keepUnusedDataFor: 5
      }),
      removeActiveIngredientContraindication: builder.mutation({
        query: (activeIngredientContraindication: ApActiveIngredientContraindication) => ({
          url: `/medications/remove-active-ingredient-contraindication`,
          method: 'POST',
          body: activeIngredientContraindication
        }),
        onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
        }
      }),
      saveActiveIngredientContraindication: builder.mutation({
        query: (activeIngredientContraindication: ApActiveIngredientContraindication) => ({
          url: `/medications/save-active-ingredient-contraindication`,
          method: 'POST',
          body: activeIngredientContraindication
        }),onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
        }
      }),
      getActiveIngredientIndication: builder.query({
        query: (listRequest: ListRequest) => ({
          url: `/medications/active-ingredient-indication-list?${fromListRequestToQueryParams(listRequest)}`
         
        }),
        onQueryStarted: onQueryStarted,
        keepUnusedDataFor: 5
      }),
      removeActiveIngredientIndication: builder.mutation({
        query: (activeIngredientIndication: ApActiveIngredientIndication) => ({
          url: `/medications/remove-active-ingredient-indication`,
          method: 'POST',
          body: activeIngredientIndication
        }),
        onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
        }
      }),
      saveActiveIngredientIndication: builder.mutation({
        query: (activeIngredientIndication: ApActiveIngredientIndication) => ({
          url: `/medications/save-active-ingredient-indication`,
          method: 'POST',
          body: activeIngredientIndication
        }),onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
        }
      }),
      getActiveIngredient: builder.query({
        query: (listRequest: ListRequest) => ({
          url: `/medications/active-ingredient-list?${fromListRequestToQueryParams(listRequest)}`
        }),
        onQueryStarted: onQueryStarted,
        keepUnusedDataFor: 5
      }),
      saveActiveIngredient: builder.mutation({
        query: (activeIngredient: ApActiveIngredient) => ({
          url: `/medications/save-active-ingredient`,
          method: 'POST',
          body: activeIngredient
        }),onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response;
        }
      }),
      getGenericMedicationWithActiveIngredient: builder.query({
        query: (active: string) => ({
          headers: {
            active
          },
          url: `/medications/generic-medication_act-list`
        }),
        onQueryStarted: onQueryStarted,
        keepUnusedDataFor: 5
  
      }),
      getActiveIngredientDrugInteractionByKey: builder.query({
        query: (activeKey: any) => ({
          url: `/medications/active-ingredient-drug-interaction-by-key-list`,
          headers: {
            activeKey: activeKey
          }
        }),
        onQueryStarted: onQueryStarted,
        keepUnusedDataFor: 5
      }),
    })
});

export const {
  
  useGetGenericMedicationQuery,
  useRemoveGenericMedicationMutation,
  useSaveGenericMedicationMutation,
  useGetGenericMedicationActiveIngredientQuery,
  useSaveGenericMedicationActiveIngredientMutation,
  useRemoveGenericMedicationActiveIngredientMutation,
  useGetActiveIngredientSynonymQuery,
  useRemoveActiveIngredientSynonymMutation,
  useSaveActiveIngredientSynonymMutation,
  useGetActiveIngredientSpecialPopulationQuery,
  useRemoveActiveIngredientSpecialPopulationMutation,
  useSaveActiveIngredientSpecialPopulationMutation,
  useGetActiveIngredientAdverseEffectQuery,
  useRemoveActiveIngredientAdverseEffectMutation,
  useSaveActiveIngredientAdverseEffectMutation,
  useGetActiveIngredientFoodInteractionQuery,
  useRemoveActiveIngredientFoodInteractionMutation,
  useSaveActiveIngredientFoodInteractionMutation,
  useGetActiveIngredientDrugInteractionQuery,
  useRemoveActiveIngredientDrugInteractionMutation,
  useSaveActiveIngredientDrugInteractionMutation,
  useGetActiveIngredientRecommededDosageQuery,
  useRemoveActiveIngredientRecommendedDosageMutation,
  useSaveActiveIngredientRecommendedDosageMutation,
  useGetActiveIngredientContraindicationQuery,
  useRemoveActiveIngredientContraindicationMutation,
  useSaveActiveIngredientContraindicationMutation,
  useGetActiveIngredientIndicationQuery,
  useRemoveActiveIngredientIndicationMutation,
  useSaveActiveIngredientIndicationMutation,
  useGetPrescriptionInstructionQuery,
  useRemovePrescriptionInstructionMutation,
  useSavePrescriptionInstructionMutation,
  useGetActiveIngredientQuery,
  useSaveActiveIngredientMutation,
  useGetGenericMedicationWithActiveIngredientQuery,
  useGetActiveIngredientDrugInteractionByKeyQuery
 
} = medicationsSetupService;