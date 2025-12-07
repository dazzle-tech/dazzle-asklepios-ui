// 📌 UomConversionModal.jsx
import React, { useState } from "react";
import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import { Form } from "rsuite";
import { faBoxesPacking } from "@fortawesome/free-solid-svg-icons";
import {
  useGetAllRelationByUOMGroupQuery,
  useGetAllUnitsByGroupIdQuery
} from "@/services/setup/uom-group/uomGroupService";
import { newUOMGroupRelation } from "@/types/model-types-constructor-new";
import { notify } from "@/utils/uiReducerActions";
import { useAppDispatch } from "@/hooks";

const UomConversionModal = ({ open, setOpen, uom }) => {
  const dispatch = useAppDispatch();

  // States
  const [relation, setRelation] = useState({ ...newUOMGroupRelation });
  const [isEdit, setIsEdit] = useState(false);

  // Queries
  const { data: unitsList = [] } = useGetAllUnitsByGroupIdQuery(uom?.id, { skip: !uom?.id });
  const { data: relationsList = [], refetch } = useGetAllRelationByUOMGroupQuery(uom?.id, { skip: !uom?.id });


  // Table Columns
  const columns = [
    { key: "each", title: "Each", render: r => r?.fromUnit?.uom },
    { key: "contain", title: "Contains", render: r => r?.toUnit?.uom },
    { key: "relation", title: "Relation" }
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="UOM Conversion"
      icon={faBoxesPacking}
      pagesCount={1}
      hideBack
      hideActionBtn
      content={() => (
        <Form fluid>
          <MyTable height={350} data={relationsList ?? []} columns={columns} />
        </Form>
      )}
    />
  );
};

export default UomConversionModal;
