import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaBedPulse } from 'react-icons/fa6';
import { MdAttachFile, MdModeEdit } from 'react-icons/md';
import { Checkbox, Loader } from 'rsuite';
import './styles.less';
import PreviewProcedure from './PreviewProcedure';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import BlockIcon from '@rsuite/icons/Block';
import { useLocation } from 'react-router-dom';
import Details from './Details';
import Perform from './Perform';
import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';
import { useGetProceduresQuery as useGetAllProceduresQuery } from '@/services/setup/procedure/procedureService';
import {
  useFindProcdureByEncounterQuery,
  useCreateProcdureMutation,
  useUpdateProcdureMutation,
  useCancelProcdureMutation
} from '@/services/patients/patientProcedureService';
import { useLazyGetProcedureByIdQuery } from '@/services/setup/procedure/procedureService';
import { useLazyGetActiveDepartmentByFacilityListQuery } from '@/services/security/departmentService';
import { cond } from 'lodash';
import { useGetProceduresByIdsQuery } from '@/services/setup/procedure/procedureService';
import { useGetIcdDiagnosesByIdsQuery } from '@/services/setup/icdTreeService';
import './styles.less';

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'REQUESTED':
      return '#E6A100';
    case 'CONFIRMED':
    case 'COMPLETED':
      return '#0DAA41';
    case 'CANCELLED':
      return '#D64545';
    case 'IN_PROGRESS':
      return '#0B5ED7';
    case 'READY':
      return '#17A2B8';
    default:
      return '#6c757d';
  }
};

const TableLoader = () => (
  <div className="table-loader">
    <Loader size="xs" />
    <span className="table-loader-text">Loading...</span>
  </div>
);

