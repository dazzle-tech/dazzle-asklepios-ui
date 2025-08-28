import MyModal from '@/components/MyModal/MyModal';
import React, { useState } from 'react';
import './styles.less';
import { GrScheduleNew } from 'react-icons/gr';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRepeat } from '@fortawesome/free-solid-svg-icons';
import { faUser } from "@fortawesome/free-solid-svg-icons";
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetTransferPatientsListQuery } from '@/services/encounterService';
const BedsideRegistrationsModal = ({ open, setOpen }) => {

     const [listRequest, setListRequest] = useState<ListRequest>({
             ...initialListRequest,
             filters: []
         });
         //fetch transfer patients list
         const {
             data: transferPatientsListResponse,
             isFetching,
             refetch,
             isLoading
         } = useGetTransferPatientsListQuery(listRequest);
          console.log("list");
         console.log(transferPatientsListResponse);

      // Icons column (Edit, reactive/Deactivate)
      const iconsForActions = () => (
        <div className="container-of-icons">
        <FontAwesomeIcon icon={faRepeat} className='icons-style' title='Merge' />
         <FontAwesomeIcon icon={faUser} className='icons-style' title='Update Information' />
        </div>
      );
      // Table columns definition
      const tableColumns = [
        {
          key: 'updateInformation',
          title: <Translate>Update Information</Translate>,
           render: () => iconsForActions()
        },
        {
          key: 'fullName',
          title: <Translate>Patient Name</Translate>,
        },
        {
          key: 'patientMrn',
          title: <Translate>MRN</Translate>,
          
        },
        {
          key: 'encountertype',
          title: <Translate>Visit ID</Translate>,
        },
        {
          key: 'sexAtBirthLkey',
          title: <Translate>Sex at Birth</Translate>,
        },
      ];

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return(
         <MyTable
         data={transferPatientsListResponse?.object ?? []}
         columns={tableColumns}
         height={580}
         loading={isFetching} 
         />
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
      //   actionButtonLabel={resources?.key ? 'Save' : 'Create'}
      hideActionBtn
      //   actionButtonFunction={handleSave}
      steps={[{ title: 'Bedside Registrations', icon: <GrScheduleNew /> }]}
      //   size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default BedsideRegistrationsModal;
