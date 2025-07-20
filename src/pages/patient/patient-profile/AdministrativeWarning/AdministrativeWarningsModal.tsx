import React, { useState, useEffect } from 'react';
import { type ApPatient, type ApPatientAdministrativeWarnings } from '@/types/model-types';
import { newApPatientAdministrativeWarnings } from '@/types/model-types-constructor';
import {
  useGetPatientAdministrativeWarningsQuery,
  useSavePatientAdministrativeWarningsMutation,
  useUpdatePatientAdministrativeWarningsMutation,
  useDeletePatientAdministrativeWarningsMutation
} from '@/services/patientService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { InputGroup, Badge, Form, Input, Button } from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
import { faPlus, faCircleCheck, faRotateLeft, faTrashCan, faCalendarCheck, faCalendarXmark, faTriangleExclamation, faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import ChildModal from '@/components/ChildModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { fromCamelCaseToDBName } from '@/utils';
import { initialListRequest, type ListRequest } from '@/types/types';
import './styles.less';

interface AdministrativeWarningsModalProps {
  localPatient: ApPatient;
  validationResult: any;
}

const AdministrativeWarningsModal: React.FC<AdministrativeWarningsModalProps> = ({
  localPatient,
  validationResult
}) => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [openChildModal, setOpenChildModal] = useState(false);
  const [showSubChildModal, setShowSubChildModal] = useState(false);

  const [administrativeWarningDetails, setAdministrativeWarningDetails] = useState({ Details: '' });
  const [patientAdministrativeWarnings, setPatientAdministrativeWarnings] = useState<ApPatientAdministrativeWarnings>({ ...newApPatientAdministrativeWarnings });

  const [warningsAdmistritiveListRequest, setWarningsAdmistritiveListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      { fieldName: 'patient_key', operator: 'match', value: localPatient.key || undefined },
      { fieldName: 'deleted_at', operator: 'isNull', value: undefined }
    ]
  });

  const { data: warnings, refetch: warningsRefetch } = useGetPatientAdministrativeWarningsQuery(
    warningsAdmistritiveListRequest
  );

  const { data: administrativeWarningsLovQueryResponse, isLoading } = useGetLovValuesByCodeQuery('ADMIN_WARNINGS');

  const [savePatientAdministrativeWarnings] = useSavePatientAdministrativeWarningsMutation();
  const [updatePatientAdministrativeWarnings] = useUpdatePatientAdministrativeWarningsMutation();
  const [deletePatientAdministrativeWarnings] = useDeletePatientAdministrativeWarningsMutation();

  const AddNewAdministrativeWarning = () => {
    setPatientAdministrativeWarnings({ ...newApPatientAdministrativeWarnings, warningTypeLkey: null });
    setAdministrativeWarningDetails({ Details: '' });
    setOpenChildModal(true);
  };

  const handleSavePatientAdministrativeWarnings = () => {
    savePatientAdministrativeWarnings({
      ...patientAdministrativeWarnings,
      description: administrativeWarningDetails?.Details,
      patientKey: localPatient.key
    })
      .unwrap()
      .then(() => {
        setPatientAdministrativeWarnings({ ...newApPatientAdministrativeWarnings });
        setAdministrativeWarningDetails({ Details: '' });
        warningsRefetch();
        dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
        setOpenChildModal(false);
      });
  };

  const handleUpdateAdministrativeWarningsResolved = (warning) => {
    updatePatientAdministrativeWarnings({
      ...warning,
      dateResolved: new Date().toISOString(),
      resolvedBy: 'keyForCurrentUser',
      isValid: false
    })
      .unwrap()
      .then(() => {
        warningsRefetch();
        dispatch(notify('Resolved Successfully'));
      });
  };

  const handleUpdateAdministrativeWarningsUnDoResolved = (warning) => {
    updatePatientAdministrativeWarnings({
      ...warning,
      resolutionUndoDate: new Date().toISOString(),
      resolvedUndoBy: 'keyForCurrentUser',
      isValid: true
    })
      .unwrap()
      .then(() => {
        warningsRefetch();
        dispatch(notify('Activated Successfully'));
      });
  };

  const handleDeletePatientAdministrativeWarnings = (warning) => {
    deletePatientAdministrativeWarnings(warning)
      .unwrap()
      .then(() => {
        warningsRefetch();
        dispatch(notify({ msg: 'Deleted Successfully', sev: 'success' }));
      });
  };

  const handleFilterChangeInWarning = (fieldName, value) => {
    if (value) {
      setWarningsAdmistritiveListRequest(addFilterToListRequest(
        fromCamelCaseToDBName(fieldName),
        'containsIgnoreCase',
        String(value),
        warningsAdmistritiveListRequest
      ));
    } else {
      setWarningsAdmistritiveListRequest({
        ...warningsAdmistritiveListRequest,
        filters: [
          { fieldName: 'patient_key', operator: 'match', value: localPatient.key || undefined },
          { fieldName: 'deleted_at', operator: 'isNull', value: undefined }
        ]
      });
    }
  };

  const addFilterToListRequest = (fieldName, operator, value, listRequest) => {
    const newFilters = listRequest.filters.filter(
      filter => !['patient_key', 'deleted_at', fieldName].includes(filter.fieldName)
    );
    return {
      ...listRequest,
      filters: [
        ...newFilters,
        { fieldName: 'patient_key', operator: 'match', value: localPatient.key || undefined },
        { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
        { fieldName, operator, value }
      ]
    };
  };

  useEffect(() => {
    setWarningsAdmistritiveListRequest(prev => ({
      ...prev,
      filters: [
        { fieldName: 'patient_key', operator: 'match', value: localPatient.key || undefined },
        { fieldName: 'deleted_at', operator: 'isNull', value: undefined }
      ]
    }));
  }, [localPatient.key]);

  const mainContent = (
    <div>
      <div className="search-in-list-cards">
        <InputGroup inside>
          <Input placeholder="Search" onChange={(val) => handleFilterChangeInWarning('description', val)} />
          <InputGroup.Button><SearchIcon /></InputGroup.Button>
        </InputGroup>
        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faPlus} />} onClick={AddNewAdministrativeWarning}>
          Add
        </MyButton>
      </div>
      {isLoading ? (
        <div className="loader-card-container"><span className="loader">Loading...</span></div>
      ) : (
        <div className="patient-warning-list">
          {warnings?.object.map(warning => (
            <div className="main-card-container" key={warning.id}>
              <div className="left-side-card">
                <div className="card-content">
                  <div className="type-card-content">
                    <span className="title-type-card-content">Type</span>
                    <span className="custom-type-card-content">
                      {warning.warningTypeLvalue?.lovDisplayVale || warning.warningTypeLkey}
                    </span>
                  </div>
                  <div className="status-card-content">
                    {warning?.isValid
                      ? <Badge content="Active" className="status-active" />
                      : <Badge content="Resolved" className="status-resolved" />}
                  </div>
                </div>
                <div className="card-content">
                  <div className="description-card-content">
                    <span className="title-type-card-content">Description</span>
                    <span className="custom-description-card-content">{warning?.description}</span>
                  </div>
                </div>
                <div className="card-content">
                  <div className="card-action-by-at">
                    <span className="title-type-card-content">
                      <FontAwesomeIcon icon={faCalendarDay} /> ADDITION BY/DATE
                    </span>
                    <span className="custom-description-card-content">{warning?.createdBy || "By User"}</span>
                    <span className="custom-date-card-content">
                      {warning?.createdAt ? new Date(warning.createdAt).toLocaleDateString('en-CA') : ''}
                    </span>
                  </div>
                  <div className="card-action-by-at">
                    <span className="title-type-card-content">
                      <FontAwesomeIcon icon={faCalendarCheck} /> RESOLVED BY/DATE
                    </span>
                    <span className="custom-description-card-content">{warning?.resolvedBy}</span>
                    <span className="custom-date-card-content">{warning?.dateResolved}</span>
                  </div>
                  <div className="card-action-by-at">
                    <span className="title-type-card-content">
                      <FontAwesomeIcon icon={faCalendarXmark} /> RESOLUTION UNDO BY/DATE
                    </span>
                    <span className="custom-description-card-content">{warning?.resolvedUndoBy}</span>
                    <span className="custom-date-card-content">{warning?.resolutionUndoDate}</span>
                  </div>
                </div>
              </div>
              <div className="right-side-card">
                <Button className="custom-btn-action" disabled={!warning.isValid} onClick={() => handleUpdateAdministrativeWarningsResolved(warning)}>
                  <FontAwesomeIcon icon={faCircleCheck} />
                </Button>
                <Button className="custom-btn-action" disabled={warning.isValid == undefined || warning.isValid} onClick={() => handleUpdateAdministrativeWarningsUnDoResolved(warning)}>
                  <FontAwesomeIcon icon={faRotateLeft} />
                </Button>
                <Button className="custom-btn-action" onClick={() => handleDeletePatientAdministrativeWarnings(warning)}>
                  <FontAwesomeIcon icon={faTrashCan} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const childContent = (
    <Form fluid>
      <MyInput
        vr={validationResult}
        required
        fieldLabel="Warning Type"
        fieldType="select"
        fieldName="warningTypeLkey"
        selectData={administrativeWarningsLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={patientAdministrativeWarnings}
        setRecord={setPatientAdministrativeWarnings}
        width={350}
      />
      <MyInput
        vr={validationResult}
        fieldLabel="Description"
        fieldType="textarea"
        fieldName="Details"
        record={administrativeWarningDetails}
        setRecord={setAdministrativeWarningDetails}
        width={350}
        height={100}
      />
      <MyButton onClick={() => setShowSubChildModal(true)} appearance="link" color="blue">
        Open Sub-Child Modal
      </MyButton>
    </Form>
  );

  const subChildContent = (
    <div>
      <h5>Sub Child Modal Content</h5>
      <p>هنا يمكنك إدخال تفاصيل إضافية أو عرض ملاحظات مرتبطة بالتنبيه الإداري</p>
    </div>
  );

  return (
    <>
      <MyButton
        appearance="ghost"
        disabled={!localPatient.key}
        onClick={() => setOpen(true)}
        color={warnings?.extraNumeric > 0 ? "orange" : "var(--primary-blue)"}
      >
        Administrative Warnings
      </MyButton>

      <ChildModal
        open={open}
        setOpen={setOpen}
        showChild={openChildModal}
        setShowChild={setOpenChildModal}
        showSubChild={showSubChildModal}
        setShowSubChild={setShowSubChildModal}
        title="Administrative Warnings"
        mainContent={mainContent}
        childTitle="Add New"
        childContent={childContent}
        subChildTitle="تفاصيل إضافية"
        subChildContent={subChildContent}
        childStep={[{ title: "Administrative Warning", icon: <FontAwesomeIcon icon={faTriangleExclamation} /> }]}
        subChildStep={[{ title: "تفاصيل إضافية", icon: <FontAwesomeIcon icon={faTriangleExclamation} /> }]}
        mainSize="sm"
        childSize="xs"
        subChildSize="xs"
        hideActionBtn={true}
        hideActionSubChildBtn={true}
        actionChildButtonFunction={handleSavePatientAdministrativeWarnings}
      />
    </>
  );
};

export default AdministrativeWarningsModal;