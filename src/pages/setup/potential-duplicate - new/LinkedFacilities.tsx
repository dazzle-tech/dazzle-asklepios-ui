import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import { Checkbox, Form } from 'rsuite';
import './styles.less';
import { HiDocumentDuplicate } from 'react-icons/hi2';
import {
  useGetFacilitiesQuery,
  useSaveFacilityMutation
} from '@/services/setupService';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { initialListRequest, ListRequest } from '@/types/types';

const LinkedFacility = ({ open, setOpen, width, Candidate }) => {

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filterLogic: 'or',
    filters: [
      {
        fieldName: 'rool_key',
        operator: 'isNull',
        value: true
      },
      {
        fieldName: 'rool_key',
        operator: 'match',
        value: Candidate?.key
      }
    ]
  });
  // Fetch Facility list response
   const { data: facilityListResponse, refetch: fetchFaci, isFetching } = useGetFacilitiesQuery(listRequest);
   // save facility
   const [saveFacility] = useSaveFacilityMutation();
  useEffect(() => {
    setListRequest({
      ...initialListRequest,
      filterLogic: 'or',
      filters: [
        {
          fieldName: 'rool_key',
          operator: 'isNull',
          value: true
        },
        {
          fieldName: 'rool_key',
          operator: 'match',
          value: Candidate?.key
        }
      ]
    });
  }, [Candidate]);
 
  //Table columns
  const tableColumns = [
    {
      key: 'role',
      title: <Translate>Role</Translate>,
      render: rowData => (
        <Checkbox
          key={rowData.id}
          checked={rowData.roolKey !== null ? true : false}
          onChange={(value, checked) => {
            if (checked) {
              saveFacility({ ...rowData, roolKey: Candidate.key })
                .unwrap()
                .then(() => {
                  fetchFaci();
                });
            } else {
              saveFacility({ ...rowData, roolKey: null })
                .unwrap()
                .then(() => {
                  fetchFaci();
                });
            }
          }}
        />
      )
    },
    {
      key: 'id',
      title: <Translate>ID</Translate>,
      render: rowData => rowData.facilityId
    },
    {
      key: 'facilityName',
      title: <Translate>Name</Translate>
    },
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      render: rowData => rowData.facilityType
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
              data={facilityListResponse?.object ?? []}
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
