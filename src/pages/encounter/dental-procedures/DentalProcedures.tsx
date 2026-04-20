import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { Checkbox, Form, Panel, Stack } from 'rsuite';
// import { ItemDataType } from 'rsuite/esm/@types/common';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import MyNestedTable from '@/components/MyNestedTable/MyNestedTable';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal/DeletionConfirmationModal';
import { useGetLovValuesByCodeQuery, useGetCdtsQuery } from '@/services/setupService';
import { useGetServicesByCategoryQuery } from '@/services/setup/serviceService';
import {
  useGetDentalProceduresByPatientQuery,
  useSaveDentalProcedureMutation,
  useCancelDentalProcedureMutation
} from '@/services/dentalProcedureService';
import { newDentalProcedure } from '@/types/model-types-constructor-new';
import { initialListRequest } from '@/types/types';
import './styles.less';

const TOOTH_NUMBERS = Array.from({ length: 32 }, (_, i) => ({
  value: `Tooth${i + 1}`,
  label: String(i + 1)
}));

const formatDateTime = (ts: string | null | undefined) => {
  if (!ts) return '-';
  return new Date(ts).toLocaleString();
};

const DentalProcedures = () => {
  const location = useLocation();
  const { patient, encounter } = (location.state || {}) as any;

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  const [form, setForm] = useState({ ...newDentalProcedure });

  const { data: toothSurfData } = useGetLovValuesByCodeQuery('TOOTH_SURF');
  const { data: valueUnitData } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const { data: serviceList } = useGetServicesByCategoryQuery({
    page: 0,
    size: 1000,
    category: 'DENTAL'
  });
  const cdtListRes = useGetCdtsQuery({ ...initialListRequest, pageSize: 1000 });

  const {
    data: proceduresData,
    refetch,
    isLoading
  } = useGetDentalProceduresByPatientQuery(
    { patientId: patient?.id ?? patient?.key, showCancelled },
    { skip: !patient?.id && !patient?.key }
  );

  const [saveProcedure, saveMutation] = useSaveDentalProcedureMutation();
  const [cancelProcedure, cancelMutation] = useCancelDentalProcedureMutation();

  useEffect(() => {
    if (saveMutation.isSuccess) {
      setAddModalOpen(false);
      setForm({ ...newDentalProcedure });
    }
  }, [saveMutation.isSuccess]);

  useEffect(() => {
    if (cancelMutation.isSuccess) {
      setCancelConfirmOpen(false);
      setSelectedProcedure(null);
    }
  }, [cancelMutation.isSuccess]);

  const procedures = useMemo(() => {
    return proceduresData?.object ?? [];
  }, [proceduresData]);

  const columns = [
    {
      key: 'toothNumber',
      title: <Translate>Tooth Number</Translate>,
      render: (row: any) => row.toothNumber?.replace('Tooth', '') ?? '-'
    },
    {
      key: 'surface',
      title: <Translate>Surface</Translate>,
      render: (row: any) => row.surface ?? '-'
    },
    {
      key: 'procedure',
      title: <Translate>Procedure</Translate>,
      render: (row: any) => row.serviceId ?? '-'
    },
    {
      key: 'createdByAt',
      title: <Translate>Created By / At</Translate>,
      render: (row: any) => `${row.createdBy ?? '-'} / ${formatDateTime(row.createdDate)}`
    },
    {
      key: 'service',
      title: <Translate>Service</Translate>,
      render: (row: any) => row.serviceId ?? '-'
    },
    {
      key: 'cdtCode',
      title: <Translate>CDT Code</Translate>,
      render: (row: any) => row.cdtCodeId ?? '-'
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: (row: any) => (
        <span style={{ color: row.cancelled ? 'var(--error-red, #d32f2f)' : 'inherit' }}>
          {row.cancelled ? 'CANCELLED' : 'ACTIVE'}
        </span>
      )
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      render: (row: any) =>
        !row.cancelled ? (
          <IconButton
            color="error"
            size="small"
            title="Cancel Procedure"
            onClick={e => {
              e.stopPropagation();
              setSelectedProcedure(row);
              setCancelConfirmOpen(true);
            }}
          >
            <CancelIcon fontSize="small" />
          </IconButton>
        ) : null
    }
  ];

  const getNestedTable = (row: any) => ({
    columns: [
      {
        key: 'anesthesia',
        title: <Translate>Anesthesia Used</Translate>,
        render: () => row.anesthesiaUsed || '-'
      },
      {
        key: 'doseUnit',
        title: <Translate>Dose / Unit</Translate>,
        render: () => (row.dose != null ? `${row.dose} ${row.unit ?? ''}` : '-')
      },
      {
        key: 'filling',
        title: <Translate>Filling Material</Translate>,
        render: () => row.fillingMaterial || '-'
      },
      {
        key: 'notes',
        title: <Translate>Notes</Translate>,
        render: () => row.notes || '-'
      }
    ],
    data: [row]
  });

  const handleSave = () =>
    saveProcedure({
      ...form,
      patientId: patient?.id ?? patient?.key,
      encounterId: encounter?.id ?? encounter?.key
    }).unwrap();

  return (
    <Box className="dental-procedures-container">
      <Panel
        bordered
        header={
          <Stack justifyContent="space-between" alignItems="center">
            <Stack spacing={8} alignItems="center">
              <span className="sheet-title">
                <Translate>Dental Procedures</Translate>
              </span>
              <Checkbox
                checked={showCancelled}
                onChange={(_, checked) => setShowCancelled(checked)}
              >
                <Translate>Show Cancelled</Translate>
              </Checkbox>
            </Stack>
            <Stack spacing={8}>
              <MyButton
                onClick={() => {
                  setForm({ ...newDentalProcedure });
                  setAddModalOpen(true);
                }}
              >
                <AddIcon style={{ fontSize: 16, marginRight: 4 }} />
                <Translate>Add</Translate>
              </MyButton>
              <MyButton
                appearance="ghost"
                onClick={() => {
                  if (selectedProcedure) setCancelConfirmOpen(true);
                }}
                disabled={!selectedProcedure || selectedProcedure?.cancelled}
              >
                <CancelIcon style={{ fontSize: 16, marginRight: 4 }} />
                <Translate>Cancel</Translate>
              </MyButton>
              <MyButton appearance="ghost">
                <AttachFileIcon style={{ fontSize: 16, marginRight: 4 }} />
                <Translate>Attach</Translate>
              </MyButton>
            </Stack>
          </Stack>
        }
      >
        <MyNestedTable
          data={procedures}
          columns={columns}
          loading={isLoading}
          getNestedTable={getNestedTable}
          onRowClick={row =>
            setSelectedProcedure((prev: any) => (prev?.id === row.id ? null : row))
          }
          rowClassName={row => (selectedProcedure?.id === row.id ? 'selected-row' : '')}
          height="60vh"
        />
      </Panel>

      <MyModal
        open={addModalOpen}
        setOpen={setAddModalOpen}
        title="Add Dental Procedure"
        size="500px"
        position="right"
        steps={[{ title: 'Procedure Details' }]}
        actionButtonLabel="Save"
        actionButtonFunction={handleSave}
        isDisabledActionBtn={saveMutation.isLoading}
        content={() => (
          <Form>
            <MyInput
              width={450}
              fieldName="toothNumber"
              fieldLabel="Tooth Number"
              fieldType="select"
              required
              selectData={TOOTH_NUMBERS}
              selectDataLabel="label"
              selectDataValue="value"
              record={form}
              setRecord={setForm}
            />
            <MyInput
              width={450}
              fieldName="surface"
              fieldLabel="Surface"
              fieldType="select"
              required
              selectData={toothSurfData?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={form}
              setRecord={setForm}
            />
            <MyInput
              width={450}
              fieldName="anesthesiaUsed"
              fieldLabel="Anesthesia Used"
              fieldType="text"
              record={form}
              setRecord={setForm}
            />
            <MyInput
              width={450}
              fieldName="dose"
              fieldLabel="Dose"
              fieldType="number"
              record={form}
              setRecord={setForm}
            />
            <MyInput
              width={450}
              fieldName="unit"
              fieldLabel="Unit"
              fieldType="select"
              selectData={valueUnitData?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={form}
              setRecord={setForm}
            />
            <MyInput
              width={450}
              fieldName="fillingMaterial"
              fieldLabel="Filling Material"
              fieldType="text"
              record={form}
              setRecord={setForm}
            />
            <MyInput
              width={450}
              fieldName="serviceId"
              fieldLabel="Service"
              fieldType="select"
              required
              selectData={serviceList?.data ?? []}
              selectDataLabel="name"
              selectDataValue="id"
              // searchBy={(keyword, _, item: ItemDataType) =>
              //   (item as any).name?.toLowerCase().includes(keyword.toLowerCase())
              // }
              record={form}
              setRecord={setForm}
            />
            <MyInput
              width={450}
              fieldName="cdtCodeId"
              fieldLabel="CDT Code"
              fieldType="select"
              selectData={cdtListRes?.data?.object ?? []}
              selectDataLabel="description"
              selectDataValue="id"
              renderMenuItem={(label, item) => (
                <span>
                  {(item as any).code} – {(item as any).description}
                </span>
              )}
              // searchBy={(keyword, _, item: ItemDataType) =>
              //   (item as any).code?.toLowerCase().includes(keyword.toLowerCase()) ||
              //   (item as any).description?.toLowerCase().includes(keyword.toLowerCase())
              // }
              record={form}
              setRecord={setForm}
            />
            <MyInput
              width={450}
              fieldName="notes"
              fieldLabel="Note"
              fieldType="textarea"
              record={form}
              setRecord={setForm}
            />
          </Form>
        )}
      />

      <DeletionConfirmationModal
        open={cancelConfirmOpen}
        setOpen={setCancelConfirmOpen}
        itemToDelete="dental procedure"
        actionType="cancel"
        actionButtonFunction={() => {
          if (selectedProcedure?.id) {
            cancelProcedure({ id: selectedProcedure.id }).unwrap();
          }
        }}
      />
    </Box>
  );
};

export default DentalProcedures;
