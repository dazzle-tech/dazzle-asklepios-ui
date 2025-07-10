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
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={mdtNote?.key ? 'Edit MdtNote' : 'New MdtNote'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={mdtNote?.key ? 'Save' : 'Create'}
      actionButtonFunction=""
      steps={[{ title: 'MdtNote Info', icon:<FontAwesomeIcon icon={faComment} />}]}
      size={width > 600 ? '36vw' : '25vw'}
    />
  );
};
export default AddEditMdtNote;
