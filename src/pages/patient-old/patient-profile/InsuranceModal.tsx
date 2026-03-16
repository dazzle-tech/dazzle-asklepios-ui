import { useAppDispatch } from '@/hooks';
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import './styles.less';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useSavePatientInsuranceMutation } from '@/services/patientService';
import { useGetPlansByPayorQuery } from '@/services/setup/payer/PayorPlanService';
import { useGetAllPayorsQuery } from '@/services/setup/payer/PayorService';
import { ApPatientInsurance } from '@/types/model-types';
import { newApPatientInsurance } from '@/types/model-types-constructor';
import { formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { faShieldHeart } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const InsuranceModal = ({
  open,
  setOpen,
  onClose,
  patientKey,
  refetchInsurance,
  editing,
  insuranceBrowsing,
  relations,
  hideSaveBtn = false
}) => {
  const [patientInsurance, setPatientInsurance] = useState<ApPatientInsurance>({
    ...newApPatientInsurance
  });
  const [savePatientInsurance] = useSavePatientInsuranceMutation();
  const [relationsList, setRelationsList] = useState<any[]>();
  const dispatch = useAppDispatch();

  const [prevPayorId, setPrevPayorId] = useState<number | undefined>(undefined);

  // Payor pagination state
  const [payorPage, setPayorPage] = useState(0);
  const [payorSearchKeyword, setPayorSearchKeyword] = useState('');

  // Payor Plans state
  const [planPage, setPlanPage] = useState(0);

  // Fetch Payors with pagination
  const {
    data: payorResponse,
    isLoading: payorLoading,
    isFetching: payorFetching
  } = useGetAllPayorsQuery({
    page: payorPage,
    size: 20,
    sort: 'name,asc',
    ...(payorSearchKeyword && { name: payorSearchKeyword })
  });

  // Fetch Payor Plans based on selected Payor
  const {
    data: plansResponse,
    isLoading: plansLoading,
    isFetching: plansFetching
  } = useGetPlansByPayorQuery(
    {
      payorId: Number(patientInsurance?.insuranceProviderLkey) || 0,
      page: planPage,
      size: 20,
      sort: 'name,asc'
    },
    {
      skip: !patientInsurance?.insuranceProviderLkey
    }
  );

  // Reset payors when search keyword changes
  useEffect(() => {
    setPayorPage(0);
  }, [payorSearchKeyword]);

  // عند تغيير الـ Payor:
  useEffect(() => {
    const currentPayorId = patientInsurance?.insuranceProviderLkey
      ? Number(patientInsurance.insuranceProviderLkey)
      : undefined;

    if (currentPayorId === prevPayorId) return;

    // reset plans list
    setPlanPage(0);

    if (prevPayorId !== undefined) {
      setPatientInsurance(prev => ({
        ...prev,
        insurancePlanTypeLkey: undefined
      }));
    }

    setPrevPayorId(currentPayorId);
  }, [patientInsurance?.insuranceProviderLkey, prevPayorId]);

  const hasMorePayors = payorResponse?.links?.next != null;
  const hasMorePlans = plansResponse?.links?.next != null;

  const handleLoadMorePayors = () => {
    if (hasMorePayors && !payorFetching) {
      setPayorPage(prev => prev + 1);
    }
  };

  const handleLoadMorePlans = () => {
    if (hasMorePlans && !plansFetching) {
      setPlanPage(prev => prev + 1);
    }
  };

  const renderContent = () => (
    <div>
      <Form layout="inline" fluid>
        <MyInput
          column
          fieldLabel="Payor"
          fieldType="selectPagination"
          fieldName="insuranceProviderLkey"
          selectData={payorResponse?.data ?? []}
          selectDataLabel="name"
          selectDataValue="id"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
          searchable={true}
          loading={payorLoading || payorFetching}
          hasMore={hasMorePayors}
          onFetchMore={handleLoadMorePayors}
          searchKeyWard={payorSearchKeyword}
          setSearchKeyWard={setPayorSearchKeyword}
          placeholder="Select Payor..."
        />
        <MyInput
          column
          fieldLabel="Insurance Policy Number"
          fieldName="insurancePolicyNumber"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
        />
        <MyInput
          column
          fieldLabel="Group Number"
          fieldName="groupNumber"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
        />
        <MyInput
          column
          fieldLabel="Plan"
          fieldType="selectPagination"
          fieldName="insurancePlanTypeLkey"
          selectData={plansResponse?.data ?? []}
          selectDataLabel="name"
          selectDataValue="id"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing || !patientInsurance?.insuranceProviderLkey}
          searchable={true}
          loading={plansLoading || plansFetching}
          hasMore={hasMorePlans}
          onFetchMore={handleLoadMorePlans}
          placeholder={
            !patientInsurance?.insuranceProviderLkey ? 'Select Payor first...' : 'Select Plan...'
          }
          renderMenuItem={(label, item) => {
            if (item?.isLoadMore) {
              return (
                <div
                  style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Load more...
                </div>
              );
            }
            return (
              <div>
                <div style={{ fontWeight: 500 }}>{item.name}</div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--primary-gray)'
                  }}
                >
                  {formatEnumString(item.planType)} • {formatEnumString(item.coverageType)} • $
                  {item.amount}
                </div>
              </div>
            );
          }}
        />
        <MyInput
          column
          fieldLabel="Authorization Numbers"
          fieldName="authorizationNumbers"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
        />
        <MyInput
          column
          fieldType="date"
          fieldLabel="Expiration Date"
          fieldName="expirationDate"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
        />
        <MyInput
          column
          fieldLabel="Remaining Benefits"
          fieldName="remainingBenefits"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
        />

        <MyInput
          column
          fieldLabel="Remailing Deductibles"
          fieldName="remailingDeductibles"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
        />
        <MyInput
          column
          fieldLabel="Policy Holder"
          fieldType="select"
          fieldName="policyHolder"
          selectData={relationsList}
          selectDataLabel="name"
          selectDataValue="id"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
          searchable={false}
        />
        <MyInput
          column
          fieldLabel="Primary Insurance"
          fieldName="primaryInsurance"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          fieldType="checkbox"
          disabled={insuranceBrowsing}
        />
      </Form>
      <div className="clickedInputs">
        <Form layout="inline" fluid>
          <MyInput
            column
            fieldLabel="Co Payment"
            fieldName="coPayment"
            record={patientInsurance}
            setRecord={setPatientInsurance}
            fieldType="checkbox"
            disabled={insuranceBrowsing}
          />
          <div className={`input-container ${patientInsurance?.coPayment ? 'show' : 'hide'}`}>
            <MyInput
              column
              fieldLabel="Co Payment Value"
              fieldName="coPaymentValue"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              disabled={insuranceBrowsing}
            />
          </div>
        </Form>
        <Form layout="inline" fluid>
          <MyInput
            column
            fieldLabel="Co Insurance"
            fieldName="coInsurance"
            record={patientInsurance}
            setRecord={setPatientInsurance}
            fieldType="checkbox"
            disabled={insuranceBrowsing}
          />
          <div className={`input-container ${patientInsurance?.coInsurance ? 'show' : 'hide'}`}>
            <MyInput
              column
              fieldLabel="Co Insurance Value"
              fieldName="coInsuranceValue"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              disabled={insuranceBrowsing}
            />
          </div>
        </Form>
        <Form layout="inline" fluid>
          <MyInput
            column
            fieldLabel="Deductibles"
            fieldName="deductibles"
            record={patientInsurance}
            setRecord={setPatientInsurance}
            fieldType="checkbox"
            disabled={insuranceBrowsing}
          />
          <div className={`input-container ${patientInsurance?.deductibles ? 'show' : 'hide'}`}>
            <MyInput
              column
              fieldLabel="Deductibles Value"
              fieldName="deductiblesValue"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              disabled={insuranceBrowsing}
            />
          </div>
        </Form>
      </div>
    </div>
  );

  const handleSave = async () => {
    savePatientInsurance({
      ...patientInsurance,
      patientKey: patientKey.key
    })
      .unwrap()
      .then(() => {
        refetchInsurance();
        handleClearModal();
        dispatch(notify({ msg: 'Insurance Saved Successfully', sev: 'success' }));
      })
      .catch(() => {
        setPatientInsurance({
          ...patientInsurance,
          primaryInsurance: false
        });
      });
  };

  const handleClearModal = () => {
    setPatientInsurance({ ...newApPatientInsurance });
    setPrevPayorId(undefined);
    setPayorPage(0);
    setPayorSearchKeyword('');
    setPlanPage(0);
    onClose();
  };

  useEffect(() => {
    const namesAndIds =
      relations?.map(relation => {
        const relativePatient = relation.relativePatientObject;
        return {
          name: `${relativePatient.firstName} ${relativePatient.lastName}`,
          id: relation.key
        };
      }) || [];
    setRelationsList(namesAndIds);
  }, [relations]);

  useEffect(() => {
    if (open === false) {
      handleClearModal();
    }
  }, [open]);

  useEffect(() => {
    if (editing) {
      const payorId = editing.insuranceProviderLkey
        ? Number(editing.insuranceProviderLkey)
        : undefined;
      const planId = editing.insurancePlanTypeLkey
        ? Number(editing.insurancePlanTypeLkey)
        : undefined;

      setPatientInsurance({
        ...editing,
        insuranceProviderLkey: payorId,
        insurancePlanTypeLkey: planId
      });

      setPrevPayorId(payorId);
    } else {
      // حالة الإضافة: بدون كاستينج، نرجع newApPatientInsurance
      setPatientInsurance({ ...newApPatientInsurance });
      setPrevPayorId(undefined);
    }
  }, [editing]);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Patient Insurance"
      bodyheight="70vh"
      content={renderContent}
      size="lg"
      steps={[
        {
          title: 'Insurance',
          icon: <FontAwesomeIcon icon={faShieldHeart} />
        }
      ]}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      hideActionBtn={hideSaveBtn}
    />
  );
};

export default InsuranceModal;
