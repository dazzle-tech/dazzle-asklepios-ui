import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useAddProcedureComplicationMutation,
  useDeleteProcedureComplicationMutation,
  useGetProcedureComplicationsQuery,
  useUpdateProcedureComplicationMutation
} from '@/services/patients/patientProcedureService';
import { notify } from '@/utils/uiReducerActions';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Form, Input, Text } from 'rsuite';
import { useSortedLovQuery } from '../useSortedLovQuery';
import type { ProcedureStepHandle } from '../useStepForm';

type ProcedureComplicationsProps = {
  procedureId?: number;
  onDirtyChange?: (dirty: boolean) => void;
};

/** Complications of the procedure; rows are saved with the Performing step. */
const ProcedureComplications = forwardRef<ProcedureStepHandle, ProcedureComplicationsProps>(
  ({ procedureId, onDirtyChange }, ref) => {
    const dispatch = useAppDispatch();
    const [selected, setSelected] = useState<any>({ types: [] });
    const [rows, setRows] = useState<any[]>([]);

    const { data: complicationTypes } = useSortedLovQuery('PROC_COMPLIC');
    const { data: severities } = useSortedLovQuery('SEVERITY');
    const { data: savedComplications } = useGetProcedureComplicationsQuery(procedureId as number, {
      skip: !procedureId
    });
    const [addComplication] = useAddProcedureComplicationMutation();
    const [updateComplication] = useUpdateProcedureComplicationMutation();
    const [deleteComplication] = useDeleteProcedureComplicationMutation();

    useEffect(() => {
      setRows(savedComplications ?? []);
    }, [savedComplications]);

    const changedRows = rows.filter(row => row.isDirty);
    const hasChanges = changedRows.length > 0;

    useEffect(() => {
      onDirtyChange?.(hasChanges);
    }, [hasChanges, onDirtyChange]);

    const availableTypes = (complicationTypes?.object ?? []).filter(
      (type: any) => !rows.some(row => row.complicationType === type.lovDisplayVale)
    );

    const handleRowChange = (index: number, field: string, value: any) => {
      setRows(prev =>
        prev.map((row, i) => (i === index ? { ...row, [field]: value, isDirty: true } : row))
      );
    };

    const handleAdd = () => {
      const types = selected?.types;
      if (!Array.isArray(types)) return;
      setRows(prev => [
        ...prev,
        ...types.map(complicationType => ({ complicationType, isDirty: true }))
      ]);
      setSelected({ types: [] });
    };

    useImperativeHandle(ref, () => ({
      save: async () => {
        try {
          await Promise.all(
            changedRows.map(({ id, complicationType, severity, actionsTaken }) => {
              const body = { complicationType, severity, actionsTaken };
              return id
                ? updateComplication({
                    id: procedureId as number,
                    complicationId: id,
                    body
                  }).unwrap()
                : addComplication({ id: procedureId as number, body }).unwrap();
            })
          );
          return true;
        } catch {
          dispatch(notify({ msg: 'Failed to save complications', sev: 'error' }));
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
        await deleteComplication({
          id: procedureId as number,
          complicationId: row.id
        }).unwrap();
      } catch {
        dispatch(notify({ msg: 'Delete failed', sev: 'error' }));
      }
    };

    const columns = [
      {
        key: 'complicationType',
        title: <Translate>Complication</Translate>,
        render: (rowData: any) => rowData.complicationType
      },
      {
        key: 'severity',
        title: <Translate>Severity</Translate>,
        render: (rowData: any, index: number) => (
          <Form fluid>
            <MyInput
              width="100%"
              fieldType="select"
              fieldName="severity"
              selectData={severities?.object ?? []}
              selectDataLabel="lovDisplayVale"
              disableByField="isValid"
              selectDataValue="lovDisplayVale"
              record={rowData}
              setRecord={(record: any) => handleRowChange(index, 'severity', record.severity)}
              showLabel={false}
              searchable={false}
            />
          </Form>
        )
      },
      {
        key: 'actionsTaken',
        title: <Translate>Actions Taken</Translate>,
        render: (rowData: any, index: number) => (
          <Input
            value={rowData.actionsTaken ?? ''}
            onChange={value => handleRowChange(index, 'actionsTaken', value)}
            style={{ width: '100%' }}
          />
        )
      },
      {
        key: 'delete',
        title: <Translate>Delete</Translate>,
        render: (rowData: any, index: number) => (
          <FontAwesomeIcon
            icon={faTrash}
            color="red"
            style={{ cursor: 'pointer' }}
            onClick={() => handleDelete(rowData, index)}
          />
        )
      }
    ];

    return (
      <SectionContainer
        title={<Text>Complications</Text>}
        content={
          <>
            <div className="procedure-add-row">
              <Form fluid>
                <MyInput
                  width="100%"
                  menuMaxHeight="25vh"
                  placeholder="Select Complications"
                  showLabel={false}
                  selectData={availableTypes}
                  fieldType="multyPicker"
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="lovDisplayVale"
                  fieldName="types"
                  record={selected}
                  setRecord={setSelected}
                />
              </Form>
              <MyButton appearance="ghost" onClick={handleAdd}>
                Add
              </MyButton>
            </div>
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

export default ProcedureComplications;
