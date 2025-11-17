import React, { useState, useMemo } from "react";
import { Form, Text, Panel } from "rsuite";
import { MdSave, MdDelete } from "react-icons/md";
import { Plus } from "@rsuite/icons";

import Translate from "@/components/Translate";
import MyTable from "@/components/MyTable";
import MyInput from "@/components/MyInput";
import MyButton from "@/components/MyButton/MyButton";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";

import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";

import {
  useGetActiveIngredientSpecialPopulationsQuery,
  useCreateActiveIngredientSpecialPopulationMutation,
  useUpdateActiveIngredientSpecialPopulationMutation,
  useDeleteActiveIngredientSpecialPopulationMutation
} from "@/services/setup/activeIngredients/activeIngredientSpecialPopulationService";

import { newActiveIngredientSpecialPopulation } from "@/types/model-types-constructor-new";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";

import "./styles.less";
import { conjureValueBasedOnKeyFromList } from "@/utils";

const SpecialPopulation = ({ selectedActiveIngredients }) => {
  const dispatch = useAppDispatch();

  // ---------------------------
  // STATE
  // ---------------------------
  const [record, setRecord] = useState({
    ...newActiveIngredientSpecialPopulation,
  });

  const [openDelete, setOpenDelete] = useState(false);

  // ---------------------------
  // LOVs
  // ---------------------------
  const { data: specialLov } = useGetLovValuesByCodeQuery("SPECIAL_POPULATION_GROUPS");

  // ---------------------------
  // API
  // ---------------------------
  const {
    data: list = [],
    isFetching,
    refetch,
  } = useGetActiveIngredientSpecialPopulationsQuery(
    selectedActiveIngredients?.id,
    { skip: !selectedActiveIngredients?.id }
  );

  const [createSP] = useCreateActiveIngredientSpecialPopulationMutation();
  const [updateSP] = useUpdateActiveIngredientSpecialPopulationMutation();
  const [deleteSP] = useDeleteActiveIngredientSpecialPopulationMutation();

  // ---------------------------
  // TABLE COLUMNS
  // ---------------------------
  const columns = [
    {
      key: "specialPopulation",
      title: <Translate>Special Population</Translate>,
      render: (row) => (
        <Text>
          {conjureValueBasedOnKeyFromList(
            specialLov?.object ?? [],
            row?.additionalPopulation,
            "lovDisplayVale"
          )}
        </Text>
      ),
    },
    {
      key: "considerations",
      title: <Translate>Considerations</Translate>,
      render: (row) => <Text>{row.considerations}</Text>,
    },
    {
      key: "icons",
      title: "",
      render: (row) => (
        <MdDelete
          size={24}
          fill="var(--primary-pink)"
          className="icons-style"
          onClick={() => {
            setRecord(row);
            setOpenDelete(true);
          }}
        />
      ),
    },
  ];


  // ---------------------------
  // SAVE
  // ---------------------------
  const save = async () => {
    if (!selectedActiveIngredients?.id) {
      dispatch(notify({ msg: "No Active Ingredient selected", sev: "error" }));
      return;
    }

    if (!record.specialPopulation) {
      dispatch(notify({ msg: "Select Special Population", sev: "error" }));
      return;
    }

    if (!record.considerations || record.considerations.trim() === "") {
      dispatch(notify({ msg: "Considerations is required", sev: "error" }));
      return;
    }


    const payload: any = {
      id: record.id ?? record.Id ?? record.ID ?? null,
      activeIngredientId: selectedActiveIngredients.id,
      additionalPopulation: record.specialPopulation,
      considerations: record.considerations,
    };

    delete payload.Id;
    delete payload.ID;

    try {
      if (payload.id) {
        await updateSP(payload).unwrap();
        dispatch(notify({ msg: "Updated successfully", sev: "success" }));
      } else {
        await createSP(payload).unwrap();
        dispatch(notify({ msg: "Added successfully", sev: "success" }));
      }

      refetch();
      setRecord({ ...newActiveIngredientSpecialPopulation });

    } catch (err) {
      dispatch(notify({ msg: "Save failed", sev: "error" }));
    }
  };



  // ---------------------------
  // DELETE
  // ---------------------------
  const remove = async () => {
    setOpenDelete(false);

    if (!record?.id) {
      dispatch(notify({ msg: "Invalid item", sev: "error" }));
      return;
    }

    try {
      await deleteSP(record.id).unwrap();
      dispatch(notify({ msg: "Deleted successfully", sev: "success" }));
      refetch();
      setRecord({ ...newActiveIngredientSpecialPopulation });
    } catch {
      dispatch(notify({ msg: "Delete failed", sev: "error" }));
    }
  };

  // ---------------------------
  // PAGINATION
  // ---------------------------
  const [pagination, setPagination] = useState({ page: 0, size: 5 });

  const paginatedData = useMemo(() => {
    const start = pagination.page * pagination.size;
    return list.slice(start, start + pagination.size);
  }, [list, pagination.page, pagination.size]);

  const totalCount = list.length;

  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <Panel>
      <Form fluid>
        <div className="container-of-actions-header-active">
          <div className="container-of-fields-active">
            <MyInput
              fieldType="select"
              selectData={specialLov?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              fieldName="specialPopulation"
              record={record}
              setRecord={setRecord}
              required
            />
          </div>

          <div className="container-of-buttons-active">
            <MyButton
              prefixIcon={() => <MdSave />}
              title="Save"
              onClick={save}
              color="var(--deep-blue)"
            />
            <MyButton
              prefixIcon={() => <Plus />}
              title="New"
              color="var(--deep-blue)"
              onClick={() => setRecord({ ...newActiveIngredientSpecialPopulation })}
            />
          </div>
        </div>

        <MyInput
          width="100%"
          fieldName="considerations"
          fieldType="textarea"
          record={record}
          setRecord={setRecord}
          required
        />

        <br />

        <MyTable
          height={450}
          data={paginatedData}
          loading={isFetching}
          columns={columns}
          onRowClick={(row) => {
            const id = row.id ?? row.Id ?? row.ID ?? null;

            setRecord({
              id,
              activeIngredientId: selectedActiveIngredients?.id ?? 0,
              considerations: row.considerations ?? "",
              specialPopulation: row.additionalPopulation ?? ""
            });
          }}
          rowClassName={(row) => {
            const r = row.id ?? row.Id ?? row.ID;
            const s = record.id ?? null;
            return r === s ? "selected-row" : "";
          }}
          page={pagination.page}
          rowsPerPage={pagination.size}
          totalCount={totalCount}
          onPageChange={(_, p) => setPagination({ ...pagination, page: p })}
          onRowsPerPageChange={(e) =>
            setPagination({ page: 0, size: Number(e.target.value) })
          }
        />

        <DeletionConfirmationModal
          open={openDelete}
          setOpen={setOpenDelete}
          itemToDelete="Special Population"
          actionButtonFunction={remove}
          actionType="Delete"
        />
      </Form>
    </Panel>
  );
};

export default SpecialPopulation;
