import React, { useState, useMemo } from "react";
import { Form, Text } from "rsuite";
import { MdDelete, MdSave, MdModeEdit } from "react-icons/md";
import { Plus } from "@rsuite/icons";
import MyInput from "@/components/MyInput";
import MyButton from "@/components/MyButton/MyButton";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import { newActiveIngredientPreRequestedTest } from "@/types/model-types-constructor-new";
import { useGetAllDiagnosticTestsQuery } from "@/services/setup/diagnosticTest/diagnosticTestService";
import {
  useGetActiveIngredientPreRequestedTestsQuery,
  useCreateActiveIngredientPreRequestedTestMutation,
  useUpdateActiveIngredientPreRequestedTestMutation,
  useDeleteActiveIngredientPreRequestedTestMutation
} from "@/services/setup/activeIngredients/activeIngredientPreRequestedTestService";

import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";

const PreRequestedTests = ({ activeIngredient }) => {

  const dispatch = useAppDispatch();

  const [record, setRecord] = useState({ ...newActiveIngredientPreRequestedTest });
  const [openDelete, setOpenDelete] = useState(false);

  // Fetch diagnostic tests list responsive
  const { data: diagnosticTestsResult } = useGetAllDiagnosticTestsQuery({
    page: 0,
    size: 9999,
  });

  const diagnosticTests = diagnosticTestsResult?.data ?? [];

  // -------------------------------
  // Pagination + Sorting
  // -------------------------------
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortColumn, setSortColumn] = useState("id");
  const [sortType, setSortType] = useState("asc");

  // Load list of assigned tests
  const { data: list = [], isFetching, refetch } =
    useGetActiveIngredientPreRequestedTestsQuery(activeIngredient?.id, {
      skip: !activeIngredient?.id,
    });

  const [createItem] = useCreateActiveIngredientPreRequestedTestMutation();
  const [updateItem] = useUpdateActiveIngredientPreRequestedTestMutation();
  const [deleteItem] = useDeleteActiveIngredientPreRequestedTestMutation();

  // -------------------------------
  // Sorting
  // -------------------------------
  const sortedList = useMemo(() => {
    if (!sortColumn) return list;

    return [...list].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal == null) return -1;
      if (bVal == null) return 1;

      let result = typeof aVal === "string"
        ? aVal.localeCompare(bVal)
        : aVal > bVal ? 1 : -1;

      return sortType === "asc" ? result : -result;
    });
  }, [list, sortColumn, sortType]);

  // -------------------------------
  // Pagination
  // -------------------------------
  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedList.slice(start, start + rowsPerPage);
  }, [sortedList, page, rowsPerPage]);

  // -------------------------------
  // SAVE
  // -------------------------------
  const save = async () => {
    if (!activeIngredient?.id) {
      dispatch(notify({ msg: "Active ingredient is not selected!", sev: "error" }));
      return;
    }

    if (!record.testId) {
      dispatch(notify({ msg: "Please select a diagnostic test!", sev: "warning" }));
      return;
    }

    const { Id, ID, ...cleanRecord } = record;

    const payload = {
      ...cleanRecord,
      activeIngredientId: activeIngredient.id,
      testId: cleanRecord.testId,
    };

    try {
      if (record.id) {
        await updateItem(payload).unwrap();
        dispatch(notify({ msg: "Updated successfully!", sev: "success" }));
      } else {
        await createItem(payload).unwrap();
        dispatch(notify({ msg: "Created successfully!", sev: "success" }));
      }

      refetch();
      setRecord({ ...newActiveIngredientPreRequestedTest });

    } catch (err) {
      console.log("Save error:", err);
      dispatch(notify({ msg: "Save failed!", sev: "error" }));
    }
  };


  // -------------------------------
  // DELETE
  // -------------------------------
  const remove = async () => {
    setOpenDelete(false);

    if (!record.id) {
      dispatch(notify({ msg: "No test selected!", sev: "warning" }));
      return;
    }

    try {
      await deleteItem(record.id).unwrap();
      dispatch(notify({ msg: "Deleted successfully!", sev: "success" }));

      refetch();
      setRecord({ ...newActiveIngredientPreRequestedTest });

    } catch (err) {
      console.log("Delete error:", err);
      dispatch(notify({ msg: "Delete failed!", sev: "error" }));
    }
  };

  // -------------------------------
  // Selected row
  // -------------------------------
const isSelected = (row) => {
  const rowId = row.id ?? row.Id ?? row.ID;
  return Number(rowId) === Number(record.id) ? "selected-row" : "";
};

  // -------------------------------
  // Table Columns
  // -------------------------------
  const columns = [
    {
      key: "testId",
      title: <Translate>Test</Translate>,
      sortable: true,
      render: (row) => {
        const test = diagnosticTests.find(t => t.id === row.testId);
        return <Text>{test?.name}</Text>;
      },
    },
      {
        key: "icons",
        title: "",
        render: (row) => (
          <div className="container-of-icons">
            <MdModeEdit
              className="icons-style"
              size={24}
              fill="var(--primary-gray)"
              onClick={() => setRecord(row)}
            />

            <MdDelete
              className="icons-style"
              size={24}
              fill="var(--primary-pink)"
              onClick={() => {
                setRecord(row);
                setOpenDelete(true);
              }}
          />
        </div>
      ),
    },
  ];

  return (
    <Form fluid>

      {/* ------- HEADER ------- */}
      <div className="container-of-header-actions-pre-requested-tests">

        <MyInput
          width={200}
          fieldName="testId"
          fieldType="select"
          selectData={diagnosticTests}
          selectDataLabel="name"
          selectDataValue="id"
          record={record}
          setRecord={setRecord}
          menuMaxHeight={100}
        />

        <MyButton
          prefixIcon={() => <MdSave />}
          width="80px"
          onClick={save}
        >
          Save
        </MyButton>

        <MyButton
          prefixIcon={() => <Plus />}
          width="80px"
          onClick={() => setRecord({ ...newActiveIngredientPreRequestedTest })}
        >
          New
        </MyButton>

      </div>

      {/* ------- TABLE ------- */}
      <MyTable
        height={450}
        data={paginatedData}
        loading={isFetching}
        columns={columns}
        rowClassName={isSelected}
        onRowClick={(row) => {
          const rowId = row.id ?? row.Id ?? row.ID;
          setRecord({ ...row, id: rowId });
        }}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={(col, type) => {
          setSortColumn(col);
          setSortType(type);
        }}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={list.length}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(Number(e.target.value));
          setPage(0);
        }}
      />

      {/* ------- DELETE MODAL ------- */}
      <DeletionConfirmationModal
        open={openDelete}
        setOpen={setOpenDelete}
        itemToDelete="Test"
        actionButtonFunction={remove}
        actionType="Delete"
      />

    </Form>
  );
};

export default PreRequestedTests;
