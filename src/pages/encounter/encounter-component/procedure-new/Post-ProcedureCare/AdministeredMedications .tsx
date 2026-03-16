import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { initialListRequest, ListRequest } from '@/types/types';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Col, Form, Input, Row, Text, Tooltip, Whisper } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetActiveIngredientQuery } from '@/services/medicationsSetupService';
import SectionContainer from '@/components/SectionsoContainer';
import './style.less';

const GenericAdministeredMedications = ({
  parentKey,
  filterFieldName,
  medicationService,
  newMedicationTemplate,
  title
}) => {
  const dispatch = useAppDispatch();

  const [selectedIngredientList, setSelectedIngredientList] = useState<any>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [updatedRows, setUpdatedRows] = useState<any[]>([]);

  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
  const { data: activeIngredients } = useGetActiveIngredientQuery({
    ...initialListRequest,
    pageSize: 1000
  });

  const toSnakeCase = (str: string) =>
    str.replace(/([A-Z])/g, '_$1').toLowerCase();

  const [listRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: toSnakeCase(filterFieldName),
        operator: 'match',
        value: parentKey
      }
    ]
  });

  const { data: medicationsList, refetch } =
    medicationService.useGetQuery(listRequest, {
      skip: !parentKey
    });

  const [saveMedication] = medicationService.useSaveMutation();

  useEffect(() => {
    setTableData(medicationsList?.object ?? []);
    setUpdatedRows([]);
  }, [medicationsList]);

  const markRowAsUpdated = (row: any) => {
    setUpdatedRows(prev => {
      const exists = prev.find(r => r.key === row.key);
      if (exists) {
        return prev.map(r => (r.key === row.key ? row : r));
      }
      return [...prev, row];
    });
  };

  const handleRowChange = (index: number, field: string, value: any) => {
    setTableData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      markRowAsUpdated(updated[index]);
      return updated;
    });
  };

  /** 🔹 ADD → LOCAL ONLY */
  const handleAddIngredients = () => {
    const keys = selectedIngredientList?.key;
    if (!Array.isArray(keys)) return;

    const newRows = keys.map(key => ({
      ...newMedicationTemplate,
      [filterFieldName]: parentKey,
      activeIngredientKey: key,
      isNew: true
    }));

    setTableData(prev => [...prev, ...newRows]);
    setUpdatedRows(prev => [...prev, ...newRows]);
    setSelectedIngredientList([]);
  };

  /** 🔹 SAVE EVERYTHING */
  const handleSaveChanges = async () => {
    try {
      await Promise.all(
        updatedRows.map(row => {
          const payload = { ...row };
          delete payload.isNew;
          return saveMedication(payload).unwrap();
        })
      );

      dispatch(notify({ msg: 'Changes saved successfully', sev: 'success' }));
      setUpdatedRows([]);
      refetch();
    } catch {
      dispatch(notify({ msg: 'Failed to save changes', sev: 'error' }));
    }
  };

  const columns = [
    {
      key: 'name',
      title: <Translate>Active Ingredient</Translate>,
      render: rowData =>
        activeIngredients?.object.find(
          item => item.key === rowData.activeIngredientKey
        )?.name
    },
    {
      key: 'dose',
      title: <Translate>Dose</Translate>,
      width: 150,
      render: (rowData, index) => (
        <Input
          type="number"
          value={rowData.dose}
          onChange={val => handleRowChange(index, 'dose', Number(val))}
          style={{ width: '100%' }}
        />
      )
    },
    {
      key: 'unit',
      title: <Translate>Unit</Translate>,
      width: 200,
      render: (rowData, index) => (
        <Form fluid>
          <MyInput
            width="100%"
            fieldType="select"
            fieldName="unitLkey"
            selectData={unitLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={rowData}
            setRecord={rec =>
              handleRowChange(index, 'unitLkey', rec.unitLkey)
            }
            showLabel={false}
          />
        </Form>
      )
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      align: 'center',
      render: (rowData, index) => (
        <Whisper placement="top" trigger="hover" speaker={<Tooltip>Delete</Tooltip>}>
          <FontAwesomeIcon
            icon={faTrash}
            color="red"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setTableData(prev => prev.filter((_, i) => i !== index));
              setUpdatedRows(prev =>
                prev.filter(r => r.key !== rowData.key)
              );
            }}
          />
        </Whisper>
      )
    }
  ];

  return (
    <SectionContainer
      title={<Text>{title}</Text>}
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
                    selectData={activeIngredients?.object ?? []}
                    fieldType="multyPicker"
                    selectDataLabel="name"
                    selectDataValue="key"
                    fieldName="key"
                    record={selectedIngredientList}
                    setRecord={setSelectedIngredientList}
                  />
                </Form>
              </Col>

              <Col md={4}>
                <MyButton onClick={handleAddIngredients}>
                  Add
                </MyButton>
              </Col>

              <Col md={4}>
                <MyButton
                  appearance="primary"
                  disabled={!updatedRows.length}
                  onClick={handleSaveChanges}
                >
                  Save Changes
                </MyButton>
              </Col>
            </Row>

            <MyTable
              height={200}
              data={tableData}
              columns={columns}
            />
          </Col>
        </Row>
      }
    />
  );
};

export default GenericAdministeredMedications;
