import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import { Checkbox, Form } from 'rsuite';
import './styles.less';
import { HiDocumentDuplicate } from 'react-icons/hi2';

import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetAvailableForRoleQuery } from '@/services/potintialDuplicateService';
import { useUpdateFacilityMutation } from '@/services/security/facilityService';

const LinkedFacility = ({ open, setOpen, width, Candidate }) => {


  // Fetch Facility list response
  const { data: facilityListResponse, refetch: fetchFaci, isFetching } = useGetAvailableForRoleQuery(Candidate?.id, { skip: !Candidate?.id });
  console.log("Facilitys", facilityListResponse)
  // save facility

  const [updateFacility, updateFacilityMutation] = useUpdateFacilityMutation();
  //Table columns
  const tableColumns = [
    {
      key: 'role',
      title: <Translate>Role</Translate>,
      render: rowData => (
        <Checkbox
          key={rowData.id}
          checked={rowData.roolId !== null ? true : false}
          onChange={(value, checked) => {
            if (checked) {
              updateFacility({ ...rowData, roolId: Candidate.id })
                .unwrap()
                .then(fetchFaci);

            } else {
              updateFacility({ ...rowData, roolId: null })
                .unwrap()
                .then(fetchFaci);

            }
          }}
        />
      )
    },

    {
      key: 'name',
      title: <Translate>Name</Translate>
    },
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      render: rowData => rowData.type
    }
  ];

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyTable
              height={450}
              data={facilityListResponse ?? []}
              loading={isFetching}
              columns={tableColumns}
            />
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={'Linked Facilities'}
      position="right"
      content={conjureFormContent}
      hideActionBtn
      steps={[{ title: 'Linked Facilities', icon: <HiDocumentDuplicate /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default LinkedFacility;
