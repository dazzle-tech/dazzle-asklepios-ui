import PlusIcon from '@rsuite/icons/Plus';
import React, { useState, useRef, useEffect } from 'react';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import AddSocialHistory from './AddSocialHistory';
import {
  useCancelSocialHistoryMutation,
  useDeleteSocialHistoryMutation,
  useGetSocialHistoryQuery,
  useAddSocialHistoryMutation,
  useUpdateSocialHistoryMutation
} from '@/services/patients/socialHistoryService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { Form, Tooltip, Whisper } from 'rsuite';
import MyInput from '@/components/MyInput';
import '../styles.less';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import Translate from '@/components/Translate';
import CancellationModal from '@/components/CancellationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import ExpandableText from '@/components/ExpandMore/ExpandableText';
import UserDateCell from '@/components/UserDateCell/UserDateCell';

const SocialHistory = ({ patient, edit, toShowData = false, showFreeText = false, collapsible = false, defaultCollapsed = false }) => {
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [freeTextRecord, setFreeTextRecord] = useState({
    freeText: ''
  });
  const [editingFreeTextId, setEditingFreeTextId] = useState<number | null>(null);
  const [previewRow, setPreviewRow] = useState<any>(null);

  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [cancelObject, setCancelObject] = useState<any>({
    id: null,
    status: '',
    cancellationReason: ''
  });

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);
  const [showCancelled, setShowCancelled] = useState(false);
  const { data: routeLov } = useGetLovValuesByCodeQuery('MED_ROA');
  const { data: freqLov } = useGetLovValuesByCodeQuery('FREQUENT_USE');
  const { data: physicalLov } = useGetLovValuesByCodeQuery('PHYSICAL_LIMITATION');
  const { data: diagnoseLov } = useGetLovValuesByCodeQuery('EATING_DISORDERS');

  const previewRef = useRef<HTMLDivElement>(null);

  const patientId = Number(patient?.id);
  const isValidPatientId = Number.isFinite(patientId) && patientId > 0;

  const { data, isFetching, refetch } = useGetSocialHistoryQuery(
    {
      patientId,
      page,
      size,
      sort: 'id,desc',
      showCancelled
    },
    { skip: !isValidPatientId }
  );

  const [cancelSocialHistory, { isLoading }] =
    useCancelSocialHistoryMutation();

  const filteredData = data?.data ?? [];

  useEffect(() => {
    if (previewRow && previewRef.current) {
      previewRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [previewRow]);

  const handleRowClick = (row: any) => {
    setPreviewRow(prev => (prev?.id === row.id ? null : row));
  };

  const [addSocialHistory, { isLoading: isSavingFreeText }] =
    useAddSocialHistoryMutation();
  const [updateSocialHistory, { isLoading: isUpdatingFreeText }] =
    useUpdateSocialHistoryMutation();

  const handleSaveFreeText = async () => {
    const freeText = freeTextRecord.freeText?.trim();

    if (!freeText) {
      dispatch(notify({ msg: 'Free Text is required.', sev: 'warning' }));
      return;
    }

    if (!isValidPatientId) {
      dispatch(notify({ msg: 'Invalid patient.', sev: 'error' }));
      return;
    }

    const payload = {
      patientId,
      isCurrentSmoker: null,
      smokeStartDate: null,
      cigaretteAmount: null,
      cigaretteType: null,
      isPreviousSmoker: null,
      smokeQuitDate: null,
      exposureToSecondHandSmoke: null,
      alcoholConsumption: null,
      typeOfAlcohol: null,
      alcoholSinceWhen: null,
      substanceUse: null,
      route: null,
      frequency: null,
      physicalLimitation: null,
      diagnosedEatingDisorders: null,
      patientIsFree: true,
      freeText
    };

    try {
      if (editingFreeTextId !== null) {
        await updateSocialHistory({
          ...payload,
          id: editingFreeTextId
        }).unwrap();

        dispatch(notify({ msg: 'Free Text updated successfully.', sev: 'success' }));
      } else {
        await addSocialHistory(payload).unwrap();

        dispatch(notify({ msg: 'Free Text saved successfully.', sev: 'success' }));
      }

      setFreeTextRecord({ freeText: '' });
      setEditingFreeTextId(null);
      refetch();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.detail ||
        error?.error ||
        `Failed to ${editingFreeTextId !== null ? 'update' : 'save'} Free Text.`;

      dispatch(notify({ msg: errorMessage, sev: 'error' }));
    }
  };

  const handleEdit = (row: any) => {
    if (row?.patientIsFree === true) {
      setEditingFreeTextId(row.id);
      setFreeTextRecord({
        freeText: row.freeText || ''
      });
      return;
    }

    const formData = {
      id: row.id,
      patientId: row.patientId,

      isCurrentSmoker: row.isCurrentSmoker || false,
      smokeStartDate: row.smokeStartDate || null,
      cigaretteAmount: row.cigaretteAmount || null,
      cigaretteType: row.cigaretteType || '',

      isPreviousSmoker: row.isPreviousSmoker || false,
      smokeQuitDate: row.smokeQuitDate || null,

      exposureToSecondHandSmoke: row.exposureToSecondHandSmoke || false,

      alcoholConsumption: row.alcoholConsumption || false,
      typeOfAlcohol: row.typeOfAlcohol || '',
      alcoholSinceWhen: row.alcoholSinceWhen || null,

      substanceUse: row.substanceUse || false,
      route: row.route || null,
      frequency: row.frequency || null,

      physicalLimitation: row.physicalLimitation || null,
      diagnosedEatingDisorders: row.diagnosedEatingDisorders || null
    };

    setEditData(formData);
    setOpen(true);
  };

  const handleCancel = async () => {
    try {
      await cancelSocialHistory({
        id: cancelObject.id,
        cancellationReason: cancelObject.cancellationReason
      }).unwrap();

      dispatch(
        notify({
          msg: 'Social History cancelled successfully.',
          sev: 'success'
        })
      );

      if (previewRow?.id === cancelObject.id) {
        setPreviewRow(null);
      }

      setOpenCancelModal(false);

      setCancelObject({
        id: null,
        status: '',
        cancellationReason: ''
      });
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.detail ||
        error?.error ||
        'Failed to cancel Social History.';

      dispatch(
        notify({
          msg: errorMessage,
          sev: 'error'
        })
      );
    }
  };

  const openCancelDialog = (row: any) => {
    setCancelObject({
      id: row.id,
      status: row.status || 'ACTIVE',
      cancellationReason: ''
    });

    setOpenCancelModal(true);
  };

  const columns = [
    {
      key: 'freeText',
      title: (
        <div style={{ minWidth: 350, width: '100%' }}>
          <Translate>FREE TEXT</Translate>
        </div>
      ),
      minWidth: 350,
      flexGrow: 3,
      render: (row: any) => {
        if (row?.patientIsFree !== true) {
          return '-';
        }

        const text = row?.freeText?.trim() || '-';

        return (
          <Whisper
            placement="top"
            trigger="hover"
            speaker={
              <Tooltip
                style={{
                  maxWidth: 500,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {text}
              </Tooltip>
            }
          >
            <div
              style={{
                display: 'block',
                width: '100%',
                minWidth: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere'
              }}
            >
              {text}
            </div>
          </Whisper>
        );
      }
    },
    {
      key: 'isCurrentSmoker',
      title: 'CURRENT SMOKER',
      render: r => (r.patientIsFree === true ? '-' : r.isCurrentSmoker ? 'Yes' : 'No')
    },
    {
      key: 'smokeStartDate',
      title: 'START DATE',
      render: r => (r.smokeStartDate ? new Date(r.smokeStartDate).toLocaleDateString() : '')
    },
    { key: 'cigaretteAmount', title: 'AMOUNT' },
    { key: 'cigaretteType', title: 'CIGARETTE TYPE' },
    {
      key: 'isPreviousSmoker',
      title: 'PREVIOUS SMOKER',
      render: r => (r.patientIsFree === true ? '-' : r.isPreviousSmoker ? 'Yes' : 'No')
    },
    {
      key: 'smokeQuitDate',
      title: 'QUIT DATE',
      render: r => (r.smokeQuitDate ? new Date(r.smokeQuitDate).toLocaleDateString() : '')
    },
    {
      key: 'alcoholConsumption',
      title: 'ALCOHOL',
      render: r => (r.patientIsFree === true ? '-' : r.alcoholConsumption ? 'Yes' : 'No')
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
      width: 140,
      render: (row: any) => {
        const status = row?.status ?? 'ACTIVE';

        return (
          <MyBadgeStatus
            contant={formatEnumString(status)}
            color={
              status === 'CANCELLED'
                ? '#dc3545'
                : status === 'ACTIVE'
                  ? '#28a745'
                  : '#6c757d'
            }
          />
        );
      }
    },
    {
      key: 'ExposureToSecondHandSmoke',
      title: 'SECOND HAND SMOKE',
      expandable: true,
      render: r => (r.patientIsFree === true ? '-' : r.exposureToSecondHandSmoke ? 'Yes' : 'No')
    },
    {
      key: 'createdDate',
      title: <Translate>CREATED AT / BY</Translate>,
      expandable: true,
      render: (row: any) => (
        <UserDateCell
          login={row?.createdBy}
          date={row?.createdDate}
        />
      )
    },
    {
      key: 'lastModifiedDate',
      title: 'UPDATED AT / BY',
      expandable: true,
      render: (row: any) => (
        <UserDateCell
          login={row?.lastModifiedBy}
          date={row?.lastModifiedDate}
        />
      )
    },
    {
      key: 'cancelledDate',
      title: <Translate>CANCELLED AT / BY</Translate>,
      expandable: true,
      render: (row: any) =>
        row?.status === 'CANCELLED' ? (
          <UserDateCell
            login={row?.cancelledBy}
            date={row?.cancelledDate}
          />
        ) : (
          <span>-</span>
        )
    },
    {
      key: 'cancellationReason',
      title: <Translate>CANCELLATION REASON</Translate>,
      expandable: true,
      flexGrow: 4,
      render: (row: any) =>
        row?.status === 'CANCELLED' && row?.cancellationReason ? (
          <ExpandableText
            text={row.cancellationReason}
            lines={3}
            maxChars={30}
          />
        ) : (
          '-'
        )
    },
    ...(!toShowData
      ? [
        {
          key: 'actions',
          title: '',
          flexGrow: 1,
          render: row => (
            <div className="flex-gap-12" onClick={e => e.stopPropagation()}>
              {row.status !== 'CANCELLED' && (
                <>
                  <MdModeEdit
                    className="view-only-action-edit-delete-encounter"
                    size={22}
                    fill="var(--primary-gray)"
                    className="pointer"
                    onClick={e => {
                      e.stopPropagation();
                      handleEdit(row);
                    }}
                    style={{
                      opacity: edit ? 0.5 : 1,
                      pointerEvents: edit ? 'none' : 'auto',
                      cursor: edit ? 'not-allowed' : 'pointer',
                    }}
                  />

                  <MdDelete
                    className="view-only-action-edit-delete-encounter"
                    size={22}
                    fill="var(--rs-red-500, #f44336)"
                    className="pointer"
                    title="Cancel"
                    style={{
                      opacity: edit ? 0.5 : 1,
                      pointerEvents: edit ? 'none' : 'auto',
                      cursor: edit ? 'not-allowed' : 'pointer',
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      openCancelDialog(row);
                    }}
                  />
                </>
              )}
            </div>
          )
        }
      ]
      : [])
  ];

  const { data: createdByFullName } = useGetUserFullNameByLoginQuery(
    previewRow?.createdBy,
    {
      skip: !previewRow?.createdBy
    }
  );

  const { data: lastModifiedByFullName } = useGetUserFullNameByLoginQuery(
    previewRow?.lastModifiedBy,
    {
      skip: !previewRow?.lastModifiedBy
    }
  );

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div className="medical-main-container" dir={dir}>
      <div className="medical-container-div" dir={dir}>
        <SectionContainer
          collapsible={collapsible}
          defaultCollapsed={defaultCollapsed}
          title="Social History"
          action={
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {!toShowData && (
                <MyButton
                  disabled={edit}
                  prefixIcon={() => <PlusIcon />}
                  onClick={() => {
                    setEditData(null);
                    setOpen(true);
                  }}
                >
                  Add
                </MyButton>
              )}

              {showFreeText && (
                <MyButton
                  disabled={
                    edit ||
                    isSavingFreeText ||
                    isUpdatingFreeText ||
                    !freeTextRecord.freeText?.trim()
                  }
                  onClick={handleSaveFreeText}
                >
                  {isSavingFreeText || isUpdatingFreeText
                    ? 'Saving...'
                    : editingFreeTextId !== null
                      ? 'Update'
                      : 'Save'}
                </MyButton>
              )}
            </div>
          }
          content={
            <div dir={dir}>
              {showFreeText && (
                <Form
                  fluid
                  formValue={freeTextRecord}
                  onChange={(value: any) => setFreeTextRecord(value)}
                >
                  <div style={{ marginBottom: 20, width: '100%' }}>
                    <MyInput
                      fieldType="textarea"
                      fieldLabel="Free Text"
                      fieldName="freeText"
                      record={freeTextRecord}
                      setRecord={setFreeTextRecord}
                      disabled={edit || isSavingFreeText || isUpdatingFreeText}
                      width="100%"
                    />
                  </div>
                </Form>
              )}

              
                <div className="margin-bottom-10 show-cancelled">
                  <MyInput
                    fieldType="check"
                    fieldLabel="Show Cancelled"
                    showLabel={false}
                    fieldName="showCancelled"
                    record={{ showCancelled }}
                    setRecord={(record: any) => {
                      setShowCancelled(record.showCancelled);
                      setPreviewRow(null);
                    }}
                  />
                </div>
              
              <MyTable
                height={450}
                data={filteredData}
                loading={isFetching}
                columns={columns}
                page={page}
                rowsPerPage={size}
                totalCount={data?.totalCount ?? 0}
                onRowClick={handleRowClick}
                rowClassName={row => (row?.id === previewRow?.id ? 'selected-row' : '')}
                onPageChange={(_, p) => setPage(p)}
                onRowsPerPageChange={e => {
                  setSize(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />

              {previewRow && previewRow.patientIsFree !== true && (
                <div ref={previewRef} className="margin-top-20">
                  <SectionContainer
                    title="Social History Details"
                    content={
                      <Form fluid>
                        <div className="preview-grid">
                          <div className="full-row">
                            <MyInput
                              width={180}
                              column
                              fieldType="checkbox"
                              fieldLabel="Current Smoker"
                              fieldName="isCurrentSmoker"
                              record={previewRow}
                              disabled
                            />
                          </div>

                          {previewRow.isCurrentSmoker && (
                            <>
                              <MyInput
                                width={180}
                                column
                                fieldType="text"
                                fieldLabel="Start date"
                                fieldName="smokeStartDate"
                                record={{
                                  smokeStartDate: previewRow.smokeStartDate
                                    ? new Date(previewRow.smokeStartDate).toLocaleDateString()
                                    : '-'
                                }}
                                disabled
                              />

                              <MyInput
                                width={110}
                                column
                                fieldType="text"
                                fieldLabel="Amount"
                                fieldName="cigaretteAmount"
                                record={{
                                  cigaretteAmount:
                                    previewRow.cigaretteAmount !== null &&
                                      previewRow.cigaretteAmount !== undefined
                                      ? previewRow.cigaretteAmount
                                      : '-'
                                }}
                                disabled
                                rightAddon="pack/day"
                                rightAddonwidth={80}
                              />

                              <MyInput
                                width={180}
                                column
                                fieldType="text"
                                fieldLabel="Cigarette Type"
                                fieldName="cigaretteType"
                                record={{ cigaretteType: previewRow.cigaretteType || '-' }}
                                disabled
                              />
                            </>
                          )}

                          <div className="full-row">
                            <MyInput
                              width={180}
                              column
                              fieldType="checkbox"
                              fieldLabel="Previous Smoker"
                              fieldName="isPreviousSmoker"
                              record={previewRow}
                              disabled
                            />
                          </div>

                          {previewRow.isPreviousSmoker && (
                            <div className="full-row">
                              <MyInput
                                width={180}
                                column
                                fieldType="text"
                                fieldLabel="Quit date"
                                fieldName="smokeQuitDate"
                                record={{
                                  smokeQuitDate: previewRow.smokeQuitDate
                                    ? new Date(previewRow.smokeQuitDate).toLocaleDateString()
                                    : '-'
                                }}
                                disabled
                              />
                            </div>
                          )}

                          <MyInput
                            width={180}
                            column
                            fieldType="checkbox"
                            fieldLabel="Exposure to second-hand smoke"
                            fieldName="exposureToSecondHandSmoke"
                            record={previewRow}
                            disabled
                          />

                          <div className="full-row">
                            <MyInput
                              width={180}
                              column
                              fieldType="checkbox"
                              fieldLabel="Alcohol Consumption"
                              fieldName="alcoholConsumption"
                              record={previewRow}
                              disabled
                            />
                          </div>

                          {previewRow.alcoholConsumption && (
                            <>
                              <MyInput
                                width={180}
                                column
                                fieldType="text"
                                fieldLabel="Since when"
                                fieldName="alcoholSinceWhen"
                                record={{
                                  alcoholSinceWhen: previewRow.alcoholSinceWhen
                                    ? new Date(previewRow.alcoholSinceWhen).toLocaleDateString()
                                    : '-'
                                }}
                                disabled
                              />

                              <MyInput
                                width={180}
                                column
                                fieldType="text"
                                fieldLabel="Type of alcohol"
                                fieldName="typeOfAlcohol"
                                record={{ typeOfAlcohol: previewRow.typeOfAlcohol || '-' }}
                                disabled
                              />
                            </>
                          )}

                          <div className="full-row">
                            <MyInput
                              width={180}
                              column
                              fieldType="checkbox"
                              fieldLabel="Substance Use"
                              fieldName="substanceUse"
                              record={previewRow}
                              disabled
                            />
                          </div>

                          {previewRow.substanceUse && (
                            <>
                              <MyInput
                                width={"15vw"}
                                column
                                fieldLabel="Route"
                                fieldName="route"
                                fieldType="select"
                                selectData={routeLov?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                disableByField='isValid'
                                selectDataValue="key"
                                record={previewRow}
                                disabled
                              />

                              <MyInput
                                width={"15vw"}
                                column
                                fieldLabel="Frequency"
                                fieldName="frequency"
                                fieldType="select"
                                selectData={freqLov?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                disableByField='isValid'
                                selectDataValue="key"
                                record={previewRow}
                                disabled
                              />
                            </>
                          )}

                          <MyInput
                            width={"10vw"}
                            column
                            fieldLabel="Physical limitations"
                            fieldName="physicalLimitation"
                            fieldType="select"
                            selectData={physicalLov?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            disableByField='isValid'

                            selectDataValue="key"
                            record={previewRow}
                            disabled
                          />

                          <MyInput
                            width={"10vw"}
                            column
                            fieldLabel="Diagnosed eating disorders"
                            fieldName="diagnosedEatingDisorders"
                            fieldType="select"
                            selectData={diagnoseLov?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            disableByField='isValid'

                            selectDataValue="key"
                            record={previewRow}
                            disabled
                          />

                          <MyInput
                            width={220}
                            column
                            fieldType="text"
                            fieldLabel={<Translate>Created By / At</Translate>}
                            fieldName="createdBy"
                            record={{
                              createdBy: previewRow?.createdDate
                                ? `${createdByFullName || previewRow?.createdBy || '-'} - ${formatDateWithoutSeconds(
                                  previewRow.createdDate
                                )}`
                                : createdByFullName || previewRow?.createdBy || '-'
                            }}
                            disabled
                          />

                          {previewRow.lastModifiedDate && (
                            <MyInput
                              width={220}
                              column
                              fieldType="text"
                              fieldLabel="Last Modified By / At"
                              fieldName="lastModifiedBy"
                              record={{
                                lastModifiedBy: `${lastModifiedByFullName || previewRow?.lastModifiedBy || '-'} - ${formatDateWithoutSeconds(
                                  previewRow.lastModifiedDate
                                )}`
                              }}
                              disabled
                            />
                          )}
                        </div>
                      </Form>
                    }
                  />
                </div>
              )}

              <CancellationModal
                open={openCancelModal}
                setOpen={() => {
                  setOpenCancelModal(false);
                  setCancelObject({
                    id: null,
                    status: '',
                    cancellationReason: ''
                  });
                }}
                handleCancle={handleCancel}
                object={cancelObject}
                setObject={setCancelObject}
                title="Social History"
                fieldLabel="Cancellation Reason"
                fieldName="cancellationReason"
                statusField="status"
                statusKey="CANCELLED"
                withReason
                required
                size="33vw"
              />

              <AddSocialHistory
                open={open}
                setOpen={() => {
                  setOpen(false);
                  setEditData(null);
                }}
                initialData={editData}
                patient={patient}
              />
            </div>
          }
        />
      </div>
    </div>
  );
};

export default SocialHistory;
