import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useAddProcedureStaffMutation,
  useDeleteProcedureStaffMutation,
  useGetProcedureStaffQuery,
  useUpdateProcedureStaffMutation
} from '@/services/patients/patientProcedureService';
import { useGetUsersBasicQuery } from '@/services/userService';
import { notify } from '@/utils/uiReducerActions';
import React, { useMemo, useState } from 'react';
import { IoPersonRemove } from 'react-icons/io5';
import { Col, Form, Input, Row, Text } from 'rsuite';

const STAFF_JOB_ROLES = ['ANESTHESIOLOGIST', 'NURSE', 'PHYSICIAN'];

type ProcedureStaffProps = {
  procedureId?: number;
  label?: string;
};

const ProcedureStaff: React.FC<ProcedureStaffProps> = ({
  procedureId,
  label = 'Procedure Staff'
}) => {
  const dispatch = useAppDispatch();
  const [selectedUsers, setSelectedUsers] = useState<any>({ ids: [] });
  const [staffToDelete, setStaffToDelete] = useState<any>(null);

  const { data: usersResponse } = useGetUsersBasicQuery({ page: 0, size: 1000, sort: 'id,asc' });
  const { data: staffList = [] } = useGetProcedureStaffQuery(procedureId as number, {
    skip: !procedureId
  });
  const [addStaff] = useAddProcedureStaffMutation();
  const [updateStaff] = useUpdateProcedureStaffMutation();
  const [deleteStaff] = useDeleteProcedureStaffMutation();

  const users = usersResponse?.data ?? [];
  const usersById = useMemo(() => new Map(users.map((user: any) => [user.id, user])), [users]);
  const availableUsers = users.filter(
    (user: any) =>
      STAFF_JOB_ROLES.includes(user.jobRole) &&
      !staffList.some(staff => staff.userId === user.id)
  );

  const handleAdd = async () => {
    const ids = selectedUsers?.ids;
    if (!procedureId || !Array.isArray(ids) || ids.length === 0) return;
    try {
      await Promise.all(
        ids.map(userId =>
          addStaff({ id: procedureId, body: { userId, isPresent: false } }).unwrap()
        )
      );
      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
      setSelectedUsers({ ids: [] });
    } catch {
      dispatch(notify({ msg: 'Failed to save staff', sev: 'error' }));
    }
  };

  const handleSaveResponsibility = async (staff: any, responsibility: string) => {
    if (responsibility === (staff.responsibility ?? '')) return;
    try {
      await updateStaff({
        id: procedureId as number,
        staffId: staff.id,
        body: { userId: staff.userId, responsibility, isPresent: staff.isPresent }
      }).unwrap();
      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
    } catch {
      dispatch(notify({ msg: 'Save failed', sev: 'error' }));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStaff({ id: procedureId as number, staffId: staffToDelete.id }).unwrap();
      dispatch(notify({ msg: 'Deleted successfully', sev: 'success' }));
      setStaffToDelete(null);
    } catch {
      dispatch(notify({ msg: 'Delete failed', sev: 'error' }));
    }
  };

  const columns = [
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      render: (rowData: any) => (usersById.get(rowData.userId) as any)?.login
    },
    {
      key: 'responsibility',
      title: <Translate>Responsibility</Translate>,
      render: (rowData: any) => (
        <Input
          style={{ width: '100%' }}
          placeholder="Responsibility"
          defaultValue={rowData.responsibility ?? ''}
          onPressEnter={event => event.currentTarget.blur()}
          onBlur={event => handleSaveResponsibility(rowData, event.target.value)}
        />
      )
    },
    {
      key: 'delete',
      title: <Translate>Delete</Translate>,
      render: (rowData: any) => (
        <IoPersonRemove size={22} onClick={() => setStaffToDelete(rowData)} />
      )
    }
  ];

  return (
    <SectionContainer
      title={<Text>{label}</Text>}
      content={
        <>
          <Row className="rows-gap">
            <Col md={10}>
              <Form fluid>
                <MyInput
                  width="100%"
                  menuMaxHeight="25vh"
                  placeholder="Staff"
                  showLabel={false}
                  selectData={availableUsers}
                  fieldType="multyPicker"
                  selectDataLabel="login"
                  selectDataValue="id"
                  fieldName="ids"
                  record={selectedUsers}
                  setRecord={setSelectedUsers}
                  disabled={!procedureId}
                />
              </Form>
            </Col>
            <Col md={2}>
              <MyButton appearance="ghost" onClick={handleAdd} disabled={!procedureId}>
                Add
              </MyButton>
            </Col>
          </Row>
          <Row>
            <Col md={24}>
              <MyTable data={staffList} columns={columns} height="35vh" />
            </Col>
          </Row>
          <DeletionConfirmationModal
            open={!!staffToDelete}
            setOpen={open => !open && setStaffToDelete(null)}
            itemToDelete="Staff"
            actionButtonFunction={handleDelete}
            actionType="delete"
          />
        </>
      }
    />
  );
};

export default ProcedureStaff;
