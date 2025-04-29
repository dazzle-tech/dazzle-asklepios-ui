import InfoCardList from "@/components/InfoCardList";
import { useGetActiveIngredientQuery, useGetGenericMedicationActiveIngredientQuery } from "@/services/medicationsSetupService";
import { initialListRequest } from "@/types/types";
import React, { useEffect, useState } from "react";
const ActiveIngredient = ({ selectedGeneric }) => {

    const [listGinricRequest, setListGinricRequest] = useState({
        ...initialListRequest,
        sortType: 'desc'
        ,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
            ,
            {
                fieldName: 'generic_medication_key',
                operator: 'match',
                value: selectedGeneric?.key

            }
        ]
    });
    const { data: genericMedicationActiveIngredientListResponseData, refetch: refetchGenric } = useGetGenericMedicationActiveIngredientQuery({ ...listGinricRequest });
    const { data: activeIngredientListResponseData } = useGetActiveIngredientQuery({ ...initialListRequest });
       useEffect(() => {
   
           const updatedFilters = [
               {
                   fieldName: 'deleted_at',
                   operator: 'isNull',
                   value: undefined
               }
               ,
   
               {
                   fieldName: 'generic_medication_key',
                   operator: 'match',
                   value: selectedGeneric?.key || null
               }
           ];
       console.log(updatedFilters);
           setListGinricRequest((prevRequest) => ({
   
               ...prevRequest,
               filters: updatedFilters,
   
           }));
       }, [selectedGeneric]);
   

    return (<>
        <InfoCardList
            list={genericMedicationActiveIngredientListResponseData?.object || []}
            fields={[
                'activeIngredientName',
                'activeIngredientATCCode',
                'strengthDisplay',
                'isControlledDisplay',
                'controlledDisplay',
            ]}
            titleField="activeIngredientName"
            fieldLabels={{
                activeIngredientName: 'Active Ingredient',
                activeIngredientATCCode: 'ATC Code',
                strengthDisplay: 'Strength',
                isControlledDisplay: 'Is Controlled',
                controlledDisplay: 'Controlled',
            }}
            // computedFields={{
            //     activeIngredientName: (item) =>
            //         activeIngredientListResponseData?.object?.find(i => i.key === item.activeIngredientKey)?.name || " ",
            //     activeIngredientATCCode: (item) =>
            //         activeIngredientListResponseData?.object?.find(i => i.key === item.activeIngredientKey)?.atcCode || " ",
            //     strengthDisplay: (item) =>
            //         (item?.strength || '') + (item?.unitLvalue?.lovDisplayVale || ''),
            //     isControlledDisplay: (item) => {
            //         const isControlled = activeIngredientListResponseData?.object?.find(i => i.key === item.activeIngredientKey)?.isControlled;
            //         return isControlled ? "Yes" : "No";
            //     },
            //     controlledDisplay: (item) =>
            //         activeIngredientListResponseData?.object?.find(i => i.key === item.activeIngredientKey)?.controlledLvalue?.lovDisplayVale || " ",
            // }}
         
        /></>)
}
export default ActiveIngredient;