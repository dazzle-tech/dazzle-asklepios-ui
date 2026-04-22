import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Checkbox, Col, Form, Row } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPen } from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';
import CancellationModal from '@/components/CancellationModal';
import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';
import CdtCodeSearch from '@/components/CdtCodeSearch/CdtCodeSearch';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatDateWithoutSeconds, conjureValueBasedOnKeyFromList } from '@/utils';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetCdtByIdsQuery } from '@/services/setup/cdtCodeService';
import { useGetServicesByCategoryQuery } from '@/services/setup/serviceService';
import {
  useGetDentalProceduresByPatientQuery,
  useSaveDentalProcedureMutation,
  useUpdateDentalProcedureMutation,
  useCancelDentalProcedureMutation
} from '@/services/dentalProcedureService';

import { newDentalProcedure } from '@/types/model-types-constructor-new';
import { DentalProcedureResponseVM } from '@/types/model-types-new';
import './styles.less';
import { useEnumOptions } from '@/services/enumsApi';

// ─── Helpers ────────────────────────────────────────────────────────────────

const getStatusColor = (cancelled: boolean) => (cancelled ? '#D64545' : '#0DAA41');

// ─── Component ───────────────────────────────────────────────────────────────

type FormMode = 'add' | 'edit';

const DentalProcedures = props => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;

  const [selectedRow, setSelectedRow] = useState<DentalProcedureResponseVM | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);

  // ── Single modal state ──
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('add');
  const [form, setForm] = useState<any>({ ...newDentalProcedure });
  const [modalKey, setModalKey] = useState(0);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [cancelForm, setCancelForm] = useState<any>({ cancellationReason: '' });

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  // ─── LOVs ────────────────────────────────────────────────────────────────
  const { data: toothSurfData } = useGetLovValuesByCodeQuery('TOOTH_SURF');
  const { data: valueUnitData } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const { data: serviceList } = useGetServicesByCategoryQuery({
    page: 0,
    size: 1000,
    category: 'DENTAL'
  });
  const ToothEnum = useEnumOptions('ToothNumber');

  // ─── Data ─────────────────────────────────────────────────────────────────
  const { data: proceduresData, isLoading } = useGetDentalProceduresByPatientQuery(
    { patientId: patient?.id ?? patient?.key, showCancelled, page, size },
    { skip: !patient?.id && !patient?.key }
  );

  const [saveProcedure, saveMutation] = useSaveDentalProcedureMutation();
  const [updateProcedure, updateMutation] = useUpdateDentalProcedureMutation();
  const [cancelProcedure, cancelMutation] = useCancelDentalProcedureMutation();

  const rows: DentalProcedureResponseVM[] = Array.isArray(proceduresData) ? proceduresData : [];
  const totalCount = rows.length;

  const cdtIds = useMemo(() => {
    const ids: number[] = [];
    const seen = new Set<number>();
    for (const row of rows) {
      if (row.cdtCodeId && typeof row.cdtCodeId === 'number' && !seen.has(row.cdtCodeId)) {
        seen.add(row.cdtCodeId);
        ids.push(row.cdtCodeId);
      }
    }
    return ids;
  }, [rows]);

  const { data: cdtList = [] } = useGetCdtByIdsQuery(cdtIds, { skip: cdtIds.length === 0 });

  const cdtMap = useMemo(
    () => Object.fromEntries((cdtList as any[]).map(c => [c.id, c])),
    [cdtList]
  );

  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const aTime = a.createdDate ? new Date(a.createdDate).getTime() : -Infinity;
        const bTime = b.createdDate ? new Date(b.createdDate).getTime() : -Infinity;
        return bTime - aTime;
      }),
    [rows]
  );

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (saveMutation.isSuccess) {
      dispatch(notify({ msg: 'Dental procedure saved successfully', sev: 'success' }));
      setFormModalOpen(false);
      setForm({ ...newDentalProcedure });
      setModalKey(prev => prev + 1);
    }
    if (saveMutation.isError) {
      dispatch(notify({ msg: 'Failed to save dental procedure', sev: 'warning' }));
    }
  }, [saveMutation.isSuccess, saveMutation.isError]);

  useEffect(() => {
    if (updateMutation.isSuccess) {
      dispatch(notify({ msg: 'Dental procedure updated successfully', sev: 'success' }));
      setFormModalOpen(false);
      setForm({ ...newDentalProcedure });
    }
    if (updateMutation.isError) {
      dispatch(notify({ msg: 'Failed to update dental procedure', sev: 'warning' }));
    }
  }, [updateMutation.isSuccess, updateMutation.isError]);

  useEffect(() => {
    if (cancelMutation.isSuccess) {
      dispatch(notify({ msg: 'Dental procedure cancelled successfully', sev: 'success' }));
      setCancelModalOpen(false);
      setSelectedRow(null);
      setCancelForm({ cancellationReason: '' });
    }
    if (cancelMutation.isError) {
      dispatch(notify({ msg: 'Failed to cancel dental procedure', sev: 'warning' }));
      setCancelModalOpen(false);
    }
  }, [cancelMutation.isSuccess, cancelMutation.isError]);

  useEffect(() => {
    setPage(0);
  }, [showCancelled]);

  // ─── Deselect on outside click ────────────────────────────────────────────
  const handleClearSelection = useCallback(() => {
    setSelectedRow(null);
  }, []);

  useEffect(() => {
    const handlePointer = (e: PointerEvent) => {
      if (cancelModalOpen || formModalOpen || attachmentsModalOpen) return;
      const target = e.target as HTMLElement;
      if (!tableContainerRef.current?.contains(target)) {
        handleClearSelection();
      }
    };
    document.addEventListener('pointerdown', handlePointer, true);
    return () => document.removeEventListener('pointerdown', handlePointer, true);
  }, [handleClearSelection, cancelModalOpen, formModalOpen, attachmentsModalOpen]);

  // ─── Helpers to open modal ────────────────────────────────────────────────
  const openAddModal = () => {
    setForm({ ...newDentalProcedure });
    setFormMode('add');
    setModalKey(prev => prev + 1);
    setFormModalOpen(true);
  };

  const openEditModal = (row: DentalProcedureResponseVM) => {
    setForm({ ...row });
    setFormMode('edit');
    setModalKey(prev => prev + 1);
    setFormModalOpen(true);
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (formMode === 'add') {
      try {
        await saveProcedure({
          ...form,
          patientId: patient?.id ?? patient?.key,
          encounterId: encounter?.id ?? encounter?.key
        }).unwrap();
      } catch {
        dispatch(notify({ msg: 'Failed to save dental procedure', sev: 'warning' }));
      }
    } else {
      if (!form?.id) return;
      try {
        const body = {
          id: form.id,
          toothNumber: form.toothNumber,
          surface: form.surface,
          anesthesiaUsed: form.anesthesiaUsed ?? null,
          dose: form.dose ?? null,
          unit: form.unit ?? null,
          fillingMaterial: form.fillingMaterial ?? null,
          serviceId: form.serviceId,
          cdtCodeId: form.cdtCodeId ?? null,
          notes: form.notes ?? null
        };
        await updateProcedure({ id: form.id, body }).unwrap();
      } catch {
        dispatch(notify({ msg: 'Failed to update dental procedure', sev: 'warning' }));
      }
    }
  };

  const handleCancel = async () => {
    if (!selectedRow?.id) return;
    try {
      await cancelProcedure({ id: selectedRow.id }).unwrap();
    } catch {
      dispatch(notify({ msg: 'Failed to cancel dental procedure', sev: 'warning' }));
      setCancelModalOpen(false);
    }
  };

  const isSelected = (row: DentalProcedureResponseVM) =>
    row?.id === selectedRow?.id ? 'selected-row' : '';

  const isMutating = formMode === 'add' ? saveMutation.isLoading : updateMutation.isLoading;

  // ─── Columns ──────────────────────────────────────────────────────────────
  const tableColumns = useMemo(
    () => [
      {
        key: 'toothNumber',
        title: <Translate>Tooth Number</Translate>,
        flexGrow: 1,
        render: (row: DentalProcedureResponseVM) =>
          ToothEnum?.find((t: any) => t.value === row.toothNumber)?.label ?? row.toothNumber ?? '-'
      },
      {
        key: 'surface',
        title: <Translate>Surface</Translate>,
        flexGrow: 1,
        render: (row: DentalProcedureResponseVM) =>
          conjureValueBasedOnKeyFromList(
            toothSurfData?.object ?? [],
            row.surface,
            'lovDisplayVale'
          ) ?? '-'
      },
      {
        key: 'procedure',
        title: <Translate>Procedure</Translate>,
        flexGrow: 2,
        render: (row: DentalProcedureResponseVM) => {
          const service = (serviceList?.data ?? []).find((s: any) => s.id === row.serviceId);
          return service?.name ?? row.serviceId ?? '-';
        }
      },
      {
        key: 'createdByAt',
        title: <Translate>Created By / At</Translate>,
        flexGrow: 2,
        render: (row: DentalProcedureResponseVM) => (
          <>
            {row.createdBy ?? '-'}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.createdDate)}</span>
          </>
        )
      },

      {
        key: 'cdtCode',
        title: <Translate>CDT Code</Translate>,
        flexGrow: 2,
        render: (row: DentalProcedureResponseVM) => {
          const cdt = row.cdtCodeId ? cdtMap[row.cdtCodeId] : null;
          return cdt ? `${cdt.code} – ${cdt.description}` : '-';
        }
      },
      // ── Expandable fields ──────────────────────────────────────────────────
      {
        key: 'anesthesiaUsed',
        title: <Translate>Anesthesia Used</Translate>,
        flexGrow: 1,
        expandable: true,
        render: (row: DentalProcedureResponseVM) => row.anesthesiaUsed ?? '-'
      },
      {
        key: 'doseUnit',
        title: <Translate>Dose / Unit</Translate>,
        flexGrow: 1,
        expandable: true,
        render: (row: DentalProcedureResponseVM) => {
          const unit =
            conjureValueBasedOnKeyFromList(
              valueUnitData?.object ?? [],
              row.unit,
              'lovDisplayVale'
            ) ??
            row.unit ??
            '';
          return row.dose != null ? `${row.dose}${unit ? ' ' + unit : ''}` : '-';
        }
      },
      {
        key: 'fillingMaterial',
        title: <Translate>Filling Material</Translate>,
        flexGrow: 1,
        expandable: true,
        render: (row: DentalProcedureResponseVM) => row.fillingMaterial ?? '-'
      },
      {
        key: 'notes',
        title: <Translate>Notes</Translate>,
        flexGrow: 2,
        expandable: true,
        render: (row: DentalProcedureResponseVM) => row.notes ?? '-'
      },
      // ── End expandable fields ──────────────────────────────────────────────
      {
        key: 'status',
        title: <Translate>Status</Translate>,
        flexGrow: 1,
        render: (row: DentalProcedureResponseVM) => (
          <MyBadgeStatus
            contant={row.cancelled ? 'Cancelled' : 'Active'}
            color={getStatusColor(row.cancelled ?? false)}
          />
        )
      },
      {
        key: 'actions',
        title: <Translate>Actions</Translate>,
        flexGrow: 1,
        render: (row: DentalProcedureResponseVM) => (
          <FontAwesomeIcon
            icon={faPen}
            style={{
              cursor: row.cancelled ? 'not-allowed' : 'pointer',
              color: row.cancelled ? '#ccc' : 'var(--primary-gray)'
            }}
            onClick={() => {
              if (row.cancelled) return;
              openEditModal(row);
            }}
          />
        )
      }
    ],
    [serviceList, toothSurfData, ToothEnum, cdtMap, valueUnitData]
  );

  // ─── RTL/LTR ──────────────────────────────────────────────────────────────
  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div dir={dir}>
      <div ref={tableContainerRef}>
        <MyTable
          columns={tableColumns}
          data={sortedRows}
          loading={isLoading}
          page={page}
          rowsPerPage={size}
          totalCount={totalCount}
          onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
          onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          onRowClick={(row: DentalProcedureResponseVM) => {
            setSelectedRow(prev => (prev?.id === row.id ? null : row));
          }}
          rowClassName={isSelected}
          tableButtons={
            <div className="bt-div-2">
              <div className="bt-left-2">
                <MyButton
                  disabled={!selectedRow || selectedRow?.cancelled}
                  onClick={() => {
                    setCancelForm({ cancellationReason: '' });
                    setCancelModalOpen(true);
                  }}
                >
                  <Translate>Cancel</Translate>
                </MyButton>

                <MyButton
                  appearance="ghost"
                  disabled={!selectedRow}
                  onClick={() => setAttachmentsModalOpen(true)}
                >
                  <Translate>Attach</Translate>
                </MyButton>

                <Checkbox checked={showCancelled} onChange={() => setShowCancelled(prev => !prev)}>
                  <Translate>Show Cancelled</Translate>
                </Checkbox>
              </div>

              <div className="bt-right-2">
                <MyButton
                  onClick={openAddModal}
                  prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
                >
                  <Translate>Add Dental Procedure</Translate>
                </MyButton>
              </div>
            </div>
          }
        />
      </div>

      {/* ── Add / Edit Modal ── */}
      <MyModal
        key={modalKey}
        open={formModalOpen}
        setOpen={setFormModalOpen}
        title={formMode === 'add' ? 'Add Dental Procedure' : 'Edit Dental Procedure'}
        size="500px"
        position="right"
        steps={[{ title: 'Procedure Details' }]}
        actionButtonLabel={formMode === 'add' ? 'Save' : 'Update'}
        actionButtonFunction={handleSubmit}
        isDisabledActionBtn={isMutating}
        content={() => (
          <Form fluid className="fields-container">
            <Row>
              <Row>
                <Col md={12}>
                  <MyInput
                    width="100%"
                    column
                    fieldName="toothNumber"
                    fieldLabel="Tooth Number"
                    fieldType="select"
                    required
                    selectData={ToothEnum}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={form}
                    setRecord={setForm}
                  />
                </Col>

                <Col md={12}>
                  <MyInput
                    width="100%"
                    column
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
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <MyInput
                    width="100%"
                    column
                    fieldName="anesthesiaUsed"
                    fieldLabel="Anesthesia Used"
                    fieldType="text"
                    record={form}
                    setRecord={setForm}
                  />
                </Col>

                <Col md={12}>
                  <MyInput
                    width="100%"
                    column
                    fieldName="dose"
                    fieldLabel="Dose"
                    fieldType="number"
                    record={form}
                    setRecord={setForm}
                  />
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <MyInput
                    width="100%"
                    column
                    fieldName="unit"
                    fieldLabel="Unit"
                    fieldType="select"
                    selectData={valueUnitData?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={form}
                    setRecord={setForm}
                  />
                </Col>

                <Col md={12}>
                  <MyInput
                    width="100%"
                    column
                    fieldName="fillingMaterial"
                    fieldLabel="Filling Material"
                    fieldType="text"
                    record={form}
                    setRecord={setForm}
                  />
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <MyInput
                    width="100%"
                    column
                    fieldName="serviceId"
                    fieldLabel="Procedure"
                    fieldType="select"
                    required
                    selectData={serviceList?.data ?? []}
                    selectDataLabel="name"
                    selectDataValue="id"
                    record={form}
                    setRecord={setForm}
                  />
                </Col>

                <Col md={12}>
                  <MyInput
                    width="100%"
                    column
                    fieldName="notes"
                    fieldLabel="Note"
                    fieldType="textarea"
                    record={form}
                    setRecord={setForm}
                  />
                </Col>
              </Row>

              <Row>
                <Col md={16}>
                  <CdtCodeSearch
                    cdtCodeId={form.cdtCodeId}
                    setCdtCodeId={id => setForm(prev => ({ ...prev, cdtCodeId: id }))}
                  />
                </Col>
              </Row>
            </Row>
          </Form>
        )}
      />

      {/* ── Cancel Modal ── */}
      <CancellationModal
        title="Cancel Dental Procedure"
        fieldLabel="Cancellation Reason"
        open={cancelModalOpen}
        setOpen={setCancelModalOpen}
        object={cancelForm}
        setObject={setCancelForm}
        handleCancle={handleCancel}
        fieldName="cancellationReason"
        required={false}
      />

      {/* ── Attachments Modal ── */}
      <MyModal
        open={attachmentsModalOpen}
        setOpen={setAttachmentsModalOpen}
        title="Attachments - Dental Procedure"
        size="lg"
        hideActionBtn={true}
        content={
          <EncounterAttachment
            localEncounter={encounter}
            source="DENTAL_PROCEDURE_ATTACHMENT"
            sourceId={selectedRow?.id ? Number(selectedRow.id) : undefined}
            refetchAttachmentList={false}
            setRefetchAttachmentList={() => {}}
          />
        }
      />
    </div>
  );
};

export default DentalProcedures;
