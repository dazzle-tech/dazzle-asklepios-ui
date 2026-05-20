import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
  useGetActiveServicesByFacilityQuery,
  useLazyGetServicesBulkByIdsQuery,
} from '@/services/setup/serviceService';
import {
  useCreateBulkPatientServicesOrProductsMutation,
  useGetPatientServicesAndProductsByEncounterAndSourceQuery,
} from '@/services/encounters/patientServicesAndProductsService';
import { PatientServiceProductCreateDTO, ServiceSource } from '@/types/model-types-new';
import { newPatientServiceProductCreateDTO } from '@/types/model-types-constructor-new';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  consultationRow: any;
  onSuccess?: () => void;
};

const AddBulkServicesToConsultationModal = ({
  open,
  setOpen,
  consultationRow,
  onSuccess,
}: Props) => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);

  const selectedFacilityId =
    authSlice?.selectedDepartment?.facilityId ?? authSlice?.tenant?.selectedFacility?.id;

  const patientId = consultationRow?.patient?.id;
  const encounterId = consultationRow?.encounter?.id;
  const consultationId =
    consultationRow?.consultationId ??
    consultationRow?.consultation?.id ??
    consultationRow?.id;

  const [record, setRecord] = useState<{
    serviceIds: Array<number | string>;
    selectedServices: any[];
    quantities: Record<string, number>;
    lastSelectedService?: any;
  }>({
    serviceIds: [],
    selectedServices: [],
    quantities: {},
    lastSelectedService: null,
  });

  const { data: activeServicesResponse, isFetching: isFetchingServices } =
    useGetActiveServicesByFacilityQuery(
      {
        facilityId: selectedFacilityId,
        page: 0,
        size: 200,
        sort: 'id,asc',
      },
      {
        skip: !open || !selectedFacilityId,
      }
    );

  const [createBulkPatientServicesOrProducts, { isLoading: isSaving }] =
    useCreateBulkPatientServicesOrProductsMutation();

  const {
    data: existingServicesResponse,
    isFetching: isFetchingExistingServices,
  } = useGetPatientServicesAndProductsByEncounterAndSourceQuery(
    {
      encounterId: Number(encounterId),
      source: ServiceSource.CONSULTATION_PORTAL,
      sourceId: Number(consultationId),
      page: 0,
      size: 100,
      sort: 'id,desc',
    },
    {
      skip: !open || !encounterId || !consultationId,
    }
  );

  const services = activeServicesResponse?.data ?? [];
  const existingServices = existingServicesResponse?.data ?? [];

  const selectedServicesPreview = useMemo(() => {
    const ids = new Set((record.serviceIds ?? []).map(id => String(id)));
    return services.filter(service => ids.has(String(service.id)));
  }, [record.serviceIds, services]);

  const existingServiceIds = useMemo(
    () =>
      Array.from(
        new Set(
          existingServices
            .filter(item => item.billingItemType === 'SERVICE' && item.serviceId != null)
            .map(item => item.serviceId)
        )
      ),
    [existingServices]
  );

  const [fetchServicesBulk] = useLazyGetServicesBulkByIdsQuery();
  const [existingServicesMap, setExistingServicesMap] = useState<Record<number | string, any>>(
    {}
  );
  const [existingServicesLookupLoading, setExistingServicesLookupLoading] = useState(false);

  useEffect(() => {
    const loadExistingServicesLookups = async () => {
      if (!existingServiceIds.length) {
        setExistingServicesMap({});
        setExistingServicesLookupLoading(false);
        return;
      }

      setExistingServicesLookupLoading(true);

      try {
        const servicesData = await fetchServicesBulk(existingServiceIds, true).unwrap();

        setExistingServicesMap(
          Object.fromEntries((servicesData ?? []).map((item: any) => [item.id, item]))
        );
      } catch (error) {
        setExistingServicesMap({});
      } finally {
        setExistingServicesLookupLoading(false);
      }
    };

    loadExistingServicesLookups();
  }, [existingServiceIds, fetchServicesBulk]);

  const handleClose = () => {
    setRecord({
      serviceIds: [],
      selectedServices: [],
      quantities: {},
      lastSelectedService: null,
    });
    setOpen(false);
  };

  const handleQuantityChange = (serviceId: number | string, value: number) => {
    const parsedValue = Math.max(1, Number(value) || 1);

    setRecord(prev => ({
      ...prev,
      quantities: {
        ...prev.quantities,
        [String(serviceId)]: parsedValue,
      },
    }));
  };

  const increaseQuantity = (serviceId: number | string) => {
    const currentQuantity = record.quantities?.[String(serviceId)] ?? 1;
    handleQuantityChange(serviceId, currentQuantity + 1);
  };

  const decreaseQuantity = (serviceId: number | string) => {
    const currentQuantity = record.quantities?.[String(serviceId)] ?? 1;
    handleQuantityChange(serviceId, Math.max(1, currentQuantity - 1));
  };

  const handleSave = async () => {
    if (!patientId || !encounterId) {
      dispatch(notify({ msg: 'Patient or encounter is missing', sev: 'error' }));
      return;
    }

    if (!consultationId) {
      dispatch(notify({ msg: 'Consultation ID is missing', sev: 'error' }));
      return;
    }

    if (!record.serviceIds || record.serviceIds.length === 0) {
      dispatch(notify({ msg: 'Please select at least one service', sev: 'warning' }));
      return;
    }

    try {
      const payload: PatientServiceProductCreateDTO[] = selectedServicesPreview.map(service => {
        const quantity = Number(record.quantities?.[String(service.id)] ?? 1);

        return {
          ...newPatientServiceProductCreateDTO,
          patientId: Number(patientId),
          encounterId: Number(encounterId),
          billingItemType: 'SERVICE',
          brandMedicationId: null,
          diagnosticTestId: null,
          serviceId: Number(service.id),
          procedureId: null,
          quantity,
          unitPrice: Number(service.price ?? 0),
          exemptionAmount: 0,
          taxAmount: 0,
          currency: service.currency ?? '',
          serviceSource: 'CONSULTATION_PORTAL',
          sourceId: Number(consultationId),
          notes: null,
        };
      });

      await createBulkPatientServicesOrProducts(payload).unwrap();

      dispatch(
        notify({
          msg: `${payload.length} service(s) added successfully`,
          sev: 'success',
        })
      );

      handleClose();
      onSuccess?.();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.message || 'Failed to add services',
          sev: 'error',
        })
      );
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add Multiple Services"
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      actionButtonLoading={isSaving}
      handleCancelFunction={handleClose}
      size="35vw"
      bodyheight="70vh"
      content={
        <Form fluid>
          <MyInput
            required
            fieldName="serviceIds"
            fieldLabel="Services"
            fieldType="checkPicker"
            record={record}
            setRecord={setRecord}
            selectData={services}
            selectDataLabel="name"
            selectDataValue="id"
            width="100%"
            searchable
            loading={isFetchingServices}
            placeholder="Select one or more services"
            onSelectItem={selectedItem => {
              setRecord(prev => ({
                ...prev,
                lastSelectedService: selectedItem ?? null,
              }));
            }}
          />

          {!!selectedServicesPreview.length && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Selected Services</div>

              {selectedServicesPreview.map(service => {
                const quantity = record.quantities?.[String(service.id)] ?? 1;
                const unitPrice = Number(service.price ?? 0);
                const totalPrice = quantity * unitPrice;

                return (
                  <div
                    key={service.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      border: '1px solid #e5e5e5',
                      borderRadius: 8,
                      marginBottom: 8,
                      background: '#fff',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{service.name}</div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        Price: {unitPrice} {service.currency ?? ''}
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                        Total: {totalPrice} {service.currency ?? ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13 }}>Qty:</span>

                      <button
                        type="button"
                        onClick={() => decreaseQuantity(service.id)}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 6,
                          border: '1px solid #d9d9d9',
                          background: '#fff',
                          cursor: 'pointer',
                          fontSize: 16,
                          lineHeight: 1,
                        }}
                      >
                        -
                      </button>

                      <span
                        style={{
                          minWidth: 28,
                          textAlign: 'center',
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => increaseQuantity(service.id)}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 6,
                          border: '1px solid #d9d9d9',
                          background: '#fff',
                          cursor: 'pointer',
                          fontSize: 16,
                          lineHeight: 1,
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Previously Added Services</div>

            {isFetchingExistingServices || existingServicesLookupLoading ? (
              <div style={{ fontSize: 13, color: '#666' }}>Loading...</div>
            ) : !existingServices.length ? (
              <div
                style={{
                  fontSize: 13,
                  color: '#666',
                  padding: '12px',
                  border: '1px dashed #d9d9d9',
                  borderRadius: 8,
                  background: '#fafafa',
                }}
              >
                No services added before for this consultation
              </div>
            ) : (
              existingServices.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    border: '1px solid #e5e5e5',
                    borderRadius: 8,
                    marginBottom: 8,
                    background: '#fafafa',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {existingServicesMap[item.serviceId!]?.name ??
                        `Service #${item?.serviceId ?? ''}`}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                      Qty: {item.quantity ?? 1}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: '#666' }}>
                    {Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1)}{' '}
                    {item.currency ?? ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </Form>
      }
    />
  );
};

export default AddBulkServicesToConsultationModal;