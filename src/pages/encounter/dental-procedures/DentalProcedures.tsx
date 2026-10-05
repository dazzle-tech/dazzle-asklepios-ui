import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Checkbox, Col, Form, Row } from 'rsuite';
import UncoveredInsuranceWarning from '@/components/UncoveredInsuranceWarning';
import { useInsurancePriceListCoverage } from '@/hooks/useInsurancePriceListCoverage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPen } from '@fortawesome/free-solid-svg-icons';
import { MdAttachFile } from 'react-icons/md';
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
import { isUncoveredCashCancelled } from '@/utils/uncoveredInsuranceConfirm';
import { formatDateWithoutSeconds, conjureValueBasedOnKeyFromList } from '@/utils';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetCdtByIdsQuery } from '@/services/setup/cdtCodeService';
import { useGetServicesByCategoryQuery } from '@/services/setup/serviceService';
import { useGetProceduresByCategoryQuery } from '@/services/setup/procedure/procedureService';
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

const getStatusColor = (cancelled: boolean) => (cancelled ? '#D64545' : '#0DAA41');

const FIELD_LABELS: Record<string, string> = {
  toothNumber: 'tooth number',
  surface: 'surface',
  procedureId: 'procedure',
  serviceId: 'service',
  cdtCodeId: 'CDT code',
  patientId: 'patient',
  encounterId: 'encounter',
  dose: 'dose',
  unit: 'unit',
  anesthesiaUsed: 'anesthesia used',
  fillingMaterial: 'filling material',
  notes: 'notes'
};

const DENTAL_PROCEDURE_ERROR_MAP: Record<string, string> = {
  patientNotFound: 'Patient not found.',
  encounterNotFound: 'Encounter not found.',
  idNotFound: 'Dental procedure not found.',
  procedureSetupNotFound: 'Procedure setup data not found.',
  procedureSetupUnreachable: 'Unable to fetch procedure setup data. Please try again.',
  serviceSetupNotFound: 'Service setup data not found.',
  serviceSetupUnreachable: 'Unable to fetch service setup data. Please try again.',
  procedureNotFound: 'The selected procedure does not exist.',
  serviceNotFound: 'The selected service does not exist.',
  cdtCodeNotFound: 'The selected CDT code does not exist.',
  'db.constraint': 'A database constraint was violated. Please check your entries.',
  cannotUpdateCancelled: 'Cannot update a cancelled dental procedure.',
  procedureAlreadyBilled: 'Cannot modify this procedure because it has already been billed.',
  serviceAlreadyBilled: 'Cannot modify this procedure because the service has already been billed.',
  alreadyCancelled: 'This dental procedure is already cancelled.',
  cancellationReasonRequired: 'Cancellation reason is required.'
};

const normalizeMsg = (msg: string) => {
  const m = (msg || '').toLowerCase();
  if (m.includes('must not be null') || m.includes('cannot be null')) return 'is required';
  if (m.includes('must not be blank')) return 'must not be blank';
  if (m.includes('size must be between')) return 'length is out of range';
  return msg || 'invalid value';
};

const handleCrudError = (error: any, dispatch: any) => {
  if (isUncoveredCashCancelled(error)) {
    return;
  }

  const data = error?.data ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const lines = data.fieldErrors.map((fe: any) => {
      const rawField = String(fe.field ?? '');
      const fieldLabel = FIELD_LABELS[rawField] ?? rawField;
      return `• ${fieldLabel}: ${normalizeMsg(fe.message)}`;
    });

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix,
        sev: 'warning'
      })
    );
    return;
  }

  const messageProp: string = data?.message || '';

  if (
    messageProp.includes('ConstraintViolationImpl') ||
    messageProp.includes('Validation failed')
  ) {
    const violations: string[] = [];
    const pattern = /propertyPath=(\w+).*?interpolatedMessage='([^']+)'/g;
    let match;

    while ((match = pattern.exec(messageProp)) !== null) {
      const rawField = match[1];
      const fieldLabel = FIELD_LABELS[rawField] ?? rawField;
      const normalized = normalizeMsg(match[2]);
      violations.push(`• ${fieldLabel}: ${normalized}`);
    }

    if (violations.length > 0) {
      dispatch(
        notify({
          msg: `Please fix the following fields:\n${violations.join('\n')}` + suffix,
          sev: 'warning'
        })
      );
      return;
    }
  }

  const errorKey =
    messageProp.startsWith('error.') ? messageProp.substring(6) : data?.errorKey;

  const humanMsg =
    (errorKey && DENTAL_PROCEDURE_ERROR_MAP[errorKey]) ||
    data?.detail ||
    data?.title ||
    messageProp ||
    'Unexpected error. Please try again.';

  dispatch(notify({ msg: humanMsg + suffix, sev: 'warning' }));
};

