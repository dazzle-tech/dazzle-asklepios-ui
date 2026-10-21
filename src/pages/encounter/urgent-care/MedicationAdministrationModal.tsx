import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatEnumString } from '@/utils';
import {
  useAdministerUccMedicationOrderMutation,
  useGetUccMedicationOrderByIdQuery
} from '@/services/medicalsheetsEncounter/uccMedicationOrder/uccMedicationOrderService';
import { useGetBrandMedicationsByActiveIdsMutation } from '@/services/setup/brandmedication/BrandMedicationService';
import { useGetAllUnitsByGroupIdQuery } from '@/services/setup/uom-group/uomGroupService';
import { useIsAmendmentOpen } from '@/pages/encounter/useIsAmendmentOpen';
import { patientServicesAndProductsService } from '@/services/encounters/patientServicesAndProductsService';

type MedicationAdministrationModalProps = {
  orderId: number | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
};

type AdministrationRecord = {
  actualAdministerTime: Date;
  // The brand given and the unit it is charged in on the patient's services and products
  brandId: number | null;
  uomUnitId: number | null;
  quantity: number | string | null;
};

const newRecord = (): AdministrationRecord => ({
  actualAdministerTime: new Date(),
  brandId: null,
  uomUnitId: null,
  quantity: null
});

const MedicationAdministrationModal: React.FC<
  MedicationAdministrationModalProps
> = ({
  orderId,
  open,
  setOpen,
  onSuccess
}) => {
  const dispatch = useAppDispatch();
  const isAmendmentOpen = useIsAmendmentOpen();

  const [administerOrder, { isLoading }] =
    useAdministerUccMedicationOrderMutation();

  const [record, setRecord] = useState<AdministrationRecord>(newRecord());

  // Brands linked to the active ingredient of the order
  const { data: order } = useGetUccMedicationOrderByIdQuery(orderId as number, {
    skip: !open || !orderId
  });
  const activeIngredientId = order?.activeIngredientId;

  const [fetchBrands, { data: brands }] = useGetBrandMedicationsByActiveIdsMutation();

  useEffect(() => {
    if (open && activeIngredientId) {
      fetchBrands([activeIngredientId]);
    }
  }, [open, activeIngredientId, fetchBrands]);

  const brandOptions = useMemo(
    () => (brands ?? []).map((brand: any) => ({ label: brand.name, value: brand.id })),
    [brands]
  );

  // UOM group units of the selected brand
  const selectedBrand = useMemo(
    () => (brands ?? []).find((brand: any) => brand.id === record.brandId),
    [brands, record.brandId]
  );
  const uomGroupId = selectedBrand?.uomGroupId;

  const { data: uomUnits } = useGetAllUnitsByGroupIdQuery(uomGroupId ?? 0, {
    skip: !uomGroupId
  });

  const uomUnitOptions = useMemo(
    () => (uomUnits ?? []).map((unit: any) => ({ label: formatEnumString(unit.uom), value: unit.id })),
    [uomUnits]
  );

  useEffect(() => {
    if (open) {
      setRecord(newRecord());
    }
  }, [open]);

  // A different brand has different units
  const setRecordAndResetUnit = (updated: AdministrationRecord) => {
    setRecord(updated.brandId !== record.brandId ? { ...updated, uomUnitId: null } : updated);
  };

  const quantity = Number(record.quantity);
  const isQuantityValid = Number.isInteger(quantity) && quantity > 0;
  const isRecordComplete =
    !!record.actualAdministerTime && !!record.brandId && !!record.uomUnitId && isQuantityValid;

  const handleConfirm = async () => {
    if (isAmendmentOpen || !orderId) {
      return;
    }

    if (!isRecordComplete) {
      dispatch(
        notify({
          msg: 'Select the brand and UOM, and enter a whole quantity greater than zero',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      await administerOrder({
        id: orderId,
        actualAdministerTime: record.actualAdministerTime,
        brandMedicationId: record.brandId as number,
        uomGroupUnitId: record.uomUnitId as number,
        quantity
      }).unwrap();

      // The administration is charged on the patient's services and products
      dispatch(
        patientServicesAndProductsService.util.invalidateTags(['PatientServiceAndProduct'])
      );

      dispatch(
        notify({
          msg: 'Medication administered successfully',
          sev: 'success'
        })
      );

      await onSuccess?.();

      setOpen(false);
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            error?.data?.detail ||
            'Administration failed',
          sev: 'error'
        })
      );
    }
  };

  return (
    <MyModal
      title="Administer Medication"
      open={open}
      setOpen={setOpen}
      actionButtonFunction={handleConfirm}
      isDisabledActionBtn={isAmendmentOpen || isLoading}
      size="sm"
      bodyheight="40vh"
      content={
        // MyInput (select / number) needs a Form around it
        <Form fluid>
          <MyInput
            required
            fieldName="actualAdministerTime"
            fieldLabel="Actual Administer Time"
            fieldType="datetime"
            record={record}
            setRecord={setRecord}
            width='100%'
          />

          <MyInput
            required
            fieldName="brandId"
            fieldLabel="Brand"
            fieldType="select"
            selectData={brandOptions}
            selectDataLabel="label"
            selectDataValue="value"
            record={record}
            setRecord={setRecordAndResetUnit}
            placeholder={brandOptions.length ? 'Select Brand' : 'No brands for this active ingredient'}
            width='100%'
          />

          {record.brandId && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <MyInput
                required
                fieldName="uomUnitId"
                fieldLabel="UOM"
                fieldType="select"
                selectData={uomUnitOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={record}
                setRecord={setRecord}
                searchable={false}
                width='100%'
              />

              <MyInput
                required
                fieldName="quantity"
                fieldLabel="Quantity"
                fieldType="number"
                record={record}
                setRecord={setRecord}
                width='100%'
              />
            </div>
          )}
        </Form>
      }
    />
  );
};

export default MedicationAdministrationModal;
