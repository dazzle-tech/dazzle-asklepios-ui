import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetResourcesAvailabilityTimeQuery, useGetResourcesQuery } from '@/services/appointmentService';
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery, useGetUomGroupsQuery, useGetUomGroupsUnitsQuery } from '@/services/setupService';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxesPacking } from '@fortawesome/free-solid-svg-icons';
const UomGroup = ({ product, setProduct, disabled}) => {

    const { data: productTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PRODUCTS_TYPES');
    const [listRequest, setListRequest] = useState<ListRequest>({ 
        ...initialListRequest 

    });
    const {
        data: uomGroupsListResponse,
        refetch: refetchUomGroups,
        isFetching
    } = useGetUomGroupsQuery(listRequest);
    const [unitListRequest, setUnitListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
          {
            fieldName: 'deleted_at',
            operator: 'isNull',
            value: undefined
          }
          ,
          {
            fieldName: 'uom_group_key',
            operator: 'match',
            value: product?.uomGroupKey

          }
        ]
      });
          useEffect(() => {
            setUnitListRequest(
                  {
                      ...initialListRequest,
                      filters: [
                          {
                              fieldName: 'deleted_at',
                              operator: 'isNull',
                              value: undefined
                          },
                          {
                            fieldName: 'uom_group_key',
                            operator: 'match',
                            value: product?.uomGroupKey
                          }

                      ],
                  }
              );
          }, [product?.uomGroupKey]);

              const {
        data: uomGroupsUnitsListResponse,
        refetch: refetchUomGroupsUnit,
    } = useGetUomGroupsUnitsQuery(unitListRequest);
    return (
        <>
            <Form fluid layout="inline">
                <MyInput
                    fieldLabel="UOM Group"
                    fieldName="uomGroupKey"
                    fieldType="select"
                    selectData={uomGroupsListResponse?.object ?? []}
                    selectDataLabel="name"
                    selectDataValue="key"
                    record={product}
                    setRecord={setProduct}
                    searchable={true}
                    disabled={disabled}
                />
                <MyInput
                    fieldLabel="Base UOM"
                    fieldName="baseUomKey"
                    fieldType="select"
                    selectData={uomGroupsUnitsListResponse?.object ?? []}
                    selectDataLabel="units"
                    selectDataValue="key"
                    record={product}
                    setRecord={setProduct}
                    searchable={false}
                    disabled={disabled}
                />
                <MyInput
                    fieldLabel="Dispense UOM"
                    fieldName="dispenseUomKey"
                    fieldType="select"
                    selectData={uomGroupsUnitsListResponse?.object ?? []}
                    selectDataLabel="units"
                    selectDataValue="key"
                    record={product}
                    setRecord={setProduct}
                    searchable={false}
                    disabled={disabled}
                />
                <MyButton
                    prefixIcon={() => <FontAwesomeIcon icon={faBoxesPacking} />}
                    color="var(--deep-blue)"
                    //   onClick={handleUomGroupNew}
                    width="109px"
                >
                </MyButton>
            </Form>
        </>
    )
};

export default UomGroup;