const buildValidationError = (form: any) => {
  const fieldErrors: { field: string; message: string }[] = [];

  if (!form.toothNumber) {
    fieldErrors.push({ field: 'toothNumber', message: 'must not be null' });
  }

  if (!form.surface) {
    fieldErrors.push({ field: 'surface', message: 'must not be null' });
  }

  if (!form.procedureId) {
    fieldErrors.push({ field: 'procedureId', message: 'must not be null' });
  }

  return fieldErrors.length > 0
    ? { data: { fieldErrors }, status: 400 }
    : null;
};

type FormMode = 'add' | 'edit';

const emptyForm = {
  ...newDentalProcedure,
  anesthesiaUsed: '',
  dose: '',
  fillingMaterial: '',
  notes: ''
};

const DentalProcedures = props => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
   const edit = props.edit ?? location.state?.edit ?? false;

  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const { uncoveredItems, checkItems, clearUncoveredItems, requiresCashConfirmation } =
    useInsurancePriceListCoverage(encounter?.id);

  const [selectedRow, setSelectedRow] = useState<DentalProcedureResponseVM | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('add');
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [modalKey, setModalKey] = useState(0);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [cancelForm, setCancelForm] = useState<any>({ cancellationReason: '' });

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  useEffect(() => {
    if (!formModalOpen || formMode !== 'add') {
      clearUncoveredItems();
      return;
    }

    const checks = [];
    if (form.procedureId) {
      checks.push({ billingItemType: 'PROCEDURE', procedureId: Number(form.procedureId) });
    }
    if (form.serviceId) {
      checks.push({ billingItemType: 'SERVICE', serviceId: Number(form.serviceId) });
    }

    if (!checks.length) {
      clearUncoveredItems();
      return;
    }

    void checkItems(checks);
  }, [
    formModalOpen,
    formMode,
    form.procedureId,
    form.serviceId,
    checkItems,
    clearUncoveredItems
  ]);

  const { data: toothSurfData } = useGetLovValuesByCodeQuery('TOOTH_SURF');
  const { data: valueUnitData } = useGetLovValuesByCodeQuery('VALUE_UNIT');

  const { data: serviceList } = useGetServicesByCategoryQuery({
    page: 0,
    size: 1000,
    category: 'DENTAL'
  });

  const { data: procedureList } = useGetProceduresByCategoryQuery({
    categoryType: 'DENTAL_PROCEDURE',
    page: 0,
    size: 1000
  });

  const ToothEnum = useEnumOptions('ToothNumber');

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

  useEffect(() => {
    if (saveMutation.isSuccess) {
      dispatch(notify({ msg: 'Dental procedure saved successfully', sev: 'success' }));
      setFormModalOpen(false);
      setForm({ ...emptyForm });
      setModalKey(prev => prev + 1);
    }
  }, [saveMutation.isSuccess]);

  useEffect(() => {
    if (updateMutation.isSuccess) {
      dispatch(notify({ msg: 'Dental procedure updated successfully', sev: 'success' }));
      setFormModalOpen(false);
      setForm({ ...emptyForm });
    }
  }, [updateMutation.isSuccess]);

  useEffect(() => {
    if (cancelMutation.isSuccess) {
      dispatch(notify({ msg: 'Dental procedure cancelled successfully', sev: 'success' }));
      setCancelModalOpen(false);
      setSelectedRow(null);
      setCancelForm({ cancellationReason: '' });
    }
  }, [cancelMutation.isSuccess]);

  useEffect(() => {
    setPage(0);
  }, [showCancelled]);

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

  const openAddModal = () => {
    setForm({ ...emptyForm });
    setFormMode('add');
    setModalKey(prev => prev + 1);
    setFormModalOpen(true);
  };

  const openEditModal = (row: DentalProcedureResponseVM) => {
    setForm({
      ...row,
      procedureId: (row as any).procedureId ?? null,
      serviceId: row.serviceId ?? null,
      anesthesiaUsed: row.anesthesiaUsed ?? '',
      dose: row.dose ?? '',
      fillingMaterial: row.fillingMaterial ?? '',
      notes: row.notes ?? ''
    });

    setFormMode('edit');
    setModalKey(prev => prev + 1);
    setFormModalOpen(true);
  };

  const handleSubmit = async () => {
    const validationError = buildValidationError(form);

    if (validationError) {
      handleCrudError(validationError, dispatch);
      return;
    }

    if (formMode === 'add') {
      try {
        const createPayload = {
          patientId: patient?.id,
          encounterId: encounter?.id,
          toothNumber: form.toothNumber,
          surface: form.surface,
          anesthesiaUsed: form.anesthesiaUsed?.trim() || null,
          dose: form.dose !== '' && form.dose != null ? Number(form.dose) : null,
          unit: form.unit || null,
          fillingMaterial: form.fillingMaterial?.trim() || null,
          procedureId: form.procedureId,
          serviceId: form.serviceId || null,
          cdtCodeId: form.cdtCodeId || null,
          notes: form.notes?.trim() || null,
          acceptUncoveredAsCash: requiresCashConfirmation
        };

        await saveProcedure(createPayload).unwrap();
      } catch (error) {
        handleCrudError(error, dispatch);
      }
    } else {
      if (!form?.id) return;

      try {
        const body = {
          id: form.id,
          toothNumber: form.toothNumber,
          surface: form.surface,
          anesthesiaUsed: form.anesthesiaUsed?.trim() || null,
          dose: form.dose !== '' && form.dose != null ? Number(form.dose) : null,
          unit: form.unit || null,
          fillingMaterial: form.fillingMaterial?.trim() || null,
          procedureId: form.procedureId,
          serviceId: form.serviceId || null,
          cdtCodeId: form.cdtCodeId || null,
          notes: form.notes?.trim() || null
        };

        await updateProcedure({ id: form.id, body }).unwrap();
      } catch (error) {
        handleCrudError(error, dispatch);
      }
    }
  };

  const handleCancel = async () => {
    if (!selectedRow?.id) return;

    try {
      await cancelProcedure({ id: selectedRow.id, cancellationReason: cancelForm.cancellationReason || '' }).unwrap();
    } catch (error) {
      console.log("error:",error)
      handleCrudError(error, dispatch);
      setCancelModalOpen(false);
    }
  };

  const isSelected = (row: DentalProcedureResponseVM) =>
    row?.id === selectedRow?.id ? 'selected-row' : '';

  const isMutating = formMode === 'add' ? saveMutation.isLoading : updateMutation.isLoading;

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
          const procedure = (procedureList?.data ?? []).find(
            (p: any) => p.id === (row as any).procedureId
          );

          return procedure?.name ?? '-';
        }
      },
      {
        key: 'service',
        title: <Translate>Service</Translate>,
        flexGrow: 2,
        render: (row: DentalProcedureResponseVM) => {
          const service = (serviceList?.data ?? []).find((s: any) => s.id === row.serviceId);

          return service?.name ?? '-';
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
      {
        key: 'attachments',
        dataKey: '',
        title: <Translate>ATTACHMENTS</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          return (
            <MdAttachFile
              size={20}
              fill={rowData?.id ? 'var(--primary-gray)' : '#ccc'}
              onClick={() => {
                if (rowData?.id) {
                  // setProcedure(rowData);
                  setAttachmentsModalOpen(true)
                }
              }}
              className={rowData?.id ? 'attachment-icon active' : 'attachment-icon disabled'}
            />
          );
        }
      },
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
            style={{ cursor: edit || row.cancelled ? 'not-allowed' : 'pointer', color: edit || row.cancelled ? '#ccc' : 'var(--primary-gray)' }}
            onClick={() => {
              if (row.cancelled || edit) return;
              openEditModal(row);
            }}
          />
        )
      },
      {
        key: 'cancelledByAt',
        title: "Cancelled By / At",
        render: (row: DentalProcedureResponseVM) => (
          <>
            {row.cancelledBy ?? '-'}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.cancelledDate)}</span>
          </>
        ),
        expandable: true
      },
      {
        key: 'cancellationReason',
        title: "Cancellation Reason",
        expandable: true
      },
    ],
    [serviceList, procedureList, toothSurfData, ToothEnum, cdtMap, valueUnitData]
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

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
                  disabled={edit}
                >
                  <Translate>Cancel</Translate>
                </MyButton>

                <Checkbox className="show-cancelled" checked={showCancelled} onChange={() => setShowCancelled(prev => !prev)}>
                  <Translate>Show Cancelled</Translate>
                </Checkbox>
              </div>

              <div className="bt-right-2">
                <MyButton
                  onClick={openAddModal}
                  prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
                  disabled={edit}
                >
                  <Translate>Add Dental Procedure</Translate>
                </MyButton>
              </div>
            </div>
          }
        />
      </div>

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
            <UncoveredInsuranceWarning items={uncoveredItems} />
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
                    disableByField='isValid'

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
                    disableByField='isValid'
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
                    fieldName="procedureId"
                    fieldLabel="Procedure"
                    fieldType="select"
                    required
                    selectData={procedureList?.data ?? []}
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
                    fieldName="serviceId"
                    fieldLabel="Service"
                    fieldType="select"
                    selectData={serviceList?.data ?? []}
                    selectDataLabel="name"
                    selectDataValue="id"
                    record={form}
                    setRecord={setForm}
                  />
                </Col>
              </Row>

              <Row>
                <Col md={24}>
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

      <CancellationModal
        title="Cancel Dental Procedure"
        fieldLabel="Cancellation Reason"
        open={cancelModalOpen}
        setOpen={setCancelModalOpen}
        object={cancelForm}
        setObject={setCancelForm}
        handleCancle={handleCancel}
        fieldName="cancellationReason"
        required={true}
      />

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
            setRefetchAttachmentList={() => { }}
          />
        }
      />
    </div>
  );
};

export default DentalProcedures;