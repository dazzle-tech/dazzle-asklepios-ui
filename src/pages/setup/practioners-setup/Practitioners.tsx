import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
import Details from './Details';
const { Column, HeaderCell, Cell } = Table;
import {
  useGetDepartmentsQuery,
  useGetFacilitiesQuery,
  useGetPractitionersQuery,
  useSavePractitionerMutation,
  useDeactiveActivePractitionerMutation,
  useRemovePractitionerMutation,
  useGetUserRecordQuery
} from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApPractitioner } from '@/types/model-types';
import { newApPractitioner } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import AdminIcon from '@rsuite/icons/Admin';
import { notify } from '@/utils/uiReducerActions';
import ReloadIcon from '@rsuite/icons/Reload';

const Practitioners = () => {
  const [practitioner, setPractitioner] = useState<ApPractitioner>({ ...newApPractitioner });
  const [popupOpen, setPopupOpen] = useState(false);
  const [newPrac, setnewPrac] = useState(false);

  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [facilityListRequest, setFacilityListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  const [departmentListRequest, setDepartmentListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true
  });
  const [edit_new, setEdit_new] = useState(false);

  const handleBack = () => {
    setEdit_new(false)
    setPractitioner(newApPractitioner)
    setnewPrac(false)

  }





  const [dactivePractitioner, dactivePractitionerMutation] = useDeactiveActivePractitionerMutation();
  const [removePractitioner, removePractitionerMutation] = useRemovePractitionerMutation();
  const { data: getOneUser } = useGetUserRecordQuery(
    { userId: practitioner.linkedUser },
    { skip: !practitioner.linkedUser } 
  );

  useEffect(() => {
    if (getOneUser) { 
      setPractitioner({
        ...practitioner,
        practitionerFullName: getOneUser.fullName ,
        practitionerFirstName:getOneUser.firstName,
        practitionerLastName:getOneUser.lastName,
        practitionerEmail:getOneUser.email,
        genderLkey:getOneUser.sexAtBirthLkey,
        practitionerPhoneNumber:getOneUser.phoneNumber

      });
    }
  }, [getOneUser]);

  const { data: facilityListResponse } = useGetFacilitiesQuery(facilityListRequest);
  const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);
  const { data: practitionerListResponse, refetch: refetchPractitioners } = useGetPractitionersQuery(listRequest);

  const handleNew = () => {
    setEdit_new(true);
    setnewPrac(true)
  };

  const handleEdit = () => {
    setEdit_new(true);
    setnewPrac(false)

  };

  // const handleSave = () => {
  //   setPopupOpen(false);
  //   savePractitioner(practitioner).unwrap();
  // };

  useEffect(() => {
    if (practitioner.primaryFacilityKey) {
      setDepartmentListRequest(
        addFilterToListRequest('facility_key', 'match', practitioner.primaryFacilityKey, {
          ...departmentListRequest,
          ignore: false
        })
      );
    }
  }, [practitioner.primaryFacilityKey]);



  const isSelected = rowData => {
    if (rowData && practitioner && rowData.key === practitioner.key) {
      return 'selected-row';
    } else return '';
  };

  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'startsWithIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };

  const handleDeactive = () => {
    console.log(practitioner)
    dactivePractitioner(practitioner).unwrap().then(() => {
      refetchPractitioners()
      setPractitioner(newApPractitioner)
    })
  };

  const handleDelete = () => {
    removePractitioner(practitioner).unwrap().then(() => {
      refetchPractitioners()
      setPractitioner(newApPractitioner)
    })
  };





  return (
    <div>


      {
        !edit_new ?
          <Panel
            header={
              <h3 className="title">
                <Translate>Practitioners</Translate>
              </h3>
            }
          >
            <ButtonToolbar>
              <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleNew}>
                Add New
              </IconButton>
              <IconButton
                disabled={!practitioner.key}
                appearance="primary"
                onClick={() => handleEdit()}
                color="green"
                icon={<EditIcon />}
              >
                Edit Selected
              </IconButton>


              <IconButton
                disabled={!practitioner.key}
                appearance="primary"
                color="red"
                icon={<TrashIcon />}
                onClick={() => { handleDelete() }}
              >
                Delete Selected
              </IconButton>
              {
                practitioner.isValid || practitioner.key == null ?
                  <IconButton
                    disabled={!practitioner.key}
                    appearance="primary"
                    color="orange"
                    icon={<TrashIcon />}
                    onClick={() => {
                      handleDeactive()
                    }}
                  >
                    Deactivate Selected
                  </IconButton>
                  :
                  <IconButton
                    disabled={!practitioner.key}
                    appearance="primary"
                    color="green"
                    icon={<ReloadIcon />}
                    onClick={() => {
                      handleDeactive()
                    }}
                  >
                    Activate
                  </IconButton>

              }


            </ButtonToolbar>
            <hr />
            <Table
              height={400}
              sortColumn={listRequest.sortBy}
              sortType={listRequest.sortType}
              onSortColumn={(sortBy, sortType) => {
                if (sortBy)
                  setListRequest({
                    ...listRequest,
                    sortBy,
                    sortType
                  });
              }}
              headerHeight={80}
              rowHeight={60}
              bordered
              cellBordered
              data={practitionerListResponse?.object ?? []}
              onRowClick={rowData => {
                setPractitioner(rowData);


              }}
              rowClassName={isSelected}
            >

              <Column sortable flexGrow={4}>
                <HeaderCell>
                  <Input onChange={e => handleFilterChange('practitionerFullName', e)} />
                  <Translate>Practitioner Name</Translate>
                </HeaderCell>
                <Cell dataKey="practitionerFullName" />
              </Column>

              <Column sortable flexGrow={3}>
                <HeaderCell>
                  <Input onChange={e => handleFilterChange('linkedUser', e)} />
                  <Translate>Linked User Name</Translate>
                </HeaderCell>
                <Cell dataKey="linkedUser" />
              </Column>

              {/* ============================ Practitioner Name ============================ */}

              <Column sortable flexGrow={3}>
                <HeaderCell>
                  <Input onChange={e => handleFilterChange('specialty', e)} />
                  <Translate>Specialty</Translate>
                </HeaderCell>
                <Cell dataKey="specialty" />
              </Column>

              <Column sortable flexGrow={2}>
                <HeaderCell>
                  <Input onChange={e => handleFilterChange('jobRole', e)} />
                  <Translate>Job Role</Translate>
                </HeaderCell>
                <Cell dataKey="jobRole" />
              </Column>

              <Column sortable flexGrow={2}>
                <HeaderCell>
                  <Input onChange={e => {
                    handleFilterChange('isValid', e);
                    console.log(e)
                  }} />

                  <Translate>Status</Translate>
                </HeaderCell>
                <Cell>
                  {rowData => (rowData.isValid ? <span style={{ color: "green" }}>Valid

                  </span> : <span style={{ color: "red" }}>Invalid

                  </span>)}
                </Cell>
              </Column>
            </Table>

            <div style={{ padding: 20 }}>
              <Pagination
                prev
                next
                first
                last
                ellipsis
                boundaryLinks
                maxButtons={5}
                size="xs"
                layout={['limit', '|', 'pager']}
                limitOptions={[5, 15, 30]}
                limit={listRequest.pageSize}
                activePage={listRequest.pageNumber}
                onChangePage={pageNumber => {
                  setListRequest({ ...listRequest, pageNumber });
                }}
                onChangeLimit={pageSize => {
                  setListRequest({ ...listRequest, pageSize });
                }}
                total={practitionerListResponse?.extraNumeric ?? 0}
              />
            </div>



            {/* <Modal open={popupOpen} overflow>
        <Modal.Title>
          <Translate>New/Edit Practitioner</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form fluid>
            <MyInput
              fieldName="practitionerFullName"
              record={practitioner}
              setRecord={setPractitioner}
            />
            <MyInput
              fieldName="primaryFacilityKey"
              fieldType="select"
              selectData={facilityListResponse?.object ?? []}
              selectDataLabel="facilityName"
              selectDataValue="key"
              record={practitioner}
              setRecord={setPractitioner}
            />
            <MyInput
              fieldName="departmentKey"
              fieldType="select"
              selectData={departmentListResponse?.object ?? []}
              selectDataLabel="name"
              selectDataValue="key"
              record={practitioner}
              setRecord={setPractitioner}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Stack spacing={2} divider={<Divider vertical />}>
            <Button appearance="primary" onClick={handleSave}>
              Save
            </Button>
            <Button appearance="primary" color="red" onClick={() => setPopupOpen(false)}>
              Cancel
            </Button>
          </Stack>
        </Modal.Footer>
      </Modal> */}
          </Panel>
          :

          // setEditSelected(false) ----  this will take me back to main page
          <Details practitionerData={practitioner} newPrac={newPrac} back={() => handleBack()} refetchPractitioners={() => refetchPractitioners()} />
      }
    </div>
  );
};

export default Practitioners;
