import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form, Grid, InputGroup, Row, Stack, Col, Panel, Modal, Button, Divider, Text } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyButton from '@/components/MyButton/MyButton';
import { faBan, faBold, faBox, faBoxesPacking, faBoxesStacked, faBroom, faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import ChildModal from '@/components/ChildModal';
import { notify } from '@/utils/uiReducerActions';
import Translate from '@/components/Translate';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import MyTable from '@/components/MyTable';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { useAppDispatch } from '@/hooks';
import { newApProducts, newApUomGroups, newApUomGroupsRelation, newApUomGroupsUnits } from '@/types/model-types-constructor';
import { ApUomGroupsRelation, ApUomGroupsUnits } from '@/types/model-types';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetLovValuesByCodeQuery, useGetUomGroupsQuery, useGetUomGroupsRelationQuery, useGetUomGroupsUnitsQuery, useRemoveProductMutation, useSaveProductMutation, useSaveUomGroupMutation, useSaveUomGroupRelationMutation, useSaveUomGroupUnitsMutation } from '@/services/setupService';


const AddEditRelation = ({
    
    open,
    setOpen,
    uom,
    setUom,
    uomRelation,
    setUomRelation,
    refetch
})=> {

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
            value: uom?.key
    
          }
        ]
      });
   const { data: UOMGroupUnitListResponse, refetch: uomUnitRefetch } = useGetUomGroupsUnitsQuery(unitListRequest);
   
  
      return (
          <Form>
            <MyInput
              fieldType="select"
              fieldName="uomUnitFromKey"
              record={uomRelation}
              setRecord={setUomRelation}
              selectDataValue="key"
              selectDataLabel="units"
              placeholder="Unit"
              selectData={UOMGroupUnitListResponse?.object ?? []}
              menuMaxHeight={200}
              width={350}
            />
            <MyInput
              fieldType="select"
              fieldName="uomUnitToKey"
              record={uomRelation}
              setRecord={setUomRelation}
              selectDataValue="key"
              selectDataLabel="units"
              placeholder="Unit"
              selectData={UOMGroupUnitListResponse?.object ?? []}
              menuMaxHeight={200}
              width={350}
            />
            <MyInput
              fieldType="number"
              fieldName="relation"
              record={uomRelation}
              setRecord={setUomRelation}
              width={350}
            />
          </Form>
        );
};

export default AddEditRelation;