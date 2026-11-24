import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import { MdDelete, MdMedicalServices } from 'react-icons/md';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatEnumString } from '@/utils';
import { useGetActiveServicesByFacilityQuery, useGetServicesBulkByIdsQuery } from '@/services/setup/serviceService';
import { useUpdateDiscountServicesMutation } from '@/services/billing/discountService';
import type { Discount } from '@/types/model-types-new';
import { extractDiscountErrorMessage } from './discountErrorHandler';

type ServiceRow = {
  id: number;
  name?: string;
  code?: string;
  category?: string | null;
};

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  discount: Discount | null;
  onSaved?: (saved?: Discount) => void;
};

const toIds = (ids?: Array<number | string> | null) =>
  (ids ?? []).map(id => Number(id)).filter(id => !Number.isNaN(id));

const DiscountServicesModal: React.FC<Props> = ({
  open,
  setOpen,
  discount,
  onSaved
}) => {
  const dispatch = useAppDispatch();
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [serviceToAdd, setServiceToAdd] = useState<number | null>(null);
  const [updateServices, { isLoading }] = useUpdateDiscountServicesMutation();

  const facilityId = discount?.facilityId;
  const savedIds = toIds(discount?.serviceIds);

  const { data: servicesResponse, isFetching } = useGetActiveServicesByFacilityQuery(
    {
      facilityId: facilityId as number,
      page: 0,
      size: 1000,
      sort: 'name,asc'
    },
    { skip: !open || !facilityId }
  );

  const { data: linkedServices = [], isFetching: isFetchingLinked } = useGetServicesBulkByIdsQuery(
    serviceIds,
    { skip: !open || serviceIds.length === 0 }
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setServiceIds(savedIds);
    setServiceToAdd(null);
  }, [open, discount?.id, savedIds.join(',')]);

  const facilityServices: ServiceRow[] = servicesResponse?.data ?? [];

  const servicesById = useMemo(() => {
    const map = new Map<number, ServiceRow>();

    facilityServices.forEach(service => map.set(Number(service.id), service));
    (Array.isArray(linkedServices) ? linkedServices : []).forEach((service: ServiceRow) =>
      map.set(Number(service.id), service)
    );

    return map;
  }, [facilityServices, linkedServices]);

  const tableRows = serviceIds.map(id => {
    const service = servicesById.get(id);

    return {
      id,
      name: service?.name || `Service ${id}`,
      code: service?.code || '-',
      category: service?.category || null
    };
  });

  const availableServices = facilityServices.filter(service => !serviceIds.includes(Number(service.id)));

  const persistServices = async (ids: number[]) => {
    const saved = await updateServices({
      id: discount!.id!,
      serviceIds: ids
    }).unwrap();

    onSaved?.(saved);
  };

  const addService = async () => {
    if (!discount?.id || serviceToAdd == null || serviceIds.includes(serviceToAdd) || isLoading) {
      return;
    }

    const nextIds = [...serviceIds, serviceToAdd];
    const previousIds = serviceIds;
    const selectedService = serviceToAdd;

    setServiceIds(nextIds);
    setServiceToAdd(null);

    try {
      await persistServices(nextIds);
      dispatch(notify({ msg: 'Applicable service added', sev: 'success' }));
    } catch (error) {
      setServiceIds(previousIds);
      setServiceToAdd(selectedService);
      dispatch(
        notify({
          msg: extractDiscountErrorMessage(error, 'Failed to add applicable service'),
          sev: 'error'
        })
      );
    }
  };

  const removeService = async (id: number) => {
    if (!discount?.id || isLoading) {
      return;
    }

    const nextIds = serviceIds.filter(serviceId => serviceId !== id);
    const previousIds = serviceIds;

    setServiceIds(nextIds);

    try {
      await persistServices(nextIds);
      dispatch(notify({ msg: 'Applicable service removed', sev: 'success' }));
    } catch (error) {
      setServiceIds(previousIds);
      dispatch(
        notify({
          msg: extractDiscountErrorMessage(error, 'Failed to remove applicable service'),
          sev: 'error'
        })
      );
    }
  };

  const columns = [
    {
      key: 'name',
      title: <Translate>Service Name</Translate>,
      flexGrow: 2
    },
    {
      key: 'code',
      title: <Translate>Code</Translate>,
      width: 140
    },
    {
      key: 'category',
      title: <Translate>Category</Translate>,
      width: 160,
      render: (row: ServiceRow) => (row.category ? formatEnumString(row.category) : '-')
    },
    {
      key: 'actions',
      title: <Translate>Remove</Translate>,
      width: 90,
      align: 'center' as const,
      render: (row: ServiceRow) => (
        <MdDelete
          className="icons-style"
          title="Remove"
          size={22}
          fill="var(--primary-pink)"
          onClick={() => {
            if (!isLoading) {
              void removeService(row.id);
            }
          }}
        />
      )
    }
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Applicable Services"
      position="right"
      hideCancel
      hideActionBtn
      steps={[{ title: 'Services', icon: <MdMedicalServices /> }]}
      size="56vw"
      content={() => (
        <Form fluid>
          <div className="discount-services-toolbar">
            <div className="discount-services-toolbar__picker">
              <MyInput
                width="100%"
                fieldLabel="Service"
                fieldType="select"
                fieldName="serviceToAdd"
                selectData={availableServices}
                selectDataLabel="name"
                selectDataValue="id"
                record={{ serviceToAdd }}
                setRecord={(value: { serviceToAdd?: number | null }) => {
                  const selected = value?.serviceToAdd;
                  setServiceToAdd(selected == null || selected === ('' as any) ? null : Number(selected));
                }}
                placeholder="Select a service to add"
                searchable
                loading={isFetching}
                disabled={!facilityId}
              />
            </div>
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={() => {
                void addService();
              }}
              width="109px"
              disabled={serviceToAdd == null || isLoading || !discount?.id}
              loading={isLoading}
            >
              Add
            </MyButton>
          </div>
          <br />
          <MyTable
            height={360}
            data={tableRows}
            columns={columns}
            loading={isFetching || isFetchingLinked}
            enableExport={false}
          />
        </Form>
      )}
    />
  );
};

export default DiscountServicesModal;
