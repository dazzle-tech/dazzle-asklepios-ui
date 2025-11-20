import React, { useState, useMemo } from 'react';
import { Text, Form } from 'rsuite';
import { MdDelete, MdModeEdit, MdSave } from 'react-icons/md';
import { Plus } from '@rsuite/icons';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import {
  useGetActiveIngredientSynonymsQuery,
  useCreateActiveIngredientSynonymMutation,
  useUpdateActiveIngredientSynonymMutation,
  useDeleteActiveIngredientSynonymMutation
} from '@/services/setup/activeIngredients/activeIngredientSynonymsService';
import { newActiveIngredientSynonym } from '@/types/model-types-constructor-new';
import './styles.less';
import { Block } from '@mui/icons-material';

const Synonyms = ({ activeIngredients }) => {

  const dispatch = useAppDispatch();

  const [record, setRecord] = useState({ ...newActiveIngredientSynonym });
  const [openDelete, setOpenDelete] = useState(false);

  // Pagination + Sorting
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortColumn, setSortColumn] = useState("id");
  const [sortType, setSortType] = useState("asc");

  // Load list
  const { data: list = [], refetch, isFetching } =
    useGetActiveIngredientSynonymsQuery(activeIngredients?.id, {
      skip: !activeIngredients?.id,
    });

  const [createSynonym] = useCreateActiveIngredientSynonymMutation();
  const [updateSynonym] = useUpdateActiveIngredientSynonymMutation();
  const [deleteSynonym] = useDeleteActiveIngredientSynonymMutation();

  // SORTING IMPLEMENTATION
  const sortedList = useMemo(() => {
    if (!sortColumn) return list;

    return [...list].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal == null) return -1;
      if (bVal == null) return 1;

      let result = 0;
      if (typeof aVal === "string") {
        result = aVal.localeCompare(bVal);
      } else {
        result = aVal > bVal ? 1 : -1;
      }

      return sortType === "asc" ? result : -result;
    });
  }, [list, sortColumn, sortType]);

  // PAGINATION IMPLEMENTATION
  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedList.slice(start, end);
  }, [sortedList, page, rowsPerPage]);

  // Table columns
  const columns = [
    {
      key: 'synonym',
      title: <Translate>Synonym</Translate>,
      sortable: true,
      render: (row) => <Text>{row.synonym}</Text>,
    },
    {
      key: 'icons',
      title: '',
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

  // Save (Create or Update)
  const save = async () => {
    if (!record.synonym?.trim()) {
      dispatch(notify({ msg: "Please Enter Synonym", sev: "error" }));
      return;
    }

    const resolvedId = record.id ?? record.Id ?? record.ID ?? null;

    const payload = {
      id: resolvedId,
      synonym: record.synonym,
      activeIngredientId: activeIngredients.id,
    };

    try {
      if (payload.id) {
        await updateSynonym(payload).unwrap();
        dispatch(notify({ msg: "Updated successfully", sev: "success" }));
      } else {
        await createSynonym(payload).unwrap();
        dispatch(notify({ msg: "Added successfully", sev: "success" }));
      }

      refetch();
      setRecord({ ...newActiveIngredientSynonym });

    } catch (err) {
      dispatch(notify({ msg: "Failed to save Synonym", sev: "error" }));
      console.log("Error saving synonym:", err);
    }
  };

  // New
  const handleNew = () => {
    setRecord({ ...newActiveIngredientSynonym });
  };

  // Delete
  const remove = async () => {
    setOpenDelete(false);

    if (!record?.id) {
      dispatch(notify({ msg: "Invalid item", sev: "error" }));
      return;
    }

    try {
      await deleteSynonym(record.id).unwrap();
      dispatch(notify({ msg: "Deleted successfully", sev: "success" }));

      refetch();
      setRecord({ ...newActiveIngredientSynonym });

    } catch (err) {
      dispatch(notify({ msg: "Delete failed", sev: "error" }));
      console.log("Delete error:", err);
    }
  };

  if (!activeIngredients.hasSynonyms) {
    return <Text>Does not have synonyms</Text>;
  }

  const isSelected = (row) => {
    const rowId = row.id ?? row.Id ?? row.ID;
    return Number(rowId) === Number(record.id) ? "selected-row" : "";
  };

  return (
    <Form fluid>
      <div className="container-of-actions-header-active">
        <div className="container-of-fields-active">
          <MyInput
            fieldName="synonym"
            width="100%"
            record={record}
            setRecord={setRecord}
          />
        </div>

        <div className="container-of-buttons-active">
          <MyButton
            prefixIcon={() => <MdSave />}
            color="var(--deep-blue)"
            onClick={save}
            title="Save"
          />
          <MyButton
            prefixIcon={() => <Block style={{width:'15px',height:'15px'}} />}
            color="var(--deep-blue)"
            onClick={handleNew}
            title="Clear"
          />
        </div>
      </div>

      <br />

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

      <DeletionConfirmationModal
        open={openDelete}
        setOpen={setOpenDelete}
        itemToDelete="Synonym"
        actionButtonFunction={remove}
        actionType="Delete"
      />
    </Form>
  );
};

export default Synonyms;
