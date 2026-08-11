import React, { useEffect, useMemo, useState } from 'react';
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
import { useEvaluateBillingRuleMutation } from '@/services/billing/billingTransactionService';
import { usePreviewCatalogItemPricingMutation } from '@/services/billing/financialDocumentAdjustmentService';
import { notify } from '@/utils/uiReducerActions';
import {
  buildBillingRuleEvaluationRequest,
  extractBillingRuleErrorMessage,
  formatBillingRuleEvaluationMessage
} from '@/utils/billingRuleEvaluationUtils';
import {
  PatientServiceAndProduct,
  PatientServiceProductCreateDTO,
  PatientServiceProductUpdateDTO,
  BillingEventType
} from '@/types/model-types-new';
import {
  newPatientServiceAndProduct,
  newPatientServiceProductCreateDTO,
  newPatientServiceProductUpdateDTO
} from '@/types/model-types-constructor-new';

import {
  useGetActiveServicesByFacilityQuery,
  useGetServicesByNameQuery
} from '@/services/setup/serviceService';

import {
  useGetBrandMedicationsByIsActiveQuery,
  useGetBrandMedicationsByNameQuery
} from '@/services/setup/brandmedication/BrandMedicationService';

import {
  useGetActiveDiagnosticTestsByTypeQuery,
  useGetAllDiagnosticTestsByNameAndTypeQuery
} from '@/services/setup/diagnosticTest/diagnosticTestService';

