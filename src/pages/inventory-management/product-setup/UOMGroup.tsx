import React, { useEffect, useState } from "react";
import { Form } from "rsuite";
import MyInput from "@/components/MyInput";
import {
  useGetAllUOMGroupsQuery,
  useGetAllUnitsByGroupIdQuery
} from "@/services/setup/uom-group/uomGroupService";
import MyButton from "@/components/MyButton/MyButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxesPacking } from "@fortawesome/free-solid-svg-icons";
import './styles.less';
import UomConversionModal from "./UomConversionModal";
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

const UomGroup = ({ product, setProduct, disabled }) => {

  const [openFullModal, setOpenFullModal] = useState(false);
  const [selectedUom, setSelectedUom] = useState({});
  const dispatch = useAppDispatch();



const { data: uomGroupsListResponse } = useGetAllUOMGroupsQuery({
  page: 0,
  size: 200,
  sort: "id,asc",
  name: ""
});



  const { data: uomUnitsResponse } = useGetAllUnitsByGroupIdQuery(
    product?.uomGroupId ?? 0,
    { skip: !product?.uomGroupId }
  );


  return (
    <>
      <Form fluid>
<div className="flex-row-product-set-up-page">
        <MyInput
          fieldLabel="UOM Group"
          fieldName="uomGroupId"
          fieldType="select"
          selectData={uomGroupsListResponse?.data ?? []}
          selectDataLabel="name"
          selectDataValue="id"
          record={product}
          setRecord={setProduct}
          disabled={disabled}
          searchable
          width={200}
        />

        <MyInput
        fieldLabel="Base UOM"
        fieldName="baseUom"
        fieldType="select"
        selectData={uomUnitsResponse ?? []}
        selectDataLabel="uom"
        selectDataValue="id"
        record={{
            ...product,
            baseUom: product?.baseUom ? Number(product.baseUom) : null,
        }}
        setRecord={setProduct}
        disabled={disabled || !product?.uomGroupId}
        required
        width={200}
        />
</div>
      </Form>

      <Form fluid>
    <div className="dispense-uom-and-button">
        <MyInput
        fieldLabel="Dispense UOM"
        fieldName="dispenseUom"
        fieldType="select"
        selectData={uomUnitsResponse ?? []}
        selectDataLabel="uom"
        selectDataValue="id"
        record={{
            ...product,
            dispenseUom: product?.dispenseUom ? Number(product.dispenseUom) : null,
        }}
        setRecord={setProduct}
        disabled={disabled || !product?.uomGroupId}
        width={300}
        />
    <div className="boxing-packaging-uom-button">
      <MyButton
        prefixIcon={() => <FontAwesomeIcon icon={faBoxesPacking} />}
        color="var(--deep-blue)"
        onClick={() => {
          if (!product?.uomGroupId) {
            dispatch(notify({ msg: "Please select a UOM Group first", sev: "error" }));
            return;
          }
          setSelectedUom({ id: product?.uomGroupId });
          setOpenFullModal(true);
        }}
        width="50px"
      />
      </div>    </div>
      </Form>

    <UomConversionModal open={openFullModal} setOpen={setOpenFullModal} uom={selectedUom} />

    </>
  );
};

export default UomGroup;
