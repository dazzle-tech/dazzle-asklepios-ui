import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form, Divider } from 'rsuite';
import './styles.less';
import { FaStar } from 'react-icons/fa';

// Facility list (like Department modal)
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { initialListRequest, ListRequest } from '@/types/types';

// Enum options for category
import { useEnumOptions } from '@/services/enumsApi';

// ICD-10 search component (supports mode="icd10" | "indications")
import Icd10Search from '@/components/ICD10SearchComponent/IcdSearchable';

// RTK Query hooks for Procedures
import {
  useAddProcedureMutation,
  useUpdateProcedureMutation,
} from '@/services/setup/procedure/procedureService';

// Redux hooks
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

type AddEditProcedureProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  width: number;
  procedure: any;
  setProcedure: (next: any) => void;
  onSaveSuccess?: () => void;
  actionLoading?: boolean;
};

const AddEditProcedure: React.FC<AddEditProcedureProps> = ({
  open,
  setOpen,
  width,
  procedure,
  setProcedure,
  onSaveSuccess,
  actionLoading,
}) => {
  const dispatch = useAppDispatch();

  // Facility context from tenant
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;
  const facilityId: number | undefined = selectedFacility?.id;

  // Mutations
  const [addProcedure, { isLoading: isAdding }] = useAddProcedureMutation();
  const [updateProcedure, { isLoading: isUpdating }] = useUpdateProcedureMutation();

  // Facilities for select
  const facilityListRequest: ListRequest = { ...initialListRequest };
  const { data: facilityListResponse } = useGetAllFacilitiesQuery(facilityListRequest);

  // Category options
  const categoryOptions = useEnumOptions('ProcedureCategoryType');

  const isLoading = isAdding || isUpdating || actionLoading;

  const handleSave = async () => {
    setOpen(false);
    const isUpdate = !!procedure.id;

    const payload: any = {
      ...procedure,
    };

    try {
      if (!facilityId) {
        dispatch(notify({ msg: 'Please choose a facility before saving.', sev: 'error' }));
        setOpen(true);
        return;
      }

      if (isUpdate) {
        await updateProcedure({ facilityId, id: procedure.id!, ...payload }).unwrap();
        dispatch(notify({ msg: 'Procedure updated successfully', sev: 'success' }));
      } else {
        await addProcedure({ facilityId, ...payload }).unwrap();
        dispatch(notify({ msg: 'Procedure added successfully', sev: 'success' }));
      }

      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (err: any) {
      const data = err?.data ?? {};
      const traceId = data?.traceId || data?.requestId || data?.correlationId;
      const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

      const isValidation =
        data?.message === 'error.validation' ||
        data?.title === 'Method argument not valid' ||
        (typeof data?.type === 'string' && data.type.includes('constraint-violation'));

      if (isValidation && Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
        const fieldLabels: Record<string, string> = {
          name: 'Name',
          code: 'Code',
          categoryType: 'Category',
          isAppointable: 'Appointable',
          isActive: 'Active Status',
          facilityId: 'Facility',
          indications: 'Indications',
          contraindications: 'Contraindications',
          preparationInstructions: 'Preparation Instructions',
          recoveryNotes: 'Recovery Notes',
        };

        const normalizeMsg = (msg: string) => {
          const m = (msg || '').toLowerCase();
          if (m.includes('must not be null')) return 'is required';
          if (m.includes('must not be blank') || m.includes('must not be empty')) return 'must not be blank';
          if (m.includes('size must be between')) return 'length is out of range';
          if (m.includes('must be greater than')) return 'value is too small';
          if (m.includes('must be less than')) return 'value is too large';
          return msg || 'invalid value';
        };

        const lines = data.fieldErrors.map((fe: any) => {
          const label = fieldLabels[fe.field] ?? fe.field;
          return `• ${label}: ${normalizeMsg(fe.message)}`;
        });

        const humanMsg = `Please fix the following fields:\n${lines.join('\n')}`;
        dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
        setOpen(true);
        return;
      }

      let errorKey: string | undefined;

      if (data?.errorKey) {
        errorKey = data.errorKey;
      } else {
        const messageProp: string = data?.message || '';
        const entityName: string = data?.entityName || 'procedure';

        if (messageProp) {
          if (messageProp.startsWith(entityName + '.')) {
            errorKey = messageProp.substring(entityName.length + 1);
          } else if (messageProp.startsWith('error.')) {
            errorKey = messageProp.substring(6);
          } else if (messageProp.includes('.')) {
            const parts = messageProp.split('.');
            if (parts[0] === 'error' && parts.length > 1) {
              errorKey = parts.slice(1).join('.');
            } else {
              errorKey = parts.slice(-2).join('.');
            }
          }
        }
      }

      const keyMap: Record<string, string> = {
        'facility.required': 'Facility id is required.',
        'payload.required': 'Procedure payload is required.',
        'unique.facility.name_code_category':
          'A procedure with the same name, code, and category already exists in this facility.',
        'db.constraint': 'Database constraint violated. Please check unique fields or required values.',
        'facility.mismatch': 'Procedure does not belong to the given facility.',
        notfound: 'Procedure not found.',
        facilityrequired: 'Facility id is required.',
        'unique.facility.name': 'Procedure name already exists in this facility.',
        'fk.facility.notfound': 'Facility not found.',
      };

      let humanMsg: string;
      if (errorKey && keyMap[errorKey]) {
        humanMsg = keyMap[errorKey];
      } else if (data?.detail) {
        humanMsg = data.detail;
      } else {
        humanMsg = isUpdate
          ? 'Failed to update procedure. Please try again.'
          : 'Failed to create procedure. Please try again.';
      }

      dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
      setOpen(true);
    }
  };

  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
      default:
        return (
          <Form fluid>
            {/* Facility + Category */}
            <div className="container-of-two-fields-service">
              <div className="container-of-field-service">
                <MyInput
                  required
                  width="100%"
                  fieldLabel="Facility"
                  fieldType="select"
                  fieldName="facilityId"
                  selectData={facilityListResponse ?? []}
                  selectDataLabel="name"
                  selectDataValue="id"
                  record={procedure}
                  setRecord={setProcedure}
                />
              </div>
              <div className="container-of-field-service">
                <MyInput
                  required
                  width="100%"
                  fieldLabel="Category"
                  fieldType="select"
                  fieldName="categoryType"
                  selectData={categoryOptions ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={procedure}
                  setRecord={setProcedure}
                />
              </div>
            </div>

            <br />

            {/* Name + Code */}
            <div className="container-of-two-fields-service">
              <div className="container-of-field-service">
                <MyInput
                  required
                  width="100%"
                  fieldLabel="Procedure Name"
                  fieldName="name"
                  record={procedure}
                  setRecord={setProcedure}
                />
              </div>
              <div className="container-of-field-service">
                <MyInput
                  required
                  width="100%"
                  fieldLabel="Procedure Code"
                  fieldName="code"
                  record={procedure}
                  setRecord={setProcedure}
                />
              </div>
            </div>

            <br />

            {/* Appointable flag */}
            <Form className="container-of-appointable">
              <MyInput
                fieldLabel="Appointable"
                fieldType="checkbox"
                fieldName="isAppointable"
                record={procedure}
                setRecord={setProcedure}
              />
            </Form>

            <br />
            <Divider />

            {/* Indications (ICD-10 codes) */}
            <Icd10Search
              object={procedure}
              setOpject={setProcedure}
              fieldName="indications"
              label="Indications (ICD-10)"
              mode="multiICD10"
            />

            <br />

            {/* Contraindications (ICD-10 codes) */}
            <Icd10Search
              object={procedure}
              setOpject={setProcedure}
              fieldName="contraindications"
              label="Contraindications (ICD-10)"
              mode="multiICD10"
            />

            <br />
            <Divider />

            {/* Optional notes */}
            <div className="container-of-two-fields-service">
              <div className="container-of-field-service">
                <MyInput
                  width="100%"
                  fieldLabel="Preparation Instructions"
                  fieldType="textarea"
                  fieldName="preparationInstructions"
                  record={procedure}
                  setRecord={setProcedure}
                />
              </div>
              <div className="container-of-field-service">
                <MyInput
                  width="100%"
                  fieldLabel="Recovery Notes"
                  fieldType="textarea"
                  fieldName="recoveryNotes"
                  record={procedure}
                  setRecord={setProcedure}
                />
              </div>
            </div>
          </Form>
        );
    }
  };

  const isEdit = !!procedure?.id;

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={isEdit ? 'Edit Procedure' : 'New Procedure'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={isEdit ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      isDisabledActionBtn={isLoading}
      steps={[{ title: 'Procedure Info', icon: <FaStar /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};

export default AddEditProcedure;
