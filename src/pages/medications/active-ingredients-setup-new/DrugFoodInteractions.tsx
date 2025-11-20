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
  useGetFoodInteractionsByActiveIngredientIdQuery,
  useCreateFoodInteractionMutation,
  useUpdateFoodInteractionMutation,
  useDeleteFoodInteractionMutation
} from "@/services/setup/activeIngredients/ActiveIngredientFoodInteraction";


import {
  newActiveIngredientFoodInteraction
} from "@/types/model-types-constructor-new";

import { useGetLovValuesByCodeQuery } from "@/services/setupService";

import "./styles.less";
import { Block } from "@mui/icons-material";

const DrugFoodInteractions = ({ selectedActiveIngredients }) => {
  const dispatch = useAppDispatch();

  // ---------------------------
  // STATE
  // ---------------------------
  const [record, setRecord] = useState({
    ...newActiveIngredientFoodInteraction,
  });
  const [sortColumn, setSortColumn] = useState("food");
  const [sortType, setSortType] = useState<"asc" | "desc">("asc");

  const [openDelete, setOpenDelete] = useState(false);

  // ---------------------------
  // LOVs
  // ---------------------------

  const { data: severityLovQueryResponseData } =
    useGetLovValuesByCodeQuery("SEVERITY");

  // ---------------------------
  // API
  // ---------------------------
  const {
    data: list = [],
    isFetching,
    refetch,
  } = useGetFoodInteractionsByActiveIngredientIdQuery(
    selectedActiveIngredients?.id,
    { skip: !selectedActiveIngredients?.id }
  );

  const [createFoodInteraction] = useCreateFoodInteractionMutation();
  const [updateFoodInteraction] = useUpdateFoodInteractionMutation();
  const [deleteFoodInteraction] = useDeleteFoodInteractionMutation();

  // ---------------------------
  // TABLE COLUMNS
  // ---------------------------
  const columns = [
    {
      key: "food",
      title: <Translate>Food</Translate>,
      render: (row) => <Text>{row.food}</Text>,
    },
    {
      key: "severity",
      title: <Translate>Severity</Translate>,
      render: (row) => <Text>{row.severity}</Text>,
    },
    {
      key: "description",
      title: <Translate>Description</Translate>,
      render: (row) => <Text>{row.description}</Text>,
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
    if (!selectedActiveIngredients || !selectedActiveIngredients.id) {
      dispatch(notify({ msg: "No Active Ingredient selected", sev: "error" }));
      return;
    }

    if (!record?.food || record.food.trim() === "") {
      dispatch(notify({ msg: "Please enter Food name", sev: "error" }));
      return;
    }

    if (!record?.severity) {
      dispatch(notify({ msg: "Select Severity", sev: "error" }));
      return;
    }

    if (!record?.description || record.description.trim() === "") {
      dispatch(notify({ msg: "Please Enter A Description", sev: "error" }));
      return;
    }

    const payload = {
      ...record,
      id: record.id ?? record.Id ?? record.ID ?? null,
      activeIngredientId: selectedActiveIngredients.id,
    };

    delete payload.Id;
    delete payload.ID;

    try {
      if (payload.id) {
        await updateFoodInteraction(payload).unwrap();
        dispatch(notify({ msg: "Updated successfully", sev: "success" }));
      } else {
        await createFoodInteraction(payload).unwrap();
        dispatch(notify({ msg: "Added successfully", sev: "success" }));
      }

      refetch();
      setRecord({ ...newActiveIngredientFoodInteraction });
    } catch (e) {
      console.error("SAVE ERROR:", e);
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
      await deleteFoodInteraction(record.id).unwrap();
      dispatch(notify({ msg: "Deleted successfully", sev: "success" }));
      refetch();
      setRecord({ ...newActiveIngredientFoodInteraction });
    } catch {
      dispatch(notify({ msg: "Delete failed", sev: "error" }));
    }
  };

  // ---------------------------
  // PAGINATION
  // ---------------------------

  // 📌 SORTING IMPLEMENTATION
  const sortedList = useMemo(() => {
    if (!list || !sortColumn) return list ?? [];

    return [...list].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal == null) return -1;
      if (bVal == null) return 1;

      let result = 0;

      if (typeof aVal === "string") {
        result = aVal.toString().localeCompare(bVal.toString(), undefined, { numeric: true });
      } else {
        result = aVal > bVal ? 1 : -1;
      }

      return sortType === "asc" ? result : -result;
    });
  }, [list, sortColumn, sortType]);


  const [pagination, setPagination] = useState({ page: 0, size: 5 });

  const paginatedData = useMemo(() => {
    const start = pagination.page * pagination.size;
    return sortedList.slice(start, start + pagination.size);
  }, [sortedList, pagination.page, pagination.size]);

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
              fieldLabel="Food"
              fieldName="food"
              fieldType="text"
              record={record}
              setRecord={setRecord}
              width={220}
              required
            />

            <MyInput
              fieldType="select"
              selectData={severityLovQueryResponseData?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="lovDisplayVale"
              fieldName="severity"
              width={180}
              fieldLabel="Severity"
              record={record}
              setRecord={setRecord}
              required
            />
          </div>

          <div className="container-of-buttons-active">
            <MyButton
              prefixIcon={() => <MdSave />}
              onClick={save}
              title="Save"
              color="var(--deep-blue)"
            />

            <MyButton
              prefixIcon={() => <Block style={{width:'15px',height:'15px'}} />}
              onClick={() => setRecord({ ...newActiveIngredientFoodInteraction })}
              title="Clear"
              color="var(--deep-blue)"
            />
          </div>
        </div>

        <MyInput
          width="100%"
          fieldName="description"
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
            const normalizedId = row.id ?? row.Id ?? row.ID ?? null;

            setRecord({
              ...row,
              id: normalizedId,
            });
          }}
          rowClassName={(row) => {
            const rowId = row.id ?? row.Id ?? row.ID ?? null;
            const selectedId = record.id ?? null;

            return rowId === selectedId ? "selected-row" : "";
          }}
          page={pagination.page}
          rowsPerPage={pagination.size}
          totalCount={totalCount}
          onPageChange={(_, p) => setPagination({ ...pagination, page: p })}
          onRowsPerPageChange={(e) =>
            setPagination({ page: 0, size: Number(e.target.value) })
          }
          sortColumn={sortColumn}
          sortType={sortType}
          onSortChange={(col, order) => {
            setSortColumn(col);
            setSortType(order);
          }}
        />

        <DeletionConfirmationModal
          open={openDelete}
          setOpen={setOpenDelete}
          itemToDelete="Food Interaction"
          actionButtonFunction={remove}
          actionType="Delete"
        />
      </Form>
    </Panel>
  );
};

export default DrugFoodInteractions;
