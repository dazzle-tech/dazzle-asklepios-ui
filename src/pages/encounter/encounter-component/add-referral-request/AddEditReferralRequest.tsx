import MyModal from '@/components/MyModal/MyModal';
import React, { useState } from 'react';
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import './styles.less';
import { initialListRequest, ListRequest } from '@/types/types';
const AddEditReferralRequest = ({
  open,
  setOpen,
  width,
  referral,
setReferral
}) => {
 
  
  // Fetch referral Type Lov response
   const { data: referralTypeLovQueryResponse } = useGetLovValuesByCodeQuery('INTER_EXTER');
   const { data: referralReasonLovQueryResponse } = useGetLovValuesByCodeQuery('REFERRAL_REASONS');
    const [departmentListRequest] = useState<ListRequest>({ ...initialListRequest });
    const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid >
        <MyInput
          width="100%"
          selectData={referralTypeLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          fieldType="select"
          fieldName="referralType"
          record={referral}
          setRecord={setReferral}
          menuMaxHeight={200}
        />
        {referral?.referralType == '4925976052929804' && (
          <MyInput
            width="100%"
            fieldName="departmentKey"
            fieldType="select"
            selectData={departmentListResponse?.object ?? []}
            selectDataLabel="name"
            selectDataValue="key"
            record={referral}
            setRecord={setReferral}
            menuMaxHeight={200}
          />
        )}
        <MyInput
          width="100%"
          selectData={referralReasonLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          fieldType="select"
          fieldName="referralReason"
          record={referral}
          setRecord={setReferral}
          menuMaxHeight={200}
        />
        <MyInput
          width="100%"
          fieldType="textarea"
          fieldName="notes"
          record={referral}
          setRecord={setReferral}
        />
      </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={referral?.key ? 'Edit Referral Request' : 'New Referral Request'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={referral?.key ? 'Save' : 'Create'}
      actionButtonFunction=""
      steps={[{ title: 'Referral Request Info', icon:<FontAwesomeIcon icon={faComment} />}]}
       size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditReferralRequest;
