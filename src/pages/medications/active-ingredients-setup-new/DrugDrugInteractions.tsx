import React, { useState, useMemo } from 'react';
import { Form, Text, Panel } from 'rsuite';
import { MdSave, MdDelete } from 'react-icons/md';
import { Plus } from '@rsuite/icons';

import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { conjureValueBasedOnIDFromList } from '@/utils';
import { useGetActiveIngredientQuery } from '@/services/medicationsSetupService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  useGetByActiveIngredientIdQuery,
  useCreateMutation,
  useUpdateMutation,
  useDeleteMutation
} from '@/services/setup/activeIngredients/activeIngredientDrugInteractionService';

import {
  newActiveIngredientDrugInteraction
} from '@/types/model-types-constructor-new';

import './styles.less';
import { useGetActiveIngredientsQuery } from '@/services/setup/activeIngredients/activeIngredientsService';

const DrugDrugInteractions = ({ selectedActiveIngredients }) => {
  const dispatch = useAppDispatch();

  // ---------------------------
  // STATE
  // ---------------------------
  const [record, setRecord] = useState({
    ...newActiveIngredientDrugInteraction
  });

  const [openDelete, setOpenDelete] = useState(false);

  // ---------------------------
  // LOVs
  // ---------------------------

  const { data: activeIngredientResponse } = useGetActiveIngredientsQuery({
    page: 0,
    size: 1000
  });


  // Severity LOV
  const { data: severityLovQueryResponseData } =
    useGetLovValuesByCodeQuery('SEVERITY');

  // ---------------------------
  // API
  // ---------------------------
  const {
    data: list = [],
    isFetching,
    refetch
  } = useGetByActiveIngredientIdQuery(selectedActiveIngredients?.id, {
    skip: !selectedActiveIngredients?.id,
  });

  const [createInteraction] = useCreateMutation();
  const [updateInteraction] = useUpdateMutation();
  const [deleteInteraction] = useDeleteMutation();

  // ---------------------------
  // TABLE COLUMNS
  // ---------------------------
  const columns = [
    {
  key: 'interactedIngredientId',
  title: <Translate>Interacted Ingredient</Translate>,
  render: row => (
    <Text>
      {conjureValueBasedOnIDFromList(
        activeIngredientResponse?.data ?? [],
        row.interactedIngredientId,
        'name'
      )}
    </Text>
  )
    },
    {
      key: 'severity',
      title: <Translate>Severity</Translate>,
      render: row => <Text>{row.severity}</Text>
    },
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      render: row => <Text>{row.description}</Text>
    },
    {
      key: 'icons',
      title: '',
      render: row => (
        <MdDelete
          size={24}
          fill="var(--primary-pink)"
          className="icons-style"
          onClick={() => {
            setRecord(row);
            setOpenDelete(true);
          }}
        />
      )
    }
  ];



  // ---------------------------
  // SAVE
  // ---------------------------
  const save = async () => {
      if (!selectedActiveIngredients || !selectedActiveIngredients.id) {
        dispatch(notify({ msg: "No Active Ingredient selected", sev: "error" }));
        return;
      }

      if (!record?.interactedIngredientId) {
        dispatch(notify({ msg: "Select Active Ingredient", sev: "error" }));
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
          await updateInteraction(payload).unwrap();
          dispatch(notify({ msg: "Updated successfully", sev: "success" }));
        } else {
          await createInteraction(payload).unwrap();
          dispatch(notify({ msg: "Added successfully", sev: "success" }));
        }

        refetch();
        setRecord({ ...newActiveIngredientDrugInteraction });

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
    await deleteInteraction(record.id).unwrap();
    dispatch(notify({ msg: "Deleted successfully", sev: "success" }));
    refetch();
    setRecord({ ...newActiveIngredientDrugInteraction });
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
            fieldLabel="Active Ingredient"
            fieldName="interactedIngredientId"
            fieldType="select"
            selectData={activeIngredientResponse?.data ?? []}
            selectDataLabel="name"
            selectDataValue="id"
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
              prefixIcon={() => <Plus />}
              onClick={() => setRecord({ ...newActiveIngredientDrugInteraction })}
              title="New"
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
          onRowClick={row => {
            const normalizedId = row.id ?? row.Id ?? row.ID ?? null;

            setRecord({
              ...row,
              id: normalizedId
            });
          }}
          rowClassName={row => {
            const rowId = row.id ?? row.Id ?? row.ID ?? null;
            const selectedId = record.id ?? null;

            return rowId === selectedId ? "selected-row" : "";
          }}
          page={pagination.page}
          rowsPerPage={pagination.size}
          totalCount={totalCount}
          onPageChange={(_, newPage) => setPagination({ ...pagination, page: newPage })}
          onRowsPerPageChange={e =>
            setPagination({ page: 0, size: Number(e.target.value) })
          }
        />

        <DeletionConfirmationModal
          open={openDelete}
          setOpen={setOpenDelete}
          itemToDelete="Drug Interaction"
          actionButtonFunction={remove}
          actionType="Delete"
        />

      </Form>
    </Panel>
  );
};

export default DrugDrugInteractions;
