import InfoCardList from "@/components/InfoCardList";
import { useGetActiveIngredientQuery, useGetGenericMedicationActiveIngredientQuery } from "@/services/medicationsSetupService";
import { useGetProductQuery } from "@/services/setupService";
import { initialListRequest, ListRequest } from "@/types/types";
import React, { useEffect, useState } from "react";
const ProductDetails = ({ selectedProduct }) => {

const [listRequest, setListRequest] = useState<ListRequest>({
     ...initialListRequest, 
       filters: [
            {
                fieldName: "key",
                operator: "match",
                value: selectedProduct?.key,
            }

        ],
    });
     const {
       data: productListResponse,
       refetch: refetchProduct,
       isFetching
     } = useGetProductQuery(listRequest);

       useEffect(() => {
         const updatedFilters = [
         {
                fieldName: "key",
                operator: "match",
                value: selectedProduct?.key,
            }
         ];
         setListRequest(prevRequest => ({
           ...prevRequest,
           filters: updatedFilters
         }));

       }, [selectedProduct?.key]);


    return (<>
        <InfoCardList
            list={productListResponse?.object || []}
            fields={[
                'name',
                'code',
                'typeLkey',
                'barecode',
                'inventoryTypeLkey',
            ]}
            titleField="name"
            fieldLabels={{
                name: 'Product Name',
                code: 'Code',
                typeLkey: 'Type',
                barecode: 'Barcode',
                inventoryTypeLkey: 'Inventory Type',
            }}
         
        /></>)
}
export default ProductDetails;