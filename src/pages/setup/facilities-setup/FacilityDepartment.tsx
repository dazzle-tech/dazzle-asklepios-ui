import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';

const FacilityDepartment = ({ open, setOpen, departments, width }) => {
  // Table columns
  const tableColumns = [
    {
      key: 'name',
      title: <Translate>Department Name</Translate>,
      flexGrow: 4,
      dataKey: 'name'
    },
    {
      key: 'departmentTypeLkey',
      title: <Translate>Department Type</Translate>,
      flexGrow: 4,
      dataKey: 'departmentTypeLkey'
    }
  ];
  // Modal content
  const conjureFormContent = () => {
    return <MyTable height={300} data={departments ?? []} columns={tableColumns} />;
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={'Facility Departments'}
      position="right"
      content={conjureFormContent}
      hideActionBtn
      hideBack
      hideCanel
      size={width > 600 ? '570px' : '300px'}
    />
  );
};
export default FacilityDepartment;
