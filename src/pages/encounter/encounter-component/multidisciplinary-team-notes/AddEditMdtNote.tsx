import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import './styles.less';
const AddEditMdtNote = ({
  open,
  setOpen,
  width,
  mdtNote,
  setMdtNote,
}) => {
 
  
  // Fetch shifts Lov list response
  const { data: shiftsLovQueryResponse } = useGetLovValuesByCodeQuery('SHIFTS');
  // Fetch roles Lov list response
  const { data: rolesLovQueryResponse } = useGetLovValuesByCodeQuery('CLINICAL_JOB_ROLES');

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
              <MyInput
                fieldName="shift"
                fieldType="select"
                selectData={shiftsLovQueryResponse?.object ?? []}
                 selectDataLabel="lovDisplayVale"
 disableByField='isValid'

                selectDataValue="key"
                record={mdtNote}
                setRecord={setMdtNote}
                width="100%"
              />
             <MyInput
                fieldName="role"
                fieldType="select"
                selectData={rolesLovQueryResponse?.object ?? []}
                 selectDataLabel="lovDisplayVale"
 disableByField='isValid'

                selectDataValue="key"
                record={mdtNote}
                setRecord={setMdtNote}
                width="100%"
              />
              <MyInput
                width="100%"
                fieldName="name"
                record={mdtNote}
                setRecord={setMdtNote}
              />
              <MyInput
                width="100%"
                fieldName="note"
                fieldType='textarea'
                record={mdtNote}
                setRecord={setMdtNote}
              />
          </Form>
        );
    }
  };

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={mdtNote?.key ? 'MDT Notes' : 'MDT Notes'}
      position="right"
      content={<div dir={dir}> {conjureFormContent()} </div>}
      actionButtonLabel={mdtNote?.key ? 'Save' : 'Create'}
      actionButtonFunction=""
      steps={[{ title: 'MDT Notes', icon:<FontAwesomeIcon icon={faComment} />}]}
      size={width > 600 ? '36vw' : '25vw'}
    />
  );
};
export default AddEditMdtNote;
