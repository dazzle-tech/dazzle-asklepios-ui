import React, { useState, useMemo } from "react";
import { Form, Text, Panel } from "rsuite";
import { MdSave, MdDelete } from "react-icons/md";
import { Plus } from "@rsuite/icons";

import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";

import MyTable from "@/components/MyTable";
import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import Translate from "@/components/Translate";

import { useGetLovValuesByCodeQuery } from "@/services/setupService";

import {
  useGetAdverseEffectsByActiveIngredientIdQuery,
  useCreateAdverseEffectMutation,
  useUpdateAdverseEffectMutation,
  useDeleteAdverseEffectMutation
} from "@/services/setup/activeIngredients/activeIngredientAdverseEffectService";

import { newActiveIngredientAdverseEffects } from "@/types/model-types-constructor-new";

import "./styles.less";

const AdversEffects = ({ activeIngredients }) => {
  const dispatch = useAppDispatch();

  // ---------------------------
  // STATE
  // ---------------------------
  const [record, setRecord] = useState({
    ...newActiveIngredientAdverseEffects
  });

  const [openDelete, setOpenDelete] = useState(false);

  // ---------------------------
  // LOV
  // ---------------------------
  const { data: lovData } = useGetLovValuesByCodeQuery("MED_ADVERS_EFFECTS");

  // ---------------------------
  // API
  // ---------------------------
  const { data = [], isFetching, refetch } =
    useGetAdverseEffectsByActiveIngredientIdQuery(activeIngredients?.id, {
      skip: !activeIngredients?.id
    });

  const [createAdverse] = useCreateAdverseEffectMutation();
  const [updateAdverse] = useUpdateAdverseEffectMutation();
  const [deleteAdverse] = useDeleteAdverseEffectMutation();

  // ---------------------------
  // TABLE COLUMNS
  // ---------------------------
  const columns = [
    {
      key: "adverseEffect",
      title: <Translate>Adverse Effect</Translate>,
      render: (row) => <Text>{row.adverseEffect}</Text>
    },
    {
      key: "other",
      title: <Translate>Other</Translate>,
      render: (row) => <Text>{row.otherDescription}</Text>
    },
    {
      key: "icons",
      title: "",
      render: (row) => (
        <MdDelete
          className="icons-style"
          title="Delete"
          size={22}
          fill="var(--primary-pink)"
          onClick={() => {
            setRecord(row);
            setOpenDelete(true);
          }}
        />
      )
    }
  ];

  // ---------------------------
  // SAVE (Add / Update)
  // ---------------------------
  const save = async () => {
    if (!record.adverseEffect) {
      dispatch(notify({ msg: "Select adverse effect", sev: "error" }));
      return;
    }

    const payload = {
      ...record,
      activeIngredientId: activeIngredients.id
    };

    try {
      if (record.id) {
        await updateAdverse(payload).unwrap();
        dispatch(notify({ msg: "Updated successfully", sev: "success" }));
      } else {
        await createAdverse(payload).unwrap();
        dispatch(notify({ msg: "Added successfully", sev: "success" }));
      }

      refetch();
      setRecord({ ...newActiveIngredientAdverseEffects });

    } catch {
      dispatch(notify({ msg: "Save failed", sev: "error" }));
    }
  };

  // ---------------------------
  // DELETE
  // ---------------------------
  const remove = async () => {
    setOpenDelete(false);

    try {
      await deleteAdverse(record.id).unwrap();
      dispatch(notify({ msg: "Deleted successfully", sev: "success" }));
      refetch();
      setRecord({ ...newActiveIngredientAdverseEffects });
    } catch {
      dispatch(notify({ msg: "Delete failed", sev: "error" }));
    }
  };

  // ---------------------------
  // PAGINATION (Same as Indications)
  // ---------------------------
  const [pagination, setPagination] = useState({
    page: 0,
    size: 5
  });

  const page = pagination.page;
  const rowsPerPage = pagination.size;

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  }, [data, page, rowsPerPage]);

  const totalCount = data.length;

  // ---------------------------
  // RENDER
  // ---------------------------


  console.log("LovData: ", lovData);

  return (
    <Panel>
      <Form fluid>
        <div className="container-of-actions-header-active">
          <div className="container-of-fields-active">
            <MyInput
              fieldName="adverseEffect"
              fieldType="select"
              placeholder="Select Effect"
              record={record}
              setRecord={setRecord}
              selectData={lovData?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="lovDisplayVale"
              width={220}
              menuMaxHeight={150}
            />

            {record.adverseEffect === "Other" && (
              <MyInput
                fieldName="otherDescription"
                record={record}
                setRecord={setRecord}
                width={200}
              />
            )}
          </div>

          <div className="container-of-buttons-active">
            <MyButton
              prefixIcon={() => <MdSave />}
              color="var(--deep-blue)"
              title="Save"
              onClick={save}
            />

            <MyButton
              prefixIcon={() => <Plus />}
              color="var(--deep-blue)"
              title="New"
              onClick={() =>
                setRecord({ ...newActiveIngredientAdverseEffects })
              }
            />
          </div>
        </div>
      </Form>

      <MyTable
        height={450}
        data={paginatedData}
        loading={isFetching}
        columns={columns}
        onRowClick={(row) => setRecord(row)}
        rowClassName={(row) =>
          row.id === record.id ? "selected-row" : ""
        }
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(e, newPage) =>
          setPagination({ ...pagination, page: newPage })
        }
        onRowsPerPageChange={(e) => {
          const newSize = Number(e.target.value);
          setPagination({ page: 0, size: newSize });
        }}
      />

      <DeletionConfirmationModal
        open={openDelete}
        setOpen={setOpenDelete}
        itemToDelete="Adverse Effect"
        actionButtonFunction={remove}
        actionType="Delete"
      />
    </Panel>
  );
};

export default AdversEffects;
