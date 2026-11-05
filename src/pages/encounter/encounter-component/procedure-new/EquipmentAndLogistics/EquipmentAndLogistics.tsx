import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useAddProcedureEquipmentMutation,
  useDeleteProcedureEquipmentMutation,
  useGetProcedureEquipmentQuery
} from '@/services/patients/patientProcedureService';
import { useGetAllServicesQuery } from '@/services/setup/serviceService';
import { formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import React, { useState } from 'react';
import { IoPersonRemove } from 'react-icons/io5';
import { Col, Form, Row } from 'rsuite';

const EquipmentAndLogistics = ({ procedure, setActiveTab }) => {
  const dispatch = useAppDispatch();
  const [selectedServices, setSelectedServices] = useState<any>({ ids: [] });
  const [equipmentToDelete, setEquipmentToDelete] = useState<any>(null);

  const { data: servicesResponse } = useGetAllServicesQuery({ page: 0, size: 1000 });
  const { data: equipmentList = [] } = useGetProcedureEquipmentQuery(procedure?.id, {
    skip: !procedure?.id
  });
  const [addEquipment] = useAddProcedureEquipmentMutation();
  const [deleteEquipment] = useDeleteProcedureEquipmentMutation();

  const services = servicesResponse?.data ?? [];
  const serviceOf = (rowData: any) => services.find((item: any) => item.id === rowData.serviceId);
  const availableServices = services.filter(
    (service: any) => !equipmentList.some(row => row.serviceId === service.id)
  );

  const handleSave = async () => {
    const ids = selectedServices?.ids;
    if (!Array.isArray(ids) || ids.length === 0) return;
    try {
      await Promise.all(
        ids.map(serviceId => addEquipment({ id: procedure.id, body: { serviceId } }).unwrap())
      );
      setSelectedServices({ ids: [] });
      dispatch(notify({ msg: 'All Services saved successfully', sev: 'success' }));
    } catch {
      dispatch(notify({ msg: 'Failed to save one or more services', sev: 'error' }));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEquipment({ id: procedure.id, equipmentId: equipmentToDelete.id }).unwrap();
      dispatch(notify({ msg: 'Deleted successfully', sev: 'success' }));
      setEquipmentToDelete(null);
    } catch {
      dispatch(notify({ msg: 'Delete failed', sev: 'error' }));
    }
  };

  const columns = [
    {
      key: 'Name',
      title: <Translate>Name</Translate>,
      render: (rowData: any) => serviceOf(rowData)?.name ?? ''
    },
    {
      key: 'Category',
      title: <Translate>Category</Translate>,
      render: (rowData: any) => formatEnumString(serviceOf(rowData)?.category) ?? ''
    },
    {
      key: 'Price',
      title: <Translate>Price</Translate>,
      render: (rowData: any) => serviceOf(rowData)?.price ?? ''
    },
    {
      key: 'Currency',
      title: <Translate>Currency</Translate>,
      render: (rowData: any) => serviceOf(rowData)?.currency ?? ''
    },
    {
      key: 'delete',
      title: <Translate>Delete</Translate>,
      render: (rowData: any) => (
        <IoPersonRemove
          fill="var(--primary-gray)"
          size={22}
          onClick={() => setEquipmentToDelete(rowData)}
        />
      )
    }
  ];

  return (
    <>
      <Row>
        <Col md={10}>
          <Form fluid>
            <MyInput
              width="100%"
              menuMaxHeight="15vh"
              placeholder="Service"
              showLabel={false}
              selectData={availableServices}
              fieldType="multyPicker"
              selectDataLabel="name"
              selectDataValue="id"
              fieldName="ids"
              record={selectedServices}
              setRecord={setSelectedServices}
            />
          </Form>
        </Col>
        <Col md={12}></Col>
        <Col md={2}>
          <MyButton onClick={handleSave}>Save</MyButton>
        </Col>
      </Row>
      <Row>
        <Col md={24}>
          <MyTable data={equipmentList} columns={columns} />
        </Col>
      </Row>
      <DeletionConfirmationModal
        open={!!equipmentToDelete}
        setOpen={open => !open && setEquipmentToDelete(null)}
        itemToDelete="Service"
        actionButtonFunction={handleDelete}
        actionType="delete"
      />
      <div className="bt-div">
        <div className="bt-right">
          <MyButton onClick={() => setActiveTab('1')}>Complete and Next</MyButton>
        </div>
      </div>
    </>
  );
};

export default EquipmentAndLogistics;