import {
  useGetActiveProceduresByFacilityQuery,
  useGetProceduresByNameQuery
} from '@/services/setup/procedure/procedureService';

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


    const [selectPage, setSelectPage] = useState(0);
    const [selectSearch, setSelectSearch] = useState('');
    const [debouncedSelectSearch, setDebouncedSelectSearch] = useState('');

    const [selectData, setSelectData] = useState<any[]>([]);
    const [selectedSelectItem, setSelectedSelectItem] = useState<any>(null);

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedSelectSearch(selectSearch.trim());
      }, 300);

      return () => clearTimeout(timer);
    }, [selectSearch]);

    useEffect(() => {
      setSelectPage(0);
      setSelectSearch('');
      setDebouncedSelectSearch('');
      setSelectData([]);
      setSelectedSelectItem(null);
    }, [patientServiceAndProduct?.billingItemType]);


  const billingItemTypeOptions = useEnumOptions('BillingItemTypes', { exclude: ['PATHOLOGY'] });

    const {
      data: activeServicesResponse,
      isFetching: isFetchingServices
    } = useGetActiveServicesByFacilityQuery(
      {
        facilityId: selectedFacilityId,
        page: selectPage,
        size: 5,
        sort: 'id,asc'
      },
      {
        skip:
          !open ||
          !selectedFacilityId ||
          patientServiceAndProduct?.billingItemType !== 'SERVICE' ||
          Boolean(debouncedSelectSearch)
      }
    );

    const {
      data: servicesSearchResponse,
      isFetching: isFetchingServicesSearch
    } = useGetServicesByNameQuery(
      {
        name: debouncedSelectSearch,
        page: selectPage,
        size: 20,
        sort: 'id,asc'
      },
      {
        skip:
          !open ||
          patientServiceAndProduct?.billingItemType !== 'SERVICE' ||
          !debouncedSelectSearch
      }
    );

    const {
      data: medicationsResponse,
      isFetching: isFetchingMedications
    } = useGetBrandMedicationsByIsActiveQuery(
      {
        isActive: true,
        page: selectPage,
        size: 5,
        sort: 'id,asc'
      },
      {
        skip:
          !open ||
          patientServiceAndProduct?.billingItemType !== 'MEDICATION' ||
          Boolean(debouncedSelectSearch)
      }
    );

    const {
      data: medicationsSearchResponse,
      isFetching: isFetchingMedicationsSearch
    } = useGetBrandMedicationsByNameQuery(
      {
        name: debouncedSelectSearch,
        page: selectPage,
        size: 20,
        sort: 'id,asc'
      },
      {
        skip:
          !open ||
          patientServiceAndProduct?.billingItemType !== 'MEDICATION' ||
          !debouncedSelectSearch
      }
    );

    const {
      data: laboratoryResponse,
      isFetching: isFetchingLaboratory
    } = useGetActiveDiagnosticTestsByTypeQuery(
      {
        type: 'LABORATORY',
        page: selectPage,
        size: 5,
        sort: 'id,asc'
      },
      {
        skip:
          !open ||
          patientServiceAndProduct?.billingItemType !== 'LABORATORY' ||
          Boolean(debouncedSelectSearch)
      }
    );

    const {
      data: laboratorySearchResponse,
      isFetching: isFetchingLaboratorySearch
    } = useGetAllDiagnosticTestsByNameAndTypeQuery(
      {
        type: 'LABORATORY',
        name: debouncedSelectSearch,
        page: selectPage,
        size: 20,
        sort: 'id,asc'
      },
      {
        skip:
          !open ||
          patientServiceAndProduct?.billingItemType !== 'LABORATORY' ||
          !debouncedSelectSearch
      }
    );

    const {
      data: radiologyResponse,
      isFetching: isFetchingRadiology
    } = useGetActiveDiagnosticTestsByTypeQuery(
      {
        type: 'RADIOLOGY',
        page: selectPage,
        size: 5,
        sort: 'id,asc'
      },
      {
        skip:
          !open ||
          patientServiceAndProduct?.billingItemType !== 'RADIOLOGY' ||
          Boolean(debouncedSelectSearch)
      }
    );

    const {
      data: radiologySearchResponse,
      isFetching: isFetchingRadiologySearch
    } = useGetAllDiagnosticTestsByNameAndTypeQuery(
      {
        type: 'RADIOLOGY',
        name: debouncedSelectSearch,
        page: selectPage,
        size: 20,
        sort: 'id,asc'
      },
      {
        skip:
          !open ||
          patientServiceAndProduct?.billingItemType !== 'RADIOLOGY' ||
          !debouncedSelectSearch
      }
    );

    const {
      data: pathologyResponse,
      isFetching: isFetchingPathology
    } = useGetActiveDiagnosticTestsByTypeQuery(
      {
        type: 'PATHOLOGY',
        page: selectPage,
        size: 5,
        sort: 'id,asc'
      },
      {
        skip:
          !open ||
          patientServiceAndProduct?.billingItemType !== 'PATHOLOGY' ||
          Boolean(debouncedSelectSearch)
      }
    );

    const {
      data: pathologySearchResponse,
      isFetching: isFetchingPathologySearch
    } = useGetAllDiagnosticTestsByNameAndTypeQuery(
      {
        type: 'PATHOLOGY',
        name: debouncedSelectSearch,
        page: selectPage,
        size: 20,
        sort: 'id,asc'
      },
      {
        skip:
          !open ||
          patientServiceAndProduct?.billingItemType !== 'PATHOLOGY' ||
          !debouncedSelectSearch
      }
    );

    const {
      data: proceduresResponse,
      isFetching: isFetchingProcedures
    } = useGetActiveProceduresByFacilityQuery(
      {
        facilityId: selectedFacilityId,
        page: selectPage,
        size: 5,
        sort: 'id,asc'
      },
      {
        skip:
          !open ||
          !selectedFacilityId ||
          patientServiceAndProduct?.billingItemType !== 'PROCEDURE' ||
          Boolean(debouncedSelectSearch)
      }
    );

    const {
      data: proceduresSearchResponse,
      isFetching: isFetchingProceduresSearch
    } = useGetProceduresByNameQuery(
      {
        name: debouncedSelectSearch,
        page: selectPage,
        size: 20,
        sort: 'id,asc'
      },
      {
        skip:
          !open ||
          patientServiceAndProduct?.billingItemType !== 'PROCEDURE' ||
          !debouncedSelectSearch
      }
    );


    const getSearchData = (response: any) => {
  return (response?.data ?? []).filter(
    (item: any) => item?.isActive === true
  );
};

    const currentSelectResponse = useMemo(() => {
      switch (patientServiceAndProduct?.billingItemType) {
        case 'MEDICATION':
          return debouncedSelectSearch
            ? medicationsSearchResponse
            : medicationsResponse;

        case 'LABORATORY':
          return debouncedSelectSearch
            ? laboratorySearchResponse
            : laboratoryResponse;

        case 'RADIOLOGY':
          return debouncedSelectSearch
            ? radiologySearchResponse
            : radiologyResponse;

        case 'PATHOLOGY':
          return debouncedSelectSearch
            ? pathologySearchResponse
            : pathologyResponse;

        case 'SERVICE':
          return debouncedSelectSearch
            ? servicesSearchResponse
            : activeServicesResponse;

        case 'PROCEDURE':
          return debouncedSelectSearch
            ? proceduresSearchResponse
            : proceduresResponse;

        default:
          return null;
      }
    }, [
      patientServiceAndProduct?.billingItemType,
      debouncedSelectSearch,

      medicationsResponse,
      medicationsSearchResponse,

      laboratoryResponse,
      laboratorySearchResponse,

      radiologyResponse,
      radiologySearchResponse,

      pathologyResponse,
      pathologySearchResponse,

      activeServicesResponse,
      servicesSearchResponse,

      proceduresResponse,
      proceduresSearchResponse
    ]);

    useEffect(() => {
      if (!currentSelectResponse?.data) {
        return;
      }

      const incomingData = debouncedSelectSearch
        ? currentSelectResponse.data.filter(
            (item: any) => item?.isActive === true
          )
        : currentSelectResponse.data;

      setSelectData(prev => {
        const combined =
          selectPage === 0
            ? incomingData
            : [...prev, ...incomingData];

        return Array.from(
          new Map(
            combined
              .filter(item => item?.id != null)
              .map(item => [String(item.id), item])
          ).values()
        );
      });
    }, [
      currentSelectResponse,
      debouncedSelectSearch,
      selectPage
    ]);


  const [createPatientServiceAndProduct, { isLoading: isCreating }] =
    useCreatePatientServiceOrProductMutation();

  const [updatePatientServiceAndProduct, { isLoading: isUpdating }] =
    useUpdatePatientServiceOrProductMutation();

  const [evaluateBillingRule] = useEvaluateBillingRuleMutation();
  const [previewCatalogItemPricing] = usePreviewCatalogItemPricingMutation();

  const resolveUnitPrice = async (
    nextRecord: PatientServiceAndProduct,
    setupFallbackPrice: number
  ) => {
    if (!patient?.id || !encounter?.id || !selectedFacilityId) {
      return setupFallbackPrice;
    }

    const billingItemType = String(nextRecord.billingItemType ?? '');

    try {
      const preview = await previewCatalogItemPricing({
        patientId: patient.id,
        encounterId: encounter.id,
        facilityId: Number(selectedFacilityId),
        currency:
          nextRecord.currency ||
          authSlice?.tenant?.selectedFacility?.defaultCurrency ||
          'SAR',
        billingItemType,
        brandMedicationId:
          billingItemType === 'MEDICATION'
            ? nextRecord.brandMedicationId ?? undefined
            : undefined,
        diagnosticTestId: ['LABORATORY', 'RADIOLOGY', 'PATHOLOGY'].includes(
          billingItemType
        )
          ? nextRecord.diagnosticTestId ?? undefined
          : undefined,
        serviceId:
          billingItemType === 'SERVICE' ? nextRecord.serviceId ?? undefined : undefined,
        procedureId:
          billingItemType === 'PROCEDURE' ? nextRecord.procedureId ?? undefined : undefined,
        quantity: Number(nextRecord.quantity ?? 1),
        coverageType: 'SELF_PAY',
        patientInsuranceId: null
      }).unwrap();

      return Number(preview.unitPrice ?? preview.setupUnitPrice ?? setupFallbackPrice ?? 0);
    } catch {
      return setupFallbackPrice;
    }
  };

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

  const validateBillingRuleBeforeSave = async () => {
    const evaluationRequest = buildBillingRuleEvaluationRequest(
      patientServiceAndProduct.billingItemType,
      BillingEventType.ITEM_ORDERED,
      {
        serviceId: patientServiceAndProduct.serviceId,
        procedureId: patientServiceAndProduct.procedureId,
        diagnosticTestId: patientServiceAndProduct.diagnosticTestId,
        brandMedicationId: patientServiceAndProduct.brandMedicationId
      }
    );

    const evaluation = await evaluateBillingRule(evaluationRequest).unwrap();

    if (!evaluation.ruleFound) {
      dispatch(
        notify({
          msg: formatBillingRuleEvaluationMessage(evaluation),
          sev: 'error'
        })
      );
      return false;
    }

    return true;
  };

  const itemSelectConfig = useMemo(() => {
    switch (patientServiceAndProduct?.billingItemType) {
      case 'MEDICATION':
        return {
          fieldName: 'brandMedicationId',
          fieldLabel: 'Medication',
          selectData,
          selectDataLabel: 'name',
          selectDataValue: 'id',
          loading:
            isFetchingMedications ||
            isFetchingMedicationsSearch,
          hasMore:
            currentSelectResponse?.links?.next != null
        };

      case 'LABORATORY':
        return {
          fieldName: 'diagnosticTestId',
          fieldLabel: 'Laboratory Test',
          selectData,
          selectDataLabel: 'name',
          selectDataValue: 'id',
          loading:
            isFetchingLaboratory ||
            isFetchingLaboratorySearch,
          hasMore:
            currentSelectResponse?.links?.next != null
        };

      case 'RADIOLOGY':
        return {
          fieldName: 'diagnosticTestId',
          fieldLabel: 'Radiology Test',
          selectData,
          selectDataLabel: 'name',
          selectDataValue: 'id',
          loading:
            isFetchingRadiology ||
            isFetchingRadiologySearch,
          hasMore:
            currentSelectResponse?.links?.next != null
        };

      case 'PATHOLOGY':
        return {
          fieldName: 'diagnosticTestId',
          fieldLabel: 'Pathology Test',
          selectData,
          selectDataLabel: 'name',
          selectDataValue: 'id',
          loading:
            isFetchingPathology ||
            isFetchingPathologySearch,
          hasMore:
            currentSelectResponse?.links?.next != null
        };

      case 'SERVICE':
        return {
          fieldName: 'serviceId',
          fieldLabel: 'Service',
          selectData,
          selectDataLabel: 'name',
          selectDataValue: 'id',
          loading:
            isFetchingServices ||
            isFetchingServicesSearch,
          hasMore:
            currentSelectResponse?.links?.next != null
        };

      case 'PROCEDURE':
        return {
          fieldName: 'procedureId',
          fieldLabel: 'Procedure',
          selectData,
          selectDataLabel: 'name',
          selectDataValue: 'id',
          loading:
            isFetchingProcedures ||
            isFetchingProceduresSearch,
          hasMore:
            currentSelectResponse?.links?.next != null
        };

      default:
        return null;
    }
  }, [
    patientServiceAndProduct?.billingItemType,
    selectData,
    currentSelectResponse,

    isFetchingMedications,
    isFetchingMedicationsSearch,

    isFetchingLaboratory,
    isFetchingLaboratorySearch,

    isFetchingRadiology,
    isFetchingRadiologySearch,

    isFetchingPathology,
    isFetchingPathologySearch,

    isFetchingServices,
    isFetchingServicesSearch,

    isFetchingProcedures,
    isFetchingProceduresSearch
  ]);

  const handleFetchMore = () => {
    if (
      isFetchingMedications ||
      isFetchingMedicationsSearch ||
      isFetchingLaboratory ||
      isFetchingLaboratorySearch ||
      isFetchingRadiology ||
      isFetchingRadiologySearch ||
      isFetchingPathology ||
      isFetchingPathologySearch ||
      isFetchingServices ||
      isFetchingServicesSearch ||
      isFetchingProcedures ||
      isFetchingProceduresSearch
    ) {
      return;
    }

    if (currentSelectResponse?.links?.next != null) {
      setSelectPage(prev => prev + 1);
    }
  };

  const handleSelectSearch = (value: string) => {
    setSelectSearch(value);
    setSelectPage(0);
    setSelectData([]);
  };

  const selectDataWithSelectedItem = useMemo(() => {
    if (!selectedSelectItem?.id) {
      return selectData;
    }

    const exists = selectData.some(
      item => String(item?.id) === String(selectedSelectItem.id)
    );

    if (exists) {
      return selectData;
    }

    return [selectedSelectItem, ...selectData];
  }, [selectData, selectedSelectItem]);

  const handleSave = async () => {
    const validationError = getValidationError();

    if (validationError) {
      dispatch(notify({ msg: validationError, sev: 'warning' }));
      return;
    }

    try {
      if (!patientServiceAndProduct?.id) {
        const billingRuleReady = await validateBillingRuleBeforeSave();
        if (!billingRuleReady) {
          return;
        }

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
      const errorMsg =
        extractBillingRuleErrorMessage(error) ||
        extractErrorMessage(error) ||
        'Failed to save Billing Item';
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

          selectData={selectDataWithSelectedItem}
          selectDataLabel={itemSelectConfig.selectDataLabel}
          selectDataValue={itemSelectConfig.selectDataValue}

          record={patientServiceAndProduct}
          setRecord={setPatientServiceAndProduct}

          width="100%"
          searchable

          searchKeyWard={selectSearch}
          setSearchKeyWard={handleSelectSearch}

          loading={itemSelectConfig.loading}
          hasMore={itemSelectConfig.hasMore}
          onFetchMore={handleFetchMore}

          onSelectItem={async selectedItem => {
            setSelectedSelectItem(selectedItem);

            const setupFallbackPrice =
              Number(selectedItem?.price ?? 0);

            const nextRecord = {
              ...patientServiceAndProduct,
              [itemSelectConfig.fieldName]:
                selectedItem?.[itemSelectConfig.selectDataValue] ?? null,
              unitPrice: 0,
              currency:
                selectedItem?.currency ??
                authSlice?.tenant?.selectedFacility?.defaultCurrency ??
                'SAR'
            };

            const unitPrice = await resolveUnitPrice(
              nextRecord,
              setupFallbackPrice
            );

            setPatientServiceAndProduct({
              ...nextRecord,
              unitPrice
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
