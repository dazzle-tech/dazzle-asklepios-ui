import React, { useMemo } from 'react';
import { Form } from 'rsuite';
import { useLocation } from 'react-router-dom';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useCreatePatientServiceOrProductMutation,
  useUpdatePatientServiceOrProductMutation
} from '@/services/encounters/patientServicesAndProductsService';
import { notify } from '@/utils/uiReducerActions';
import {
  PatientServiceAndProduct,
  PatientServiceProductCreateDTO,
  PatientServiceProductUpdateDTO
} from '@/types/model-types-new';
import {
  newPatientServiceAndProduct,
  newPatientServiceProductCreateDTO,
  newPatientServiceProductUpdateDTO
} from '@/types/model-types-constructor-new';

import { useGetActiveServicesByFacilityQuery } from '@/services/setup/serviceService';
import { useGetBrandMedicationsByIsActiveQuery } from '@/services/setup/brandmedication/BrandMedicationService';
import { useGetActiveDiagnosticTestsByTypeQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetActiveProceduresByFacilityQuery } from '@/services/setup/procedure/procedureService';

const AddEditPatientServiceAndProduct = ({
  open,
  setOpen,
  patientServiceAndProduct,
  setPatientServiceAndProduct
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  patientServiceAndProduct: PatientServiceAndProduct;
  setPatientServiceAndProduct: (patientServiceAndProduct: PatientServiceAndProduct) => void;
}) => {
  const authSlice = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const location = useLocation();

  const patient = location.state?.patient;
  const encounter = location.state?.encounter;

  const selectedFacilityId =
    authSlice?.selectedDepartment?.facilityId ?? authSlice?.tenant?.selectedFacility?.id;

  const billingItemTypeOptions = useEnumOptions('BillingItemTypes', { exclude: ['PATHOLOGY'] });

  const { data: activeServicesResponse, isFetching: isFetchingServices } =
    useGetActiveServicesByFacilityQuery(
      {
        facilityId: selectedFacilityId,
        page: 0,
        size: 50,
        sort: 'id,asc'
      },
      {
        skip:
          !open || !selectedFacilityId || patientServiceAndProduct?.billingItemType !== 'SERVICE'
      }
    );

  const { data: medicationsResponse, isFetching: isFetchingMedications } =
    useGetBrandMedicationsByIsActiveQuery(
      {
        isActive: true,
        page: 0,
        size: 50,
        sort: 'id,asc'
      },
      {
        skip: !open || patientServiceAndProduct?.billingItemType !== 'MEDICATION'
      }
    );

  const { data: laboratoryResponse, isFetching: isFetchingLaboratory } =
    useGetActiveDiagnosticTestsByTypeQuery(
      {
        type: 'LABORATORY',
        page: 0,
        size: 50,
        sort: 'id,asc'
      },
      {
        skip: !open || patientServiceAndProduct?.billingItemType !== 'LABORATORY'
      }
    );

  const { data: radiologyResponse, isFetching: isFetchingRadiology } =
    useGetActiveDiagnosticTestsByTypeQuery(
      {
        type: 'RADIOLOGY',
        page: 0,
        size: 50,
        sort: 'id,asc'
      },
      {
        skip: !open || patientServiceAndProduct?.billingItemType !== 'RADIOLOGY'
      }
    );

  const { data: pathologyResponse, isFetching: isFetchingPathology } =
    useGetActiveDiagnosticTestsByTypeQuery(
      {
        type: 'PATHOLOGY',
        page: 0,
        size: 50,
        sort: 'id,asc'
      },
      {
        skip: !open || patientServiceAndProduct?.billingItemType !== 'PATHOLOGY'
      }
    );

  const { data: proceduresResponse, isFetching: isFetchingProcedures } =
    useGetActiveProceduresByFacilityQuery(
      {
        facilityId: selectedFacilityId,
        page: 0,
        size: 50,
        sort: 'id,asc'
      },
      {
        skip:
          !open || !selectedFacilityId || patientServiceAndProduct?.billingItemType !== 'PROCEDURE'
      }
    );

  const [createPatientServiceAndProduct, { isLoading: isCreating }] =
    useCreatePatientServiceOrProductMutation();

  const [updatePatientServiceAndProduct, { isLoading: isUpdating }] =
    useUpdatePatientServiceOrProductMutation();

  const extractErrorMessage = (response: any) => {
    try {
      const msg = response?.data?.message;
      if (typeof msg === 'string') return msg.replace(/^error\./i, '');
      return '';
    } catch {
      return '';
    }
  };

  const getValidationError = () => {
    let errorMsg = '';

    if (!patientServiceAndProduct?.billingItemType) {
      errorMsg += errorMsg ? ', Category can`t be empty' : 'Category can`t be empty';
    }

    if (
      patientServiceAndProduct?.billingItemType === 'MEDICATION' &&
      !patientServiceAndProduct?.brandMedicationId
    ) {
      errorMsg += errorMsg ? ', Medication can`t be empty' : 'Medication can`t be empty';
    }

    if (
      patientServiceAndProduct?.billingItemType === 'LABORATORY' &&
      !patientServiceAndProduct?.diagnosticTestId
    ) {
      errorMsg += errorMsg ? ', Laboratory test can`t be empty' : 'Laboratory test can`t be empty';
    }

    if (
      patientServiceAndProduct?.billingItemType === 'RADIOLOGY' &&
      !patientServiceAndProduct?.diagnosticTestId
    ) {
      errorMsg += errorMsg ? ', Radiology test can`t be empty' : 'Radiology test can`t be empty';
    }

    if (
      patientServiceAndProduct?.billingItemType === 'PATHOLOGY' &&
      !patientServiceAndProduct?.diagnosticTestId
    ) {
      errorMsg += errorMsg ? ', Pathology test can`t be empty' : 'Pathology test can`t be empty';
    }

    if (
      patientServiceAndProduct?.billingItemType === 'SERVICE' &&
      !patientServiceAndProduct?.serviceId
    ) {
      errorMsg += errorMsg ? ', Service can`t be empty' : 'Service can`t be empty';
    }

    if (
      patientServiceAndProduct?.billingItemType === 'PROCEDURE' &&
      !patientServiceAndProduct?.procedureId
    ) {
      errorMsg += errorMsg ? ', Procedure can`t be empty' : 'Procedure can`t be empty';
    }

    if (!patientServiceAndProduct?.quantity || Number(patientServiceAndProduct?.quantity) <= 0) {
      errorMsg += errorMsg
        ? ', Quantity should be greater than 0'
        : 'Quantity should be greater than 0';
    }

    if (!errorMsg && !patientServiceAndProduct?.currency) {
      errorMsg = 'Currency can`t be empty';
    }

    return errorMsg;
  };

  const itemSelectConfig = useMemo(() => {
    switch (patientServiceAndProduct?.billingItemType) {
      case 'MEDICATION':
        return {
          fieldName: 'brandMedicationId',
          fieldLabel: 'Medication',
          selectData: medicationsResponse?.data ?? [],
          selectDataLabel: 'name',
          selectDataValue: 'id',
          loading: isFetchingMedications,
          hasMore: medicationsResponse?.links?.next != null
        };

      case 'LABORATORY':
        return {
          fieldName: 'diagnosticTestId',
          fieldLabel: 'Laboratory Test',
          selectData: laboratoryResponse?.data ?? [],
          selectDataLabel: 'name',
          selectDataValue: 'id',
          loading: isFetchingLaboratory,
          hasMore: laboratoryResponse?.links?.next != null
        };

      case 'RADIOLOGY':
        return {
          fieldName: 'diagnosticTestId',
          fieldLabel: 'Radiology Test',
          selectData: radiologyResponse?.data ?? [],
          selectDataLabel: 'name',
          selectDataValue: 'id',
          loading: isFetchingRadiology,
          hasMore: radiologyResponse?.links?.next != null
        };

      case 'PATHOLOGY':
        return {
          fieldName: 'diagnosticTestId',
          fieldLabel: 'Pathology Test',
          selectData: pathologyResponse?.data ?? [],
          selectDataLabel: 'name',
          selectDataValue: 'id',
          loading: isFetchingPathology,
          hasMore: pathologyResponse?.links?.next != null
        };

      case 'SERVICE':
        return {
          fieldName: 'serviceId',
          fieldLabel: 'Service',
          selectData: activeServicesResponse?.data ?? [],
          selectDataLabel: 'name',
          selectDataValue: 'id',
          loading: isFetchingServices,
          hasMore: activeServicesResponse?.links?.next != null
        };

      case 'PROCEDURE':
        return {
          fieldName: 'procedureId',
          fieldLabel: 'Procedure',
          selectData: proceduresResponse?.data ?? [],
          selectDataLabel: 'name',
          selectDataValue: 'id',
          loading: isFetchingProcedures,
          hasMore: proceduresResponse?.links?.next != null
        };

      default:
        return null;
    }
  }, [
    patientServiceAndProduct?.billingItemType,
    medicationsResponse,
    laboratoryResponse,
    radiologyResponse,
    pathologyResponse,
    activeServicesResponse,
    proceduresResponse,
    isFetchingMedications,
    isFetchingLaboratory,
    isFetchingRadiology,
    isFetchingPathology,
    isFetchingServices,
    isFetchingProcedures
  ]);

  const handleSave = async () => {
    const validationError = getValidationError();

    if (validationError) {
      dispatch(notify({ msg: validationError, sev: 'warning' }));
      return;
    }

    try {
      if (!patientServiceAndProduct?.id) {
        const createDTO: PatientServiceProductCreateDTO = {
          ...newPatientServiceProductCreateDTO,
          patientId: patient?.id,
          encounterId: encounter?.id,
          billingItemType: patientServiceAndProduct.billingItemType,

          brandMedicationId:
            patientServiceAndProduct.billingItemType === 'MEDICATION'
              ? patientServiceAndProduct.brandMedicationId ?? null
              : null,

          diagnosticTestId: ['LABORATORY', 'RADIOLOGY', 'PATHOLOGY'].includes(
            patientServiceAndProduct.billingItemType
          )
            ? patientServiceAndProduct.diagnosticTestId ?? null
            : null,

          serviceId:
            patientServiceAndProduct.billingItemType === 'SERVICE'
              ? patientServiceAndProduct.serviceId ?? null
              : null,

          procedureId:
            patientServiceAndProduct.billingItemType === 'PROCEDURE'
              ? patientServiceAndProduct.procedureId ?? null
              : null,

          quantity: Number(patientServiceAndProduct.quantity),
          unitPrice: patientServiceAndProduct.unitPrice ?? 0,
          currency: patientServiceAndProduct.currency
        };

        await createPatientServiceAndProduct(createDTO).unwrap();

        dispatch(
          notify({
            msg: 'Billing Item Added Successfully',
            sev: 'success'
          })
        );
      } else {
        const updateDTO: PatientServiceProductUpdateDTO = {
          ...newPatientServiceProductUpdateDTO,
          id: patientServiceAndProduct.id,
          billingItemType: patientServiceAndProduct.billingItemType,

          brandMedicationId:
            patientServiceAndProduct.billingItemType === 'MEDICATION'
              ? patientServiceAndProduct.brandMedicationId ?? null
              : null,

          diagnosticTestId: ['LABORATORY', 'RADIOLOGY', 'PATHOLOGY'].includes(
            patientServiceAndProduct.billingItemType
          )
            ? patientServiceAndProduct.diagnosticTestId ?? null
            : null,

          serviceId:
            patientServiceAndProduct.billingItemType === 'SERVICE'
              ? patientServiceAndProduct.serviceId ?? null
              : null,

          procedureId:
            patientServiceAndProduct.billingItemType === 'PROCEDURE'
              ? patientServiceAndProduct.procedureId ?? null
              : null,

          quantity: Number(patientServiceAndProduct.quantity),
          unitPrice: patientServiceAndProduct.unitPrice ?? 0,
          discountAmount: patientServiceAndProduct.discountAmount ?? 0,
          exemptionAmount: patientServiceAndProduct.exemptionAmount ?? 0,
          taxAmount: patientServiceAndProduct.taxAmount ?? 0,
          currency: patientServiceAndProduct.currency,
          isBilled: patientServiceAndProduct.isBilled ?? false,
          billingInvoiceId: patientServiceAndProduct.billingInvoiceId ?? null,
          billingInvoiceItemId: patientServiceAndProduct.billingInvoiceItemId ?? null
        };

        await updatePatientServiceAndProduct({
          id: patientServiceAndProduct.id,
          body: updateDTO,
          encounterId: encounter?.id
        }).unwrap();

        dispatch(
          notify({
            msg: 'Billing Item Updated Successfully',
            sev: 'success'
          })
        );
      }

      setPatientServiceAndProduct({ ...newPatientServiceAndProduct });
      setOpen(false);
    } catch (error) {
      const errorMsg = extractErrorMessage(error) || 'Failed to save Billing Item';
      dispatch(notify({ msg: errorMsg, sev: 'warning' }));
    }
  };

  const modalContent = (
    <Form fluid>
      <MyInput
        required
        fieldLabel="Category"
        fieldType="select"
        fieldName="billingItemType"
        selectData={billingItemTypeOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={patientServiceAndProduct}
        setRecord={val =>
          setPatientServiceAndProduct({
            ...val,
            brandMedicationId: null,
            diagnosticTestId: null,
            serviceId: null,
            procedureId: null,
            unitPrice: 0,
            currency: ''
          })
        }
        width="100%"
        searchable={false}
      />

      {itemSelectConfig && (
        <MyInput
          required
          fieldLabel={itemSelectConfig.fieldLabel}
          fieldType="selectPagination"
          fieldName={itemSelectConfig.fieldName}
          selectData={itemSelectConfig.selectData}
          selectDataLabel={itemSelectConfig.selectDataLabel}
          selectDataValue={itemSelectConfig.selectDataValue}
          record={patientServiceAndProduct}
          setRecord={setPatientServiceAndProduct}
          width="100%"
          searchable
          loading={itemSelectConfig.loading}
          hasMore={itemSelectConfig.hasMore}
          onFetchMore={async () => {}}
          onSelectItem={selectedItem => {
            setPatientServiceAndProduct({
              ...patientServiceAndProduct,
              [itemSelectConfig.fieldName]:
                selectedItem?.[itemSelectConfig.selectDataValue] ?? null,
              unitPrice: selectedItem?.price ?? 0,
              currency: selectedItem?.currency ?? ''
            });
          }}
        />
      )}

      <MyInput
        required
        fieldName="quantity"
        fieldLabel="Quantity"
        fieldType="number"
        record={patientServiceAndProduct}
        setRecord={setPatientServiceAndProduct}
        width="100%"
      />
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={patientServiceAndProduct?.id ? 'Edit Billing Item' : 'Add Billing Item'}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      actionButtonLoading={isCreating || isUpdating}
      position="right"
      size="30vw"
      bodyheight="80vh"
      content={modalContent}
    />
  );
};

export default AddEditPatientServiceAndProduct;
