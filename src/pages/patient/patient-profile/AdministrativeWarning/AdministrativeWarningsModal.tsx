import React, { useState } from 'react';
import { type ApPatient, type ApPatientAdministrativeWarnings } from '@/types/model-types';
import { newApPatientAdministrativeWarnings } from '@/types/model-types-constructor';
import { InputGroup, Badge, Form, Input, Button } from 'rsuite';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import MyInput from '@/components/MyInput';
import { useGetPatientAdministrativeWarningsQuery, useSavePatientAdministrativeWarningsMutation, useUpdatePatientAdministrativeWarningsMutation, useDeletePatientAdministrativeWarningsMutation } from '@/services/patientService';
import SearchIcon from '@rsuite/icons/Search';
import { initialListRequest, type ListRequest } from '@/types/types';
import { fromCamelCaseToDBName } from '@/utils';
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { faCalendarXmark } from '@fortawesome/free-solid-svg-icons';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import './styles.less'
import ChildModal from '@/components/ChildModal';
import MyButton from '@/components/MyButton/MyButton';
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

  const [administrativeWarningDetails, setAdministrativeWarningDetails] = useState({ Details: '' });
  const [patientAdministrativeWarnings, setPatientAdministrativeWarnings] = useState<ApPatientAdministrativeWarnings>({ ...newApPatientAdministrativeWarnings });
  const [openChildModal, setOpenChildModal] = useState(false);
  // Fetch LOV data for various fields
  const { data: administrativeWarningsLovQueryResponse, isLoading } = useGetLovValuesByCodeQuery('ADMIN_WARNINGS');

  // Mutations
  const [savePatientAdministrativeWarnings] = useSavePatientAdministrativeWarningsMutation();
  const [updatePatientAdministrativeWarnings] = useUpdatePatientAdministrativeWarningsMutation();
  const [deletePatientAdministrativeWarnings] = useDeletePatientAdministrativeWarningsMutation();

  // Initialize patient Warning list request with default filters
  const [warningsAdmistritiveListRequest, setWarningsAdmistritiveListRequest] =
    useState<ListRequest>({
      ...initialListRequest,
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: localPatient.key || undefined
        },
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        }
      ]
    });

  // Fetch patient Warnings
  const { data: warnings, refetch: warningsRefetch } = useGetPatientAdministrativeWarningsQuery(
    warningsAdmistritiveListRequest
  );

  // Handle filter change
  const handleFilterChangeInWarning = (fieldName, value) => {
    if (value) {
      setWarningsAdmistritiveListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'containsIgnoreCase',
          String(value),
          warningsAdmistritiveListRequest
        )
      );
    } else {
      setWarningsAdmistritiveListRequest({
        ...warningsAdmistritiveListRequest,
        filters: [
          {
            fieldName: 'patient_key',
            operator: 'match',
            value: localPatient.key || undefined
          },
          {
            fieldName: 'deleted_at',
            operator: 'isNull',
            value: undefined
          }
        ]
      });
    }
  };

  // Helper function for filter
  const addFilterToListRequest = (fieldName, operator, value, listRequest) => {
    const newFilters = listRequest.filters.filter(
      filter =>
        filter.fieldName !== fieldName &&
        filter.fieldName !== 'patient_key' &&
        filter.fieldName !== 'deleted_at'
    );

    return {
      ...listRequest,
      filters: [
        ...newFilters,
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: localPatient.key || undefined
        },
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        },
        {
          fieldName,
          operator,
          value
        }
      ]
    };
  };
  // Handle new Add Patient warning 
  const AddNewAdministrativeWarning = () => {
    setPatientAdministrativeWarnings({ ...newApPatientAdministrativeWarnings, warningTypeLkey: null });
    setAdministrativeWarningDetails({ Details: '' })
    setOpenChildModal(true);
  }
  // Handle save Patient warning 
  const handleSavePatientAdministrativeWarnings = () => {
    savePatientAdministrativeWarnings({
      ...patientAdministrativeWarnings,
      description: administrativeWarningDetails?.Details,
      patientKey: localPatient.key
    })
      .unwrap()
      .then(() => {
        setPatientAdministrativeWarnings({
          ...patientAdministrativeWarnings,
          description: '',
          warningTypeLkey: undefined
        });
        setAdministrativeWarningDetails({ Details: '' });
        warningsRefetch();
        dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
        setPatientAdministrativeWarnings({ ...newApPatientAdministrativeWarnings });
        setOpenChildModal(false);
      });
  };

  // Handle resolve Patient warning 
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
  console.log("warning-->", warnings);
  // Handle undo resolve Patient warning 
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

  // Handle delete Patient warning 
  const handleDeletePatientAdministrativeWarnings = (warning) => {
    deletePatientAdministrativeWarnings({
      ...warning
    })
      .unwrap()
      .then(() => {
        warningsRefetch();
        dispatch(notify({ msg: 'Deleted Successfully', sev: 'success' }));
      });
  };
  // Main Modal Content 
  const mainContent = (
    <div>
      <div className='search-in-list-cards'>
        <InputGroup inside >
          <Input
            placeholder="Search"
          />
          <InputGroup.Button>
            <SearchIcon />
          </InputGroup.Button>
        </InputGroup>
        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faPlus} />} onClick={AddNewAdministrativeWarning}>Add</MyButton>
      </div>
      {isLoading ? (
        <div className="loader-card-container">
          <span className="loader">Loading...</span>
        </div>
      ) : (
        <div className="patient-warning-list">
          {warnings?.object.map(warning => (
            <div className='main-card-container' key={warning.id}>
              <div className="left-side-card">
                <div className='card-content'>
                  <div className='type-card-content'>
                    <span className='title-type-card-content'>Type</span>
                    <span className='custom-type-card-content'>
                      {warning.warningTypeLvalue
                        ? warning.warningTypeLvalue.lovDisplayVale
                        : warning.warningTypeLkey}
                    </span>
                  </div>
                  <div className='status-card-content'>
                    {warning?.isValid ? (
                      <Badge content="Active" className="status-active" />
                    ) : (
                      <Badge content="Resolved" className="status-resolved" />
                    )}
                  </div>
                </div>
                <div className='card-content'>
                  <div className='description-card-content'>
                    <span className='title-type-card-content'>Description</span>
                    <span className='custom-description-card-content'>{warning?.description}</span>
                  </div>
                </div>
                <div className='card-content'>
                  <div className='card-action-by-at'>
                    <span className='title-type-card-content'>
                      <FontAwesomeIcon icon={faCalendarDay} className='title-type-card-content' /> ADDITION BY/DATE
                    </span>
                    <span className='custom-description-card-content'>
                      {warning?.createdBy ? warning?.createdBy : "By User"}
                    </span>
                    <span className='custom-date-card-content'>
                      {warning?.createdAt ? new Date(warning.createdAt).toLocaleDateString('en-CA') : ''}
                    </span>
                  </div>
                  <div className='card-action-by-at'>
                    <span className='title-type-card-content'>
                      <FontAwesomeIcon icon={faCalendarCheck} className='title-type-card-content' /> RESOLVED BY/DATE
                    </span>
                    <span className='custom-description-card-content'>{warning?.resolvedBy}</span>
                    <span className='custom-date-card-content'>{warning?.dateResolved}</span>
                  </div>
                  <div className='card-action-by-at'>
                    <span className='title-type-card-content'>
                      <FontAwesomeIcon icon={faCalendarXmark} className='title-type-card-content' /> RESOLUTION UNDO BY/DATE
                    </span>
                    <span className='custom-description-card-content'>{warning?.resolvedUndoBy}</span>
                    <span className='custom-date-card-content'>{warning?.resolutionUndoDate}</span>
                  </div>
                </div>
              </div>
              <div className="right-side-card">
                <Button className='custom-btn-action'
                  disabled={!warning.isValid} onClick={() => { handleUpdateAdministrativeWarningsResolved(warning) }}>
                  <FontAwesomeIcon icon={faCircleCheck} />
                </Button>
                <Button className='custom-btn-action' disabled={warning.isValid == undefined || warning.isValid} onClick={() => { handleUpdateAdministrativeWarningsUnDoResolved(warning) }}>
                  <FontAwesomeIcon icon={faRotateLeft} />
                </Button>
                <Button className='custom-btn-action' onClick={() => { handleDeletePatientAdministrativeWarnings(warning) }}>
                  <FontAwesomeIcon icon={faTrashCan} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // const Child Content 
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
        selectData={administrativeWarningsLovQueryResponse?.object ?? []}
        record={administrativeWarningDetails}
        setRecord={setAdministrativeWarningDetails}
        width={350}
        height={100}
      />
    </Form>
  );


  // Update filters when patient changes
  React.useEffect(() => {
    const updatedFilters = [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: localPatient.key || undefined
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ];
    setWarningsAdmistritiveListRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));
  }, [localPatient.key]);

  return (
    <>
      <MyButton
        appearance="ghost"
        disabled={!localPatient.key}
        onClick={() => setOpen(true)}
        color={warnings?.extraNumeric > 0 ? "orange" : "blue"}
      >Administrative Warnings</MyButton>
      <ChildModal
        open={open}
        setOpen={setOpen}
        showChild={openChildModal}
        setShowChild={setOpenChildModal}
        title="Administrative Warnings"
        mainContent={mainContent}
        childTitle="Add New"
        childContent={childContent}
        childStep={[{ title: "Administrative Warning", icon: <FontAwesomeIcon icon={faTriangleExclamation} /> }]}
        mainSize="sm"
        childSize="xs"
        hideActionBtn={true}
        actionChildButtonFunction={handleSavePatientAdministrativeWarnings}
      />
    </>
  );
};

export default AdministrativeWarningsModal;
