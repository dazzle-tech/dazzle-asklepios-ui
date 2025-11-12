import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import './styles.less';
import { MdDelete, MdMedicalServices } from 'react-icons/md';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import ChildModal from '@/components/ChildModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useEnumOptions } from '@/services/enumsApi';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import {
  useGetProcedureCodingsByProcedureQuery,
  useLazyGetCodeOptionsByTypeQuery,
  useAddProcedureCodingMutation,
  useDeleteProcedureCodingMutation,
} from '@/services/setup/procedure/procedureCodingService';

// ===== Shared Types =====
import type { ProcedureCoding, CodeOption } from '@/types/model-types-new';

// =======================================
// Props & Local Types
// =======================================
type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  procedureId: number | string;
};

type FormState = {
  codeType?: string;
  codeId?: string; // store the actual code here (not the id)
  isActive?: boolean;
};

// Initial (empty) form state
const emptyForm: FormState = {
  codeType: undefined,
  codeId: undefined,
  isActive: true,
};

const LinkProcedureCoding: React.FC<Props> = ({ open, setOpen, procedureId }) => {
  const dispatch = useAppDispatch();
  const [openChildModal, setOpenChildModal] = useState<boolean>(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<ProcedureCoding | null>(null);

  // Form state
  const [formItem, setFormItem] = useState<FormState>({ ...emptyForm });

  // Enum options for MedicalCodeType
  const medicalCodeTypeOptions = useEnumOptions('MedicalCodeType', {
    labelOverrides: {
      CPT_CODES: 'CPT Codes',
      CDT_CODES: 'CDT Codes',
      ICD10_CODES: 'ICD-10 Codes',
      LOINC_CODES: 'LOINC Codes',
    },
  });
  const {
    data: pageCodings,
    isFetching: isLoadingCodings,
    refetch: refetchCodings,
  } = useGetProcedureCodingsByProcedureQuery(
    {
      procedureId: Number(procedureId),
      page: 0,
      size: 200,
      sort: 'id,asc',
    },
    { skip: !open || !procedureId }
  );

  // Lazy query for code catalog (with pagination)
  const [triggerGetCodeOptionsByType, { isFetching: isLoadingCodes }] = useLazyGetCodeOptionsByTypeQuery();

  // Code catalog cache (client-side)
  const [codeOptionsLocal, setCodeOptionsLocal] = useState<CodeOption[]>([]);
  const [codeLinks, setCodeLinks] = useState<{ next?: string | null }>({});
  const hasMoreCodes = !!codeLinks?.next;

  // ---------------------------------------
  // Mutations
  // ---------------------------------------
  const [addProcedureCoding, { isLoading: isAdding }] = useAddProcedureCodingMutation();
  const [deleteProcedureCoding, { isLoading: isDeleting }] = useDeleteProcedureCodingMutation();

  // Build a map from code -> description (for table display)
  const descriptionByCode = useMemo(() => {
    const map = new Map<string, string>();
    (codeOptionsLocal ?? []).forEach((o) => {
      if (o?.code) map.set(String(o.code), o?.description ?? '');
    });
    return map;
  }, [codeOptionsLocal]);

  // Prepare table rows: merge description when available
  const tableData = useMemo(() => {
    const rows = pageCodings?.data ?? [];
    return rows.map((row) => ({
      ...row,
      description: descriptionByCode.get(String(row.codeId)) ?? row.codeId,
    }));
  }, [pageCodings, descriptionByCode]);

  // Table Columns
  const columns: ColumnConfig[] = [
    { key: 'codeType', title: <Translate>Type</Translate> },
    { key: 'codeId', title: <Translate>Code</Translate>, align: 'center' },
    {
      key: 'icons',
      title: <Translate>Action</Translate>,
      width: 100,
      align: 'right',
      render: (row: any) => (
        <div className="container-of-icons">
          <MdDelete
            className="icons-style"
            title="Delete"
            size={22}
            fill="var(--primary-pink)"
            onClick={() => {
              setRowToDelete(row);
              setOpenConfirmDelete(true);
            }}
            style={{ cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.6 : 1 }}
          />
        </div>
      ),
    },
  ];

  // Open child modal to create a new link
  const openCreate = () => {
    setFormItem({ ...emptyForm, isActive: true });
    setOpenChildModal(true);
  };

  // Reset the child form to its initial state
  const resetChildForm = () => setFormItem({ ...emptyForm });

  // Save (link code to procedure)
  const handleSave = async () => {
    // Close the child modal before saving (we reopen it if something fails)
    setOpenChildModal(false);

    // Basic validation
    if (!procedureId) {
      dispatch(notify({ msg: 'Please choose a procedure before saving.', sev: 'error' }));
      setOpenChildModal(true);
      return;
    }
    if (!formItem.codeType || !formItem.codeId) {
      dispatch(notify({ msg: 'Please select code type and code first.', sev: 'warning' }));
      setOpenChildModal(true);
      return;
    }

    const createPayload = {
      procedureId: Number(procedureId),
      codeType: String(formItem.codeType),
      codeId: String(formItem.codeId),
      isActive: formItem.isActive ?? true,
    };

    try {
      await addProcedureCoding(createPayload).unwrap();
      dispatch(notify({ msg: 'Code linked successfully', sev: 'success' }));
      resetChildForm();
      await refetchCodings();
    } catch (err: any) {
      const data = err?.data ?? {};
      const traceId = data?.traceId || data?.requestId || data?.correlationId;
      const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

      // (1) Bean Validation errors (if present on VM)
      const isValidation =
        data?.message === 'error.validation' ||
        data?.title === 'Method argument not valid' ||
        (typeof data?.type === 'string' && data.type.includes('constraint-violation'));

      if (isValidation && Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
        const fieldLabels: Record<string, string> = {
          codeType: 'Code Type',
          codeId: 'Code',
          isActive: 'Active Status',
          procedureId: 'Procedure',
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
        setOpenChildModal(true);
        return;
      }

      // (2) Extract errorKey from BadRequestAlertException / NotFoundAlertException
      let errorKey: string | undefined;

      if (data?.errorKey) {
        errorKey = data.errorKey;
      } else {
        const messageProp: string = data?.message || '';
        const entityName: string = data?.entityName || 'procedureCoding'; // backend may also return 'procedure'

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
              // e.g. "procedureid.required"
              errorKey = parts.slice(-2).join('.');
            }
          }
        }
      }

      // (3) Map known keys to friendly messages
      const keyMap: Record<string, string> = {
        // BadRequestAlertException (service)
        'procedureid.required': 'Procedure id is required.',
        'payload.required': 'ProcedureCoding payload is required.',
        'codetype.required': 'Code type is required.',
        'codeid.required': 'Code is required.',
        'unique.procedurecoding': 'This (type, code) is already linked to the selected procedure.',
        'db.constraint': 'Database constraint violated. Please check unique fields or required values.',
        // NotFoundAlertException
        'notfound': 'Procedure not found.',
      };

      // (4) Build final message for UI
      let humanMsg: string;
      if (errorKey && keyMap[errorKey]) {
        humanMsg = keyMap[errorKey];
      } else if (data?.detail) {
        humanMsg = data.detail;
      } else if (data?.title) {
        humanMsg = data.title;
      } else {
        humanMsg = 'Failed to link code. Please try again.';
      }

      dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
      setOpenChildModal(true); // reopen the form after error
    }
  };

  // Delete (unlink) a code from the procedure
  const handleDelete = async () => {
    if (!rowToDelete?.id) return;
    try {
      await deleteProcedureCoding({ id: Number(rowToDelete.id) }).unwrap();
      dispatch(notify({ msg: 'Code deleted successfully', sev: 'success' }));
      await refetchCodings();
    } catch {
      dispatch(notify({ msg: 'Failed to delete code', sev: 'error' }));
    } finally {
      setOpenConfirmDelete(false);
      setRowToDelete(null);
    }
  };

  // Effects 
  // Load first page of codes when child modal opens + codeType changes
  useEffect(() => {
    let ignore = false;

    const fetchFirstPage = async () => {
      if (openChildModal && formItem.codeType) {
        setCodeOptionsLocal([]);
        setCodeLinks({});
        try {
          const res = await triggerGetCodeOptionsByType(
            { type: String(formItem.codeType), page: 0, size: 50, sort: 'code,asc' },
            false
          ).unwrap();

          if (!ignore) {
            const list = Array.isArray(res?.data) ? (res.data as CodeOption[]) : [];
            setCodeOptionsLocal(list);
            setCodeLinks(res?.links ?? {});
          }
        } catch {
          if (!ignore) {
            setCodeOptionsLocal([]);
            setCodeLinks({});
          }
        }
      } else {
        setCodeOptionsLocal([]);
        setCodeLinks({});
      }
    };

    fetchFirstPage();
    return () => {
      ignore = true;
    };
  }, [openChildModal, formItem.codeType, triggerGetCodeOptionsByType]);

  // Reset codeId when codeType changes (to prevent stale selection)
  useEffect(() => {
    setFormItem((prev) => ({ ...prev, codeId: undefined }));
  }, [formItem.codeType]);

  // Fetch next page of codes from server
  const handleFetchMoreCodes = async () => {
    if (!codeLinks?.next || !formItem.codeType) return;

    const { page, size } = extractPaginationFromLink(codeLinks.next) || {
      page: undefined,
      size: undefined,
      sort: 'code,asc',
    };

    try {
      const res = await triggerGetCodeOptionsByType(
        {
          type: String(formItem.codeType),
          page: page ?? 0,
          size: size ?? 50,
        },
        false
      ).unwrap();

      const newList = Array.isArray(res?.data) ? (res.data as CodeOption[]) : [];
      setCodeOptionsLocal((prev) => [...prev, ...newList]);
      setCodeLinks(res?.links ?? {});
    } catch {
      // noop: keep previous codes; you may notify if needed
    }
  };


  // Main content (list of linked codes + add button)
  const conjureFormMainContent = () => (
    <div>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={openCreate}
          width="160px"
          disabled={!procedureId}
        >
          <Translate>Link Code</Translate>
        </MyButton>
      </div>

      <MyTable height={450} loading={isLoadingCodings} data={tableData} columns={columns} />
    </div>
  );

  // Child content (form to link a new code)
  const conjureFormChildContent = () => (
    <Form fluid>
      <div style={{ display: 'grid', gap: 12 }}>
        <MyInput
          required
          width="100%"
          fieldName="codeType"
          selectDataValue="value"
          selectDataLabel="label"
          fieldLabel="Select Code Type"
          fieldType="select"
          selectData={medicalCodeTypeOptions ?? []}
          record={formItem}
          setRecord={(r: any) => {
            setFormItem({ ...r, codeId: undefined });
          }}
          placeholder="Choose type"
        />

        <MyInput
          required
          key={String(formItem.codeType) || 'no-type'}
          width="100%"
          fieldName="codeId"
          fieldLabel="Select Code"
          fieldType="selectPagination"
          selectDataValue="value"
          selectDataLabel="label"
          selectData={(codeOptionsLocal ?? []).map((o) => ({
            label: `${o.code} - ${o.description ?? ''}`,
            value: o.code, 
          }))}
          hasMore={hasMoreCodes}
          onFetchMore={handleFetchMoreCodes}
          loading={isLoadingCodes}
          record={formItem}
          setRecord={setFormItem}
          placeholder={
            !formItem.codeType
              ? 'Choose code type first'
              : isLoadingCodes && (codeOptionsLocal?.length ?? 0) === 0
              ? 'Loading...'
              : (codeOptionsLocal?.length ?? 0) === 0
              ? 'No codes found'
              : 'Choose code'
          }
          disabled={!formItem.codeType || (isLoadingCodes && (codeOptionsLocal?.length ?? 0) === 0)}
        />
      </div>
    </Form>
  );
  return (
    <>
      <ChildModal
        open={open}
        setOpen={setOpen}
        showChild={openChildModal}
        setShowChild={setOpenChildModal}
        title="Linked Codes"
        mainContent={conjureFormMainContent}
        actionChildButtonFunction={handleSave}
        hideActionBtn
        childTitle="Link New Code to Procedure"
        childContent={conjureFormChildContent}
        mainSize="sm"
        actionButtonLabel="Link"
        mainStep={[{ title: 'Linked Codes', icon: <MdMedicalServices /> }]}
        childStep={[{ title: 'Code', icon: <MdMedicalServices /> }]}
      />

      <DeletionConfirmationModal
        open={openConfirmDelete}
        setOpen={setOpenConfirmDelete}
        itemToDelete="Procedure Code"
        actionButtonFunction={handleDelete}
        actionType="delete"
      />
    </>
  );
};

export default LinkProcedureCoding;
