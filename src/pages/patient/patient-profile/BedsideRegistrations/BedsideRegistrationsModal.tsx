import MyModal from '@/components/MyModal/MyModal';
import React, { useState } from 'react';
import './styles.less';
import { GrScheduleNew } from 'react-icons/gr';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRepeat, faUser } from '@fortawesome/free-solid-svg-icons';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import MergePatient from './MergePatient';
import { Tooltip, Whisper } from 'rsuite';
import { useGetUnknownPatientsQuery } from '@/services/patient/patientService';
import { formatEnumString } from '@/utils';

const BedsideRegistrationsModal = ({ open, setOpen, setLocalPatient }) => {
  const [openMergePatient, setOpenMergePatient] = useState<boolean>(false);

  const { data: patientListResponse, isFetching } = useGetUnknownPatientsQuery({
    page: 0,
    size: 50,
    sort: 'id,asc'
  });
  // Icons column (Merge, Update Information)
  const iconsForActions = rowData => (
    <div className="container-of-icons">
      <Whisper placement="top" trigger="hover" speaker={<Tooltip>Merge</Tooltip>}>
        <FontAwesomeIcon
          icon={faRepeat}
          className="icons-style"
          onClick={() => {
            setOpenMergePatient(true);
          }}
        />
      </Whisper>

      <Whisper placement="top" trigger="hover" speaker={<Tooltip>Update Information</Tooltip>}>
        <FontAwesomeIcon
          icon={faUser}
          className="icons-style"
          onClick={() => {
            setLocalPatient(rowData);
            setOpen(false);
          }}
        />
      </Whisper>
    </div>
  );

  // Table columns
  const tableColumns = [
    {
      key: 'updateInformation',
      title: <Translate>Update Information</Translate>,
      render: rowData => iconsForActions(rowData)
    },
    {
      key: 'firstName',
      title: <Translate>Patient Name</Translate>
    },
    {
      key: 'medicalRecordNumber',
      title: <Translate>MRN</Translate>
    },
    {
      key: 'sexAtBirth',
      title: <Translate>Gender</Translate>,
      render: rowData => <span>{formatEnumString(rowData?.sexAtBirth)}</span>
    }
  ];

  // Modal content
  const conjureFormContent = () => {
    return (
      <>
        <MyTable
          data={patientListResponse?.data ?? []}
          columns={tableColumns}
          height={580}
          loading={isFetching}
        />
        <MergePatient open={openMergePatient} setOpen={setOpenMergePatient} />
      </>
    );
  };

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Bedside Registrations"
      position="right"
      content={<div dir={dir}>{conjureFormContent}</div>}
      hideActionBtn
      steps={[{ title: 'Bedside Registrations', icon: <GrScheduleNew /> }]}
    />
    </div>
  );
};
export default BedsideRegistrationsModal;