const Referrals = (props: any) => {
  const location = useLocation();
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const [showPreview, setShowPreview] = useState(false);
  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;
  const authSlice = useAppSelector(state => state.auth);
  const jobRole = String(authSlice.user?.jobRole ?? '').toUpperCase();
  const isNurse = jobRole === 'NURSE';
  const dispatch = useAppDispatch();
  const [showCanceled, setShowCanceled] = useState(false);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [openPerformModal, setOpenPerformModal] = useState(false);
  const [indicationsDescription, setindicationsDescription] = useState<string>('');
  const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [procedure, setProcedure] = useState<any>({
    encounterId: encounter?.id,
    patientId: patient?.id,
    currentDepartment: true
  });

  const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');

  const isSelected = (rowData: any) =>
    rowData && procedure && rowData.id === procedure.id ? 'selected-row' : '';

  const [createProcedure] = useCreateProcdureMutation();
  const [updateProcedure] = useUpdateProcdureMutation();
  const [cancelProcedure] = useCancelProcdureMutation();
  const [getProcedureById] = useLazyGetProcedureByIdQuery();
  const [getDepartmentsByFacility] = useLazyGetActiveDepartmentByFacilityListQuery();

  const {
    data: proceduresData,
    refetch: proRefetch,
    isLoading: procedureLoding
  } = useFindProcdureByEncounterQuery(
    {
      encounterId: encounter?.id,
      page,
      size: pageSize,
      includeCancelled: showCanceled
    },
    { skip: !encounter?.id }
  );

  const procedures = proceduresData?.data ?? [];
  const totalCount = proceduresData?.totalCount ?? 0;

  const isFormField = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest(`
        input, textarea, select, button, [contenteditable="true"],
        .rs-input, .rs-picker, .rs-checkbox, .rs-btn, .rs-datepicker,
        .rs-picker-toggle, .rs-calendar, .rs-dropdown, .rs-auto-complete,
        .rs-input-group, .rs-select, .rs-slider
      `) !== null
    );
  };

  const isInsideModalOrPopup = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest(`
        .rs-modal, .rs-drawer, .rs-picker-select-menu,
        .rs-picker-popup, .my-modal, .my-popup
      `) !== null
    );
  };

  const isTableDataRow = (node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      node.closest('.rs-table-row, .MuiTableRow-root, [data-row="true"], [role="row"]') !== null &&
      node.closest('.rs-table-row-header, .MuiTableHead-root, [data-header="true"]') === null
    );
  };

  const handleClear = useCallback(() => {
    setProcedure({
      encounterId: encounter?.id,
      patientId: patient?.id,
      currentDepartment: true,
      indicationId: null,
      bodyPart: '',
      side: null,
      toFacilityId: null,
      priority: 'NORMAL',
      procedureLevel: 'MINOR',
      toDepartmentId: null,
      categoryId: null,
      procedureId: null,
      procedureObj: null,
      procedureName: null,
      notes: null,
      extraDocumentation: null,
      scheduledDateTime: null
    });
    setShowPreview(false);
    setEditing(false);
  }, [encounter?.id, patient?.id]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as EventTarget | null;
      if (isFormField(target) || isInsideModalOrPopup(target)) return;

      const insideTable = tableContainerRef.current?.contains(target as Node) ?? false;
      const onRow = isTableDataRow(target);

      if (!insideTable) {
        handleClear();
        return;
      }

      if (insideTable && !onRow) {
        handleClear();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClear();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [handleClear]);

  const OpenPerformModel = () => setOpenPerformModal(true);

  const handleSave = async () => {
    try {
      const procedureData = {
        ...procedure,
        indications: indicationsDescription,
        encounterId: encounter?.id,
        patientId: patient?.id
      };

      if (procedure?.id) {
        await updateProcedure({ id: procedure.id, ...procedureData }).unwrap();
      } else {
        await createProcedure(procedureData).unwrap();
      }

      proRefetch();
      handleClear();
      dispatch(notify('Saved successfully'));
    } catch (error) {
      dispatch(notify('Save failed'));
    }
  };

  const CloseCancellationReasonModel = () => setOpenCancellationReasonModel(false);

  const handleCancle = async () => {
    try {
      if (!procedure?.id) {
        dispatch(notify({ msg: 'No procedure selected', sev: 'warning' }));
        return;
      }

      await cancelProcedure({
        id: procedure.id,
        cancellationReason: procedure.cancellationReason || ''
      }).unwrap();

      proRefetch();
      dispatch(notify({ msg: 'Procedure cancelled successfully', sev: 'success' }));
      CloseCancellationReasonModel();
      handleClear();
    } catch (error) {
      dispatch(notify({ msg: 'Cancellation failed', sev: 'warning' }));
    }
  };

  const handelAddNew = () => {
    handleClear();
    setOpenDetailsModal(true);
  };

  const procedureIds = useMemo(() => {
    const ids = procedures.map(p => Number(p.procedureId)).filter(id => !isNaN(id));

    return Array.from(new Set(ids));
  }, [procedures]);

  const indicationIds = useMemo(() => {
    const ids: Array<number | string> = [];

    procedures.forEach(p => {
      if (!p.indicationId) return;

      if (Array.isArray(p.indicationId)) {
        ids.push(...p.indicationId);
      } else {
        ids.push(p.indicationId);
      }
    });

    return Array.from(new Set(ids));
  }, [procedures]);

  const { data: proceduresByIds } = useGetProceduresByIdsQuery(procedureIds, {
    skip: !procedureIds.length
  });
  const { data: icdDiagnoses } = useGetIcdDiagnosesByIdsQuery(
    { ids: indicationIds },
    { skip: !indicationIds.length }
  );

  const proceduresMap = useMemo(() => {
    const map = new Map<number, any>();
    (proceduresByIds ?? []).forEach(p => {
      map.set(p.id, p);
    });
    return map;
  }, [proceduresByIds]);

  const icdMap = useMemo(() => {
    const map = new Map<number | string, any>();

    (icdDiagnoses ?? []).forEach(d => {
      map.set(d.id ?? d.icdDiagnosisUid, d);
    });

    return map;
  }, [icdDiagnoses]);

  const tableColumns = useMemo(
    () => [
      {
        key: 'procedureId',
        dataKey: 'procedureId',
        title: <Translate>PROCEDURE ID</Translate>,
        flexGrow: 1,
        render: (rowData: any) => rowData?.procedureId ?? ''
      },
      {
        key: 'procedureName',
        title: <Translate>Procedure Name</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          if (!proceduresByIds && procedureIds.length > 0) {
            return <TableLoader />;
          }

          const proc = proceduresMap.get(Number(rowData.procedureId));
          return proc?.name ?? '';
        }
      },
      {
        key: 'scheduledDateTime',
        dataKey: 'scheduledDateTime',
        title: <Translate>SCHEDULED DATE TIME</Translate>,
        flexGrow: 1,
        render: (rowData: any) =>
          rowData?.scheduledDateTime ? formatDateWithoutSeconds(rowData.scheduledDateTime) : ' '
      },
      {
        key: 'categoryType',
        dataKey: 'categoryType',
        title: <Translate>CATEGORY</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          if (!proceduresByIds && procedureIds.length > 0) {
            return <TableLoader />;
          }

          const proc = proceduresMap.get(Number(rowData.procedureId));

          const category = CategoryLovQueryResponse?.object?.find(
            (item: any) => item.key === proc?.categoryType
          );

          return category?.lovDisplayVale || '';
        }
      },
      {
        key: 'priority',
        dataKey: 'priority',
        title: <Translate>PRIORITY</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          return formatEnumString(rowData?.priority);
        }
      },
      {
        key: 'procedureLevel',
        dataKey: 'procedureLevel',
        title: <Translate>LEVEL</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          return formatEnumString(rowData?.procedureLevel);
        }
      },
      {
        key: 'indicationId',
        title: <Translate>INDICATIONS</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          if (!rowData?.indicationId) return '';

          if (!icdDiagnoses && indicationIds.length > 0) {
            return <TableLoader />;
          }

          const ids = Array.isArray(rowData.indicationId)
            ? rowData.indicationId
            : [rowData.indicationId];

          const names = ids
            .map((id: any) => {
              const diag = icdMap.get(Number(id));
              return diag?.icdShortDescription || diag?.icdCode;
            })
            .filter(Boolean);

          return names.join(', ');
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
                  setProcedure(rowData);
                  setAttachmentsModalOpen(true);
                }
              }}
              className={rowData?.id ? 'attachment-icon active' : 'attachment-icon disabled'}
            />
          );
        }
      },
      {
        key: 'status',
        dataKey: 'status',
        title: <Translate>STATUS</Translate>,
        flexGrow: 1.5,
        minWidth: 110,
        render: (rowData: any) => {
          const status = String(rowData?.status ?? '').toUpperCase();
          const statusDisplay = status ? status.replace(/_/g, ' ') : '';
          return <MyBadgeStatus contant={statusDisplay} color={getStatusColor(status)} />;
        }
      },
      {
        key: 'edit',
        dataKey: '',
        title: <Translate>EDIT</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          const isCancelled = rowData?.status === 'CANCELLED';
          return (
            <MdModeEdit
              size={24}
              fill={isCancelled ? '#ccc' : 'var(--primary-gray)'}
              className={isCancelled ? 'edit-icon disabled' : 'edit-icon'}
              style={{
                cursor: isCancelled ? 'not-allowed' : 'pointer',
                opacity: isCancelled ? 0.5 : 1
              }}
              onClick={async e => {
                e.stopPropagation();

                if (isCancelled) {
                  dispatch(
                    notify({
                      msg: 'Cancelled procedure cannot be edited',
                      sev: 'warning'
                    })
                  );
                  return;
                }

                if (!rowData?.procedureId) {
                  dispatch(notify({ msg: 'Procedure ID is missing', sev: 'warning' }));
                  return;
                }

                try {
                  const procedureRes = await getProcedureById({
                    id: rowData.procedureId
                  }).unwrap();

                  const updatedProcedure = {
                    ...rowData,
                    procedureId: procedureRes.id,
                    procedureObj: procedureRes,
                    procedureName: procedureRes.name,
                    categoryId:
                      procedureRes.categoryType || procedureRes.category || rowData.categoryId,

                    toDepartmentId:
                      rowData.toDepartmentId ||
                      procedureRes.toDepartmentId ||
                      procedureRes.departmentId ||
                      procedureRes.department?.id,

                    procedureLevel:
                      rowData.procedureLevel ||
                      procedureRes.procedureLevel ||
                      procedureRes.level ||
                      procedureRes.procedureLevelId
                  };

                  setProcedure(updatedProcedure);
                  setOpenDetailsModal(true);
                } catch (error) {
                  dispatch(notify({ msg: 'Failed to load procedure details', sev: 'warning' }));
                }
              }}
            />
          );
        }
      },
      {
        key: 'created',
        title: <Translate>CREATED AT/BY</Translate>,
        expandable: true,
        render: (rowData: any) => (
          <>
            <span>{rowData?.createdBy ?? ''}</span>
            <br />
            <span className="date-table-style">
              {rowData?.createdDate ? formatDateWithoutSeconds(rowData.createdDate) : ''}
            </span>
          </>
        )
      },
      {
        key: 'updated',
        title: <Translate>UPDATED AT/BY</Translate>,
        expandable: true,
        render: (rowData: any) => (
          <>
            <span>{rowData?.lastModifiedBy ?? ''}</span>
            <br />
            <span className="date-table-style">
              {rowData?.lastModifiedDate ? formatDateWithoutSeconds(rowData.lastModifiedDate) : ''}
            </span>
          </>
        )
      },
      {
        key: 'cancelled',
        title: <Translate>CANCELLED AT/BY</Translate>,
        expandable: true,
        render: (rowData: any) => (
          <>
            <span>{rowData?.cancelledBy ?? ''}</span>
            <br />
            <span className="date-table-style">
              {rowData?.cancelledDate ? formatDateWithoutSeconds(rowData.cancelledDate) : ''}
            </span>
          </>
        )
      },
      {
        key: 'cancellationReason',
        dataKey: 'cancellationReason',
        title: <Translate>CANCELLATION REASON</Translate>,
        flexGrow: 1,
        expandable: true
      }
    ],
    [
      CategoryLovQueryResponse,
      proceduresMap,
      dispatch,
      getProcedureById,
      icdMap,
      proceduresByIds,
      icdDiagnoses,
      procedureIds,
      indicationIds
    ]
  );

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    if (openDetailsModal && procedure?.toFacilityId) {
      getDepartmentsByFacility({ facilityId: procedure.toFacilityId });
    }
  }, [openDetailsModal, procedure?.toFacilityId, getDepartmentsByFacility]);

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <div ref={tableContainerRef}>
        <MyTable
          columns={tableColumns}
          data={procedures}
          onRowClick={async rowData => {
            try {
              if (rowData?.procedureId) {
                const procedureRes = await getProcedureById({
                  id: rowData.procedureId
                }).unwrap();

                const updatedProcedure = {
                  ...rowData,
                  categoryId:
                    procedureRes.categoryType || procedureRes.category || rowData.categoryId,
                  procedureId: procedureRes.id
                };

                setProcedure(updatedProcedure);
                setEditing(rowData?.status === 'CANCELLED');
                setShowPreview(true);
              } else {
                setProcedure(rowData);
                setEditing(rowData?.status === 'CANCELLED');
                setShowPreview(true);
              }
            } catch (error) {
              setProcedure(rowData);
              setEditing(rowData?.status === 'CANCELLED');
              setShowPreview(true);
            }
          }}
          loading={procedureLoding}
          rowClassName={isSelected}
          page={page}
          rowsPerPage={pageSize}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          tableButtons={
            <div className="bt-div-2">
              <div className="bt-left-2">
                <MyButton
                  onClick={() => setOpenCancellationReasonModel(true)}
                  disabled={
                    isNurse ||
                    (edit ? true : procedure?.id ? procedure?.status === 'CANCELLED' : true)
                  }
                  prefixIcon={() => <BlockIcon />}
                >
                  Cancel
                </MyButton>
                <Checkbox
                  checked={showCanceled}
                  onChange={() => {
                    setShowCanceled(!showCanceled);
                    if (!showCanceled) setEditing(true);
                  }}
                >
                  <Translate>Show Cancelled</Translate>
                </Checkbox>
              </div>
              <div className="bt-right-2">
                <MyButton disabled={edit || isNurse} onClick={handelAddNew}>
                  Add Procedure
                </MyButton>
              </div>
            </div>
          }
        />
      </div>

      {showPreview && (
        <div className="preview-section">
          <PreviewProcedure procedure={procedure} encounter={encounter} patient={patient} />
        </div>
      )}

      <MyModal
        open={openPerformModal}
        setOpen={setOpenPerformModal}
        title="Perform Details"
        actionButtonFunction={handleSave}
        size="full"
        content={
          <div dir={dir}>
            <Perform
              proRefetch={proRefetch}
              encounter={encounter}
              patient={patient}
              procedure={procedure}
              setProcedure={setProcedure}
              edit={edit}
            />
          </div>
        }
      />

      <Details
        patient={patient}
        proRefetch={proRefetch}
        encounter={encounter}
        edit={edit}
        procedure={procedure}
        setProcedure={setProcedure}
        openDetailsModal={openDetailsModal}
        setOpenDetailsModal={setOpenDetailsModal}
      />

      <CancellationModal
        open={openCancellationReasonModel}
        setOpen={setOpenCancellationReasonModel}
        fieldName="cancellationReason"
        fieldLabel="Cancellation Reason"
        title="Cancellation"
        object={procedure}
        setObject={setProcedure}
        handleCancle={handleCancle}
        required
      />

      <MyModal
        open={attachmentsModalOpen}
        setOpen={setAttachmentsModalOpen}
        title={`Attachments - ${procedure?.procedureName || 'Procedure'}`}
        size="lg"
        hideActionBtn={true}
        content={
          <div dir={dir}>
            <EncounterAttachment
              localEncounter={encounter}
              source="PROCEDURE_REQUEST_ATTACHMENT"
              sourceId={procedure?.id ? Number(procedure.id) : undefined}
              refetchAttachmentList={false}
              setRefetchAttachmentList={() => {}}
            />
          </div>
        }
      />
    </div>
  );
};

export default Referrals;
