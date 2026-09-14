import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBan,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';

import NewFlacc from './NewFlacc';
import Translate from '@/components/Translate/Translate';
import { FLACCPainScale } from '@/types/model-types-new';
import {
  useCancelFLACCPainScaleMutation,
  useGetFLACCPainScalesByEncounterQuery
} from '@/services/encounters/flaccPainSacoreService';
import { useLocation } from 'react-router-dom';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  conjureValueBasedOnKeyFromListOfValues,
  extractErrorMessage,
  formatDateWithoutSeconds,
  formatEnumString
} from '@/utils';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { MdModeEdit } from 'react-icons/md';
import CancellationModal from '@/components/CancellationModal';
import MyInput from '@/components/MyInput';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';

const FlaccComponent = ({ ...props }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const patient = props.patient ?? location.state?.patient ?? {};
  const encounter = props.encounter ?? location.state?.encounter ?? {};

  const [openFlaccModal, setOpenFlaccModal] = useState(false);
  const [showCanceled, setShowCanceled] = useState({
    showCancelled: false
  });
  const [selectedRecord, setSelectedRecord] =
    useState<FLACCPainScale | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [cancelObject, setCancelObject] = useState<any>({});

  const {
    data: flaccData = [],
    refetch
  } = useGetFLACCPainScalesByEncounterQuery(
    {
      encounterId: encounter?.id,
      showCancelled: showCanceled?.showCancelled
    },
    {
      skip: !encounter?.id
    }
  );

  const [cancelFLACCPainScale, { isLoading: isCancelling }] =
    useCancelFLACCPainScaleMutation();

  const { data: faceFlaccLovQueryResponse } =
    useGetLovValuesByCodeQuery('FLACC_FACE');

  const { data: legsFlaccLovQueryResponse } =
    useGetLovValuesByCodeQuery('FLACC_LEGS');

  const { data: activityFlaccLovQueryResponse } =
    useGetLovValuesByCodeQuery('FLACC_ACTIVITY');

  const { data: cryFlaccLovQueryResponse } =
    useGetLovValuesByCodeQuery('FLACC_CRY');

  const { data: consolabilityFlaccLovQueryResponse } =
    useGetLovValuesByCodeQuery('FLACC_CONSO');

  const isSelected = (rowData: FLACCPainScale) =>
    rowData?.id === selectedRecord?.id ? 'selected-row' : '';

  const handleAdd = () => {
    setSelectedRecord(null);
    setEditMode(false);
    setOpenFlaccModal(true);
  };

  const handleEdit = (row: FLACCPainScale) => {
    if (row.status === 'CANCELLED') {
      dispatch(
        notify({
          msg: 'Cancelled FLACC records cannot be edited.',
          sev: 'warning'
        })
      );
      return;
    }

    setSelectedRecord(row);
    setEditMode(true);
    setOpenFlaccModal(true);
  };

  const handleCancel = () => {
    if (!selectedRecord) {
      dispatch(
        notify({
          msg: 'Please select a FLACC record to cancel.',
          sev: 'warning'
        })
      );
      return;
    }

    if (selectedRecord.status === 'CANCELLED') {
      dispatch(
        notify({
          msg: 'This FLACC record is already cancelled.',
          sev: 'warning'
        })
      );
      return;
    }

    setCancelObject({
      ...selectedRecord,
      cancellationReason: ''
    });

    setOpenCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelObject?.id) {
      dispatch(
        notify({
          msg: 'Please select a FLACC record to cancel.',
          sev: 'warning'
        })
      );
      return;
    }

    if (
      !cancelObject?.cancellationReason ||
      !cancelObject.cancellationReason.trim()
    ) {
      dispatch(
        notify({
          msg: 'Cancellation reason is required.',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      await cancelFLACCPainScale({
        id: cancelObject.id,
        cancellationReason: cancelObject.cancellationReason
      }).unwrap();

      dispatch(
        notify({
          msg: 'FLACC record cancelled successfully.',
          sev: 'success'
        })
      );

      setOpenCancelModal(false);
      setCancelObject({});
      setSelectedRecord(null);

      await refetch();
    } catch (error: any) {
      dispatch(
                notify({
                  msg: extractErrorMessage(error) || 'Failed to cancel FLACC record',
                  sev: 'warning',
                })
              );
    }
  };

  const flaccColumns = [
    {
      key: 'totalScore',
      title: 'Total Score'
    },
    {
      key: 'painLevel',
      title: 'Pain Level',
      render: (row: FLACCPainScale) =>
        formatEnumString(row?.painLevel ?? '') ?? '-'
    },
    {
      key: 'face',
      title: 'Face',
      render: (row: FLACCPainScale) =>
        conjureValueBasedOnKeyFromListOfValues(
          faceFlaccLovQueryResponse?.object ?? [],
          row?.face ?? '',
          'lovDisplayVale'
        ) ?? '-'
    },
    {
      key: 'legs',
      title: 'Legs',
      render: (row: FLACCPainScale) =>
        conjureValueBasedOnKeyFromListOfValues(
          legsFlaccLovQueryResponse?.object ?? [],
          row?.legs ?? '',
          'lovDisplayVale'
        ) ?? '-'
    },
    {
      key: 'activity',
      title: 'Activity',
      render: (row: FLACCPainScale) =>
        conjureValueBasedOnKeyFromListOfValues(
          activityFlaccLovQueryResponse?.object ?? [],
          row?.activity ?? '',
          'lovDisplayVale'
        ) ?? '-'
    },
    {
      key: 'cry',
      title: 'Cry',
      render: (row: FLACCPainScale) =>
        conjureValueBasedOnKeyFromListOfValues(
          cryFlaccLovQueryResponse?.object ?? [],
          row?.cry?? '',
          'lovDisplayVale'
        ) ?? '-'
    },
    {
      key: 'consolability',
      title: 'Consolability',
      render: (row: FLACCPainScale) =>
        conjureValueBasedOnKeyFromListOfValues(
          consolabilityFlaccLovQueryResponse?.object ?? [],
          row?.consolability ?? '',
          'lovDisplayVale'
        ) ?? '-'
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: FLACCPainScale) => {
        let color = 'var(--primary-gray)';

        if (row.status === 'CANCELLED') {
          color = '#ff8902ff';
        } else if (row.status === 'ACTIVE') {
          color = '#388E3C';
        }

        return (
          <MyBadgeStatus
            color={color}
            contant={row.status}
          />
        );
      }
    },
    {
      key: 'createdBy/AT',
      title: 'Created By/At',
      expandable: true,
      render: row => (
        <>
          {row.createdBy}
          <br />
          <span className="date-table-style">{formatDateWithoutSeconds(row.createdDate)}</span>
        </>
      )
    },
    {
      key: 'cancelledBy/AT',
      title: 'Cancelled By/At',
      expandable: true,
      render: row => (
        <>
          {row.cancelledBy}
          <br />
          <span className="date-table-style">{formatDateWithoutSeconds(row.cancelledAt)}</span>
        </>
      )
    },
    {
      key: 'cancellationReason',
      title: 'Cancellation Reason',
      expandable: true
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row: FLACCPainScale) => (
        <MdModeEdit
          title="Edit"
          size={24}
          fill="var(--primary-gray)"
          className="icons-style"
          style={{ cursor: row.status === 'ACTIVE' ? 'pointer' : 'not-allowed' }}
          onClick={() =>{ 
            if (row.status === 'ACTIVE') {
            handleEdit(row)
            }
          }
          }
        />
      )
    }
  ];

  const tableButtons = (
    <>
      <div className="table-buttons-left-part-handle-positions show-cancelled">
        <MyInput
          fieldName="showCancelled"
          fieldType="check"
          record={showCanceled}
          setRecord={setShowCanceled}
          showLabel={false}
        />
      </div>

      <div className="bt-right">
        <MyButton
          disabled={
            !selectedRecord ||
            selectedRecord.status === 'CANCELLED' ||
            isCancelling
          }
          onClick={handleCancel}
        >
          <FontAwesomeIcon icon={faBan} />
          <Translate>Cancel</Translate>
        </MyButton>

        <MyButton onClick={handleAdd}>
          <FontAwesomeIcon icon={faPlus} />
          <Translate>Add</Translate>
        </MyButton>
      </div>
    </>
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <MyTable
        data={flaccData}
        columns={flaccColumns}
        tableButtons={tableButtons}
        onRowClick={(row: FLACCPainScale) => {
          setSelectedRecord(row);
        }}
        rowClassName={isSelected}
      />

      <NewFlacc
        open={openFlaccModal}
        setOpen={setOpenFlaccModal}
        patient={patient}
        encounter={encounter}
        edit={editMode}
        recordToEdit={selectedRecord}
        refetch={refetch}
      />

      <CancellationModal
        open={openCancelModal}
        setOpen={setOpenCancelModal}
        handleCancle={handleConfirmCancel}
        object={cancelObject}
        setObject={setCancelObject}
        fieldLabel="Cancellation Reason"
        title="FLACC Record"
        fieldName="cancellationReason"
        statusField="status"
        statusKey="CANCELLED"
        withReason={true}
        required={true}
        size="30vw"
        bodyheight="auto"
      />
    </div>
  );
};

export default FlaccComponent;

