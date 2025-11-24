import MyModal from '@/components/MyModal/MyModal';
import React, { useState } from 'react';
import './styles.less';
import { GrScheduleNew } from 'react-icons/gr';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRepeat } from '@fortawesome/free-solid-svg-icons';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetPatientsQuery } from '@/services/patientService';
import MergePatient from './MergePatient';
import { Tooltip, Whisper } from 'rsuite';
const BedsideRegistrationsModal = ({ open, setOpen, setLocalPatient }) => {
  const [openMergePatient, setOpenMergePatient] = useState<boolean>(false);
  const [patient, setPatient] = useState({});
  const [listRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'unknown_patient',
        operator: 'match',
        value: true as any
      }
    ]
  });
  // Fetch unknown pqtients list
  const { data: patientListResponse, isFetching } = useGetPatientsQuery({
    ...listRequest,
    filterLogic: 'or'
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
            setPatient(rowData);
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
  // Table columns definition
  const tableColumns = [
    {
      key: 'updateInformation',
      title: <Translate>Update Information</Translate>,
      render: rowData => iconsForActions(rowData)
    },
    {
      key: 'fullName',
      title: <Translate>Patient Name</Translate>
    },
    {
      key: 'patientMrn',
      title: <Translate>MRN</Translate>
    },
    {
      key: 'encountertype',
      title: <Translate>Visit ID</Translate>
    },
    {
      key: 'genderLvalue',
      title: <Translate>Gender</Translate>,
      render: rowData => <span>{rowData?.genderLvalue?.lovDisplayVale}</span>
    }
  ];

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <>
            <MyTable
              data={patientListResponse?.object ?? []}
              columns={tableColumns}
              height={580}
              loading={isFetching}
            />
            <MergePatient open={openMergePatient} setOpen={setOpenMergePatient} patient={patient} />
          </>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Bedside Registrations"
      position="right"
      content={conjureFormContent}
      hideActionBtn
      steps={[{ title: 'Bedside Registrations', icon: <GrScheduleNew /> }]}
    />
  );
};
export default BedsideRegistrationsModal;
