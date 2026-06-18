import ChildModal from '@/components/ChildModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useCreatePatientAdministrativeWarningMutation,
  useDeletePatientAdministrativeWarningMutation,
  useGetWarningsByPatientIdQuery,
  useResolvePatientAdministrativeWarningMutation,
  useSearchWarningsByPatientIdQuery,
  useUndoResolvePatientAdministrativeWarningMutation
} from '@/services/patient/patientAdministrativeWarningsService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Patient } from '@/types/model-types-new';
import { notify } from '@/utils/uiReducerActions';
import {
  faCircleCheck,
  faPlus,
  faRotateLeft,
  faTrashCan,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SearchIcon from '@rsuite/icons/Search';
import React, { useMemo, useState } from 'react';
import { Badge, Form, Input, InputGroup } from 'rsuite';
import './styles.less';
import UserDateCell from '@/components/UserDateCell';

interface AdministrativeWarningsModalProps {
  localPatient: Patient;
  validationResult: any;
}

const AdministrativeWarningsModal: React.FC<AdministrativeWarningsModalProps> = ({
  localPatient,
  validationResult
}) => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [openChildModal, setOpenChildModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [warningToDelete, setWarningToDelete] = useState<any>(null);
  const [warningType, setWarningType] = useState<string | null>(null);

  const [description, setDescription] = useState('');

  const { data: lovData } = useGetLovValuesByCodeQuery('ADMIN_WARNINGS');

  const filteredLovData = useMemo(() => {
    return lovData?.object?.filter((lov: any) => lov.valueCode !== 'ADWR_DNR') ?? [];
  }, [lovData]);

  const { data: warnings, isLoading } = useGetWarningsByPatientIdQuery(
    { patientId: localPatient.id! },
    { skip: !localPatient.id }
  );

  const { data: searchedWarnings } = useSearchWarningsByPatientIdQuery(
    { patientId: localPatient.id!, searchText },
    { skip: !localPatient.id || !searchText }
  );

  const [createWarning] = useCreatePatientAdministrativeWarningMutation();
  const [resolveWarning] = useResolvePatientAdministrativeWarningMutation();
  const [undoResolveWarning] = useUndoResolvePatientAdministrativeWarningMutation();
  const [deleteWarning] = useDeletePatientAdministrativeWarningMutation();

  const warningsList = searchText ? searchedWarnings : warnings;
  const activeCount = warnings ? warnings.filter(w => !w.resolved).length : 0;

  const handleAddNew = () => {
    setWarningType(null);
    setDescription('');
    setOpenChildModal(true);
  };

  const handleSave = async () => {
    if (!warningType) return;

    try {
      await createWarning({
        patientId: localPatient.id!,
        warningType: warningType!,
        description
      }).unwrap();

      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
      setOpenChildModal(false);
    } catch {
      dispatch(notify({ msg: 'Failed To Save', sev: 'error' }));
    }
  };

  const handleResolve = async (warning: any) => {
    try {
      await resolveWarning({
        id: warning.id
      }).unwrap();

      dispatch(notify({ msg: 'Resolved Successfully', sev: 'success' }));
    } catch {
      dispatch(notify({ msg: 'Resolve Failed', sev: 'error' }));
    }
  };

  const handleUndoResolve = async (warning: any) => {
    try {
      await undoResolveWarning({
        id: warning.id
      }).unwrap();

      dispatch(notify({ msg: 'Undo Resolve Successfully', sev: 'success' }));
    } catch {
      dispatch(notify({ msg: 'Undo Failed', sev: 'error' }));
    }
  };

  const handleDelete = async () => {
    if (!warningToDelete) return;

    try {
      await deleteWarning({
        id: warningToDelete.id,
        patientId: localPatient.id
      }).unwrap();

      dispatch(notify({ msg: 'Deleted Successfully', sev: 'success' }));
      setDeleteModalOpen(false);
      setWarningToDelete(null);
    } catch {
      dispatch(notify({ msg: 'Delete Failed', sev: 'error' }));
    }
  };

  const mainContent = (
    <div>
      <div className="search-in-list-cards">
        <InputGroup inside>
          <Input placeholder="Search" value={searchText} onChange={value => setSearchText(value)} />
          <InputGroup.Button>
            <SearchIcon />
          </InputGroup.Button>
        </InputGroup>

        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faPlus} />} onClick={handleAddNew}>
          Add
        </MyButton>
      </div>

      {isLoading ? (
        <div className="loader-card-container">
          <span className="loader">Loading...</span>
        </div>
      ) : (
        <div className="patient-warning-list">
          {warningsList?.map((warning: any) => (
            <div className="main-card-container" key={warning.id}>
              <div className="left-side-card">
                <div className="card-content">
                  <div className="type-card-content">
                    <span className="title-type-card-content">
                      <Translate>Type</Translate>
                    </span>
                    <span className="custom-type-card-content">
                      {lovData?.object?.find((lov: any) => lov.key === warning.warningType)
                        ?.lovDisplayVale || warning.warningType}
                    </span>
                  </div>
                  <div className="status-card-content">
                    {!warning.resolved ? (
                      <Badge content="Active" className="status-active" />
                    ) : (
                      <Badge content="Resolved" className="status-resolved" />
                    )}
                  </div>
                </div>

                <div className="card-content">
                  <div className="description-card-content">
                    <span className="title-type-card-content">
                      <Translate>Description</Translate>
                    </span>
                    <span>{warning.description}</span>
                  </div>
                </div>

                <div className="meta-section">
                  <div className="meta-item">
                    <span className="meta-label">
                      <Translate>ADDITION BY/DATE</Translate>
                    </span>

                    <UserDateCell
                      login={warning.createdBy}
                      date={warning.createdDate}
                    />
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">
                      <Translate>RESOLVED BY/DATE</Translate>
                    </span>

                    <UserDateCell
                      login={warning.resolvedBy}
                      date={warning.resolvedDate}
                    />
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">
                      <Translate>RESOLUTION UNDO BY/DATE</Translate>
                    </span>

                    <UserDateCell
                      login={warning.undoResolvedBy}
                      date={warning.undoResolvedDate}
                    />
                  </div>
                </div>
              </div>

              <div className="right-side-card">
                <button
                  className="action-btn accept-btn"
                  disabled={warning.resolved}
                  onClick={() => handleResolve(warning)}
                >
                  <FontAwesomeIcon icon={faCircleCheck} />
                </button>

                <button
                  className="action-btn undo-btn"
                  disabled={!warning.resolved}
                  onClick={() => handleUndoResolve(warning)}
                >
                  <FontAwesomeIcon icon={faRotateLeft} />
                </button>

                <button
                  className="action-btn delete-btn"
                  onClick={() => {
                    setWarningToDelete(warning);
                    setDeleteModalOpen(true);
                  }}
                >
                  <FontAwesomeIcon icon={faTrashCan} />
                </button>
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
        fieldName="warningType"
        selectData={filteredLovData ?? []}
         selectDataLabel="lovDisplayVale"
 disableByField='isValid'

        selectDataValue="key"
        record={{ warningType }}
        setRecord={(val: any) => setWarningType(val.warningType)}
        width={350}
      />

      <MyInput
        vr={validationResult}
        fieldLabel="Description"
        fieldType="textarea"
        fieldName="description"
        record={{ description }}
        setRecord={(val: any) => setDescription(val.description)}
        width={350}
        height={100}
      />
    </Form>
  );

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <MyButton
        appearance="ghost"
        disabled={!localPatient.id}
        onClick={() => setOpen(true)}
        color={activeCount > 0 ? 'orange' : 'var(--primary-blue)'}
      >
        Administrative Warnings
      </MyButton>

      <ChildModal
        open={open}
        setOpen={setOpen}
        showChild={openChildModal}
        setShowChild={setOpenChildModal}
        title="Administrative Warnings"
        mainContent={mainContent}
        childTitle="Add New"
        childContent={<div dir={dir}>{childContent}</div>}
        childStep={[
          {
            title: 'Administrative Warning',
            icon: <FontAwesomeIcon icon={faTriangleExclamation} />
          }
        ]}
        mainSize="sm"
        childSize="xs"
        hideActionBtn={true}
        actionChildButtonFunction={handleSave}
      />

      <DeletionConfirmationModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        itemToDelete="warning"
        actionType="delete"
        actionButtonFunction={handleDelete}
      />
    </div>
  );
};

export default AdministrativeWarningsModal;
