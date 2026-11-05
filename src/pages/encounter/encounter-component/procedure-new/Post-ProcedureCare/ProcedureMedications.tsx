import MyButton from '@/components/MyButton/MyButton';
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
import { useGetAllActiveIngredientsQuery } from '@/services/setup/activeIngredients/activeIngredientsService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { Col, Form, Input, Row, Text, Tooltip, Whisper } from 'rsuite';

type ProcedureMedicationsProps = {
  procedureId?: number;
};

const ProcedureMedications: React.FC<ProcedureMedicationsProps> = ({ procedureId }) => {
  const dispatch = useAppDispatch();
  const [selectedIngredients, setSelectedIngredients] = useState<any>({ ids: [] });
  const [rows, setRows] = useState<any[]>([]);

  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
  const { data: ingredientsResponse } = useGetAllActiveIngredientsQuery({ page: 0, size: 1000 });
  const { data: savedMedications } = useGetProcedureMedicationsQuery(procedureId as number, {
    skip: !procedureId
  });
  const [addMedication] = useAddProcedureMedicationMutation();
  const [updateMedication] = useUpdateProcedureMedicationMutation();
  const [deleteMedication] = useDeleteProcedureMedicationMutation();

  const ingredients = ingredientsResponse?.data ?? [];

  useEffect(() => {
    setRows(savedMedications ?? []);
  }, [savedMedications]);

  const changedRows = rows.filter(row => row.isDirty);

  const handleRowChange = (index: number, field: string, value: any) => {
    setRows(prev =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value, isDirty: true } : row))
    );
  };

  const handleAddIngredients = () => {
    const ids = selectedIngredients?.ids;
    if (!Array.isArray(ids)) return;
    setRows(prev => [
      ...prev,
      ...ids.map(activeIngredientId => ({ activeIngredientId, isDirty: true }))
    ]);
    setSelectedIngredients({ ids: [] });
  };

  const handleSaveChanges = async () => {
    try {
      await Promise.all(
        changedRows.map(({ id, activeIngredientId, dose, unit }) => {
          const body = { activeIngredientId, dose, unit };
          return id
            ? updateMedication({ id: procedureId as number, medicationId: id, body }).unwrap()
            : addMedication({ id: procedureId as number, body }).unwrap();
        })
      );
      dispatch(notify({ msg: 'Changes saved successfully', sev: 'success' }));
    } catch {
      dispatch(notify({ msg: 'Failed to save changes', sev: 'error' }));
    }
  };

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
      render: (rowData: any) =>
        ingredients.find((item: any) => item.id === rowData.activeIngredientId)?.name
    },
    {
      key: 'dose',
      title: <Translate>Dose</Translate>,
      width: 150,
      render: (rowData: any, index: number) => (
        <Input
          type="number"
          value={rowData.dose ?? ''}
          onChange={value => handleRowChange(index, 'dose', Number(value))}
          style={{ width: '100%' }}
        />
      )
    },
    {
      key: 'unit',
      title: <Translate>Unit</Translate>,
      width: 200,
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
        <Row>
          <Col md={24}>
            <Row className="rows-gap">
              <Col md={10}>
                <Form fluid>
                  <MyInput
                    width="100%"
                    placeholder="Select Ingredient"
                    showLabel={false}
                    selectData={ingredients}
                    fieldType="multyPicker"
                    selectDataLabel="name"
                    selectDataValue="id"
                    fieldName="ids"
                    record={selectedIngredients}
                    setRecord={setSelectedIngredients}
                  />
                </Form>
              </Col>
              <Col md={4}>
                <MyButton onClick={handleAddIngredients}>Add</MyButton>
              </Col>
              <Col md={4}>
                <MyButton
                  appearance="primary"
                  disabled={!changedRows.length}
                  onClick={handleSaveChanges}
                >
                  Save Changes
                </MyButton>
              </Col>
            </Row>
            <MyTable height={200} data={rows} columns={columns} />
          </Col>
        </Row>
      }
    />
  );
};

export default ProcedureMedications;
