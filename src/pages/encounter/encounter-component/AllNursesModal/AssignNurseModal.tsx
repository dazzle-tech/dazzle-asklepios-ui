
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useAssignNurseMutation,
  useGetEncounterAuditQuery
} from '@/services/encounters/patientEncounterService';
import { useGetUsersBasicQuery } from '@/services/userService';
import { notify } from '@/utils/uiReducerActions';
import React, { useState } from 'react';
import { Form } from 'rsuite';
import MyModal from '../../../../components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import FieldAuditHistoryModal from '../s.o.a.p/FieldAuditHistory';
import { extractErrorMessage } from '@/utils';

const AssignNurseModal = ({
  open,
  setOpen,
  encounterId,

}) => {
  const dispatch = useAppDispatch();

  const [selectedNurse, setSelectedNurse] = useState<any>(null);
  const [userPage, setUserPage] = useState(0);
  const [userRowsPerPage, setUserRowsPerPage] = useState(5);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  const [assignNurse, { isLoading: isAssigningNurse }] =
    useAssignNurseMutation();

  const {
    data: userListResponse,
    isFetching: isLoadingUsers
  } = useGetUsersBasicQuery({
    page: userPage,
    size: userRowsPerPage,
    sort: 'id,asc',
    jobRole: 'NURSE'
  });

  const {
    data: encounterAudit = []
  } = useGetEncounterAuditQuery(
    { id: encounterId },
    { skip: !encounterId }
  );

  const isSelected = rowData => {
    if (rowData && selectedNurse && selectedNurse.id === rowData.id) {
      return 'selected-row';
    } else return '';
  };

  const tableColumns = [
    {
      key: 'login',
      title: <Translate>User Name</Translate>,
      flexGrow: 2
    },
    {
      key: 'firstName',
      title: <Translate>Full Name</Translate>,
      flexGrow: 3,
      render: rowData =>
        `${rowData?.firstName ?? ''} ${rowData?.lastName ?? ''}`
    },
    {
      key: 'phoneNumber',
      title: <Translate>Mobile Number</Translate>,
      flexGrow: 2
    },
    {
      key: 'email',
      title: <Translate>Email</Translate>,
      flexGrow: 3
    }
  ];

  const handleUserPageChange = (
    _event: unknown,
    newPage: number
  ) => {
    setUserPage(newPage);
  };

  const handleUserRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUserRowsPerPage(parseInt(event.target.value, 10));
    setUserPage(0);
  };

  const handleAssignNurse = async () => {
    if (!encounterId || !selectedNurse?.id) {
      return;
    }

    try {
      await assignNurse({
        encounterId,
        nurseId: selectedNurse.id
      }).unwrap();

      dispatch(
        notify({
          msg: 'Nurse assigned successfully',
          sev: 'success'
        })
      );

      setSelectedNurse(null);
      setOpen(false);
    } catch (error) {
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'Failed to assign nurse',
          sev: 'warning',
        })
      );
    }
  };

  const conjureFormContentModal = () => (
    <Form layout="inline" fluid>
      <small>
        * <Translate>Click to select Nurse</Translate>
      </small>

      <MyTable
        height={450}
        data={userListResponse?.data ?? []}
        columns={tableColumns}
        page={userPage}
        rowsPerPage={userRowsPerPage}
        totalCount={userListResponse?.totalCount ?? 0}
        onPageChange={handleUserPageChange}
        onRowsPerPageChange={handleUserRowsPerPageChange}
        onRowClick={row => setSelectedNurse(row)}
        loading={isLoadingUsers || isAssigningNurse}
        rowClassName={isSelected}
      />
    </Form>
  );

  const direction =
    localStorage.getItem('direction') || 'LTR';

  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title="Assign Nurse"
        content={() => (
          <div dir={dir}>
            {conjureFormContentModal()}
          </div>
        )}
        size="45vw"
        actionButtonFunction={handleAssignNurse}
        isDisabledActionBtn={!selectedNurse}
        footerButtons={
          <MyButton
            size="small"
            onClick={() => setAuditModalOpen(true)}
          >
            Log
          </MyButton>
        }
      />

      <FieldAuditHistoryModal
        open={auditModalOpen}
        setOpen={setAuditModalOpen}
        audit={encounterAudit}
        fieldName="assignedNurseId"
      />
    </>
  );
};

export default AssignNurseModal;

