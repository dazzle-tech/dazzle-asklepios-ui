import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useAddProcedureMedicationMutation,
  useDeleteProcedureMedicationMutation,
  useGetProcedureMedicationsQuery,
  useUpdateProcedureMedicationMutation
} from '@/services/patients/patientProcedureService';
import {
  useGetActiveIngredientsActiveByNameQuery,
  useGetActiveIngredientsByIdsMutation
} from '@/services/setup/activeIngredients/activeIngredientsService';
import { useSortedLovQuery } from '../useSortedLovQuery';
import { notify } from '@/utils/uiReducerActions';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Form, Text, Tooltip, Whisper } from 'rsuite';
import type { ProcedureStepHandle } from '../useStepForm';

const INGREDIENTS_PAGE_SIZE = 20;
// MyInput hides Load more while a search term is set, so a search asks for more at once
const INGREDIENTS_SEARCH_SIZE = 100;

type ProcedureMedicationsProps = {
  procedureId?: number;
  onDirtyChange?: (dirty: boolean) => void;
};

const ProcedureMedications = forwardRef<ProcedureStepHandle, ProcedureMedicationsProps>(
  ({ procedureId, onDirtyChange }, ref) => {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [options, setOptions] = useState<any[]>([]);
  const [ingredientNames, setIngredientNames] = useState<Record<number, string>>({});
  const [rows, setRows] = useState<any[]>([]);

  const { data: unitLovQueryResponse } = useSortedLovQuery('UOM');
  const { data: ingredientPage, isFetching: isLoadingIngredients } =
    useGetActiveIngredientsActiveByNameQuery({
      name: search,
      page,
      size: search ? INGREDIENTS_SEARCH_SIZE : INGREDIENTS_PAGE_SIZE,
      sort: 'name,asc'
    });
  const [getIngredientsByIds] = useGetActiveIngredientsByIdsMutation();
  const { data: savedMedications } = useGetProcedureMedicationsQuery(procedureId as number, {
    skip: !procedureId
  });
  const [addMedication] = useAddProcedureMedicationMutation();
  const [updateMedication] = useUpdateProcedureMedicationMutation();
  const [deleteMedication] = useDeleteProcedureMedicationMutation();

  useEffect(() => {
    if (!ingredientPage) return;
    setOptions(prev => {
      const loaded = ingredientPage.data ?? [];
      if (page === 0) return loaded;
      return [...prev, ...loaded.filter(item => !prev.some(option => option.id === item.id))];
    });
  }, [ingredientPage]);

  useEffect(() => {
    setRows((savedMedications ?? []).slice().reverse());
    const missingIds = (savedMedications ?? [])
      .map(row => row.activeIngredientId)
      .filter(id => !ingredientNames[id]);
    if (!missingIds.length) return;
    getIngredientsByIds(missingIds)
      .unwrap()
      .then(found =>
        setIngredientNames(prev => ({
          ...prev,
          ...Object.fromEntries(found.map(item => [item.id, item.name]))
        }))
      )
      .catch(() => dispatch(notify({ msg: 'Failed to load ingredient names', sev: 'error' })));
  }, [savedMedications]);

  const changedRows = rows.filter(row => row.isDirty);
  const hasChanges = changedRows.length > 0;

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const handleRowChange = (index: number, field: string, value: any) => {
    setRows(prev =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value, isDirty: true } : row))
    );
  };

  const availableOptions = options.filter(
    option => !rows.some(row => row.activeIngredientId === option.id)
  );

  const handleSearch = (keyword: string) => {
    setPage(0);
    setSearch(keyword);
  };

  const handlePickIngredient = (item: any) => {
    if (!item) return;
    setIngredientNames(prev => ({ ...prev, [item.id]: item.name }));
    setRows(prev => [{ activeIngredientId: item.id, isDirty: true }, ...prev]);
  };

  useImperativeHandle(ref, () => ({
    save: async () => {
      try {
        await Promise.all(
          changedRows.map(({ id, activeIngredientId, dose, unit }) => {
            const body = { activeIngredientId, dose: dose === '' ? null : dose, unit };
            return id
              ? updateMedication({ id: procedureId as number, medicationId: id, body }).unwrap()
              : addMedication({ id: procedureId as number, body }).unwrap();
          })
        );
        return true;
      } catch {
        dispatch(notify({ msg: 'Failed to save medications', sev: 'error' }));
        return false;
      }
    }
  }));

  const handleDelete = async (row: any, index: number) => {
    if (!row.id) {
      setRows(prev => prev.filter((_, i) => i !== index));
      return;
    }
    try {
      await deleteMedication({ id: procedureId as number, medicationId: row.id }).unwrap();
    } catch {
      dispatch(notify({ msg: 'Delete failed', sev: 'error' }));
    }
  };

  const columns = [
    {
      key: 'name',
      title: <Translate>Active Ingredient</Translate>,
      render: (rowData: any) => ingredientNames[rowData.activeIngredientId]
    },
    {
      key: 'dose',
      title: <Translate>Dose</Translate>,
      render: (rowData: any, index: number) => (
        <Form fluid>
          <MyInput
            width="100%"
            fieldType="number"
            allowDecimal
            fieldName="dose"
            record={rowData}
            setRecord={(record: any) => {
              if (record.dose !== rowData.dose) handleRowChange(index, 'dose', record.dose);
            }}
            showLabel={false}
          />
        </Form>
      )
    },
    {
      key: 'unit',
      title: <Translate>Unit</Translate>,
      render: (rowData: any, index: number) => (
        <Form fluid>
          <MyInput
            width="100%"
            fieldType="select"
            fieldName="unit"
            selectData={unitLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            disableByField="isValid"
            selectDataValue="lovDisplayVale"
            record={rowData}
            setRecord={(record: any) => handleRowChange(index, 'unit', record.unit)}
            showLabel={false}
          />
        </Form>
      )
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      align: 'center',
      render: (rowData: any, index: number) => (
        <Whisper placement="top" trigger="hover" speaker={<Tooltip>Delete</Tooltip>}>
          <FontAwesomeIcon
            icon={faTrash}
            color="red"
            style={{ cursor: 'pointer' }}
            onClick={() => handleDelete(rowData, index)}
          />
        </Whisper>
      )
    }
  ];

  return (
    <SectionContainer
      title={<Text>Administered Medications</Text>}
      content={
        <>
          <Form fluid className="procedure-picker-row">
            <MyInput
              width="100%"
              placeholder="Search Ingredient"
              showLabel={false}
              fieldType="selectPagination"
              selectData={availableOptions}
              selectDataLabel="name"
              selectDataValue="id"
              fieldName="ingredientId"
              record={{ ingredientId: null }}
              setRecord={() => undefined}
              onSelectItem={handlePickIngredient}
              searchable
              searchKeyWard={search}
              setSearchKeyWard={handleSearch}
              hasMore={options.length < (ingredientPage?.totalCount ?? 0)}
              onFetchMore={() => setPage(current => current + 1)}
              loading={isLoadingIngredients}
              cleanable={false}
            />
          </Form>
          {rows.length > 0 && (
            <div className="procedure-compact-table">
              <MyTable height="25vh" data={rows} columns={columns} />
            </div>
          )}
        </>
      }
    />
  );
  }
);

export default ProcedureMedications;
