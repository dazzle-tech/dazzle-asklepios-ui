import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { MdToggleOff } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyModal from '@/components/MyModal/MyModal';
import { formatEnumString } from '@/utils';
import { useAppDispatch } from '@/hooks';
import BillingCategoryItemFields from './BillingCategoryItemFields';
import { notifyError, notifySuccess, notifyWarning } from './coverageHelpers';
import { useRuleModalTitle } from './RuleModalTitleContext';
import {
  useListTermExclusionsQuery,
  useSaveTermExclusionMutation,
  useToggleTermExclusionActiveMutation
} from '@/services/setup/coverageManagement/coverageManagementService';

const emptyExclusion = { billingItemType: null, subcategoryKey: null, itemId: null, itemName: null };

/**
 * Items a Coverage Limit rule does not apply to. Each row excludes a whole
 * category, a subcategory, or one item from the limit.
 */
const CoverageLimitExclusionModal = ({
  open,
  setOpen,
  term,
  readOnly
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  term: any;
  readOnly?: boolean;
}) => {
  const dispatch = useAppDispatch();
  const modalTitle = useRuleModalTitle();
  const [record, setRecord] = useState<any>(emptyExclusion);
  const [paging, setPaging] = useState({ page: 0, size: 10 });
  const termId = Number(term?.id);
  const { data, isFetching } = useListTermExclusionsQuery(
    { termId, ...paging },
    { skip: !open || !term?.id }
  );
  const [saveExclusion, { isLoading: saving }] = useSaveTermExclusionMutation();
  const [toggleActive] = useToggleTermExclusionActiveMutation();

  useEffect(() => {
    if (open) {
      setRecord(emptyExclusion);
      setPaging(prev => ({ ...prev, page: 0 }));
    }
  }, [open, term?.id]);

  const persist = async () => {
    if (!record.billingItemType) {
      notifyWarning(dispatch, 'Category is required');
      return;
    }
    const itemId = record.itemId == null || record.itemId === '' ? null : Number(record.itemId);
    const hasItem = Number.isFinite(itemId as number);
    try {
      await saveExclusion({
        termId,
        body: {
          billingItemType: record.billingItemType,
          subcategoryKey: record.subcategoryKey || null,
          serviceId: hasItem ? itemId : null,
          serviceName: hasItem ? record.itemName || null : null,
          isActive: true
        }
      }).unwrap();
      notifySuccess(dispatch, 'Coverage limit exclusion added');
      setRecord(emptyExclusion);
    } catch (error: any) {
      notifyError(dispatch, error, 'Unable to add coverage limit exclusion');
    }
  };

  const changeStatus = async (row: any) => {
    try {
      await toggleActive(row.id).unwrap();
      notifySuccess(dispatch, row.isActive ? 'Exclusion deactivated' : 'Exclusion activated');
    } catch (error: any) {
      notifyError(dispatch, error, 'Unable to update exclusion status');
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={modalTitle('Coverage Limit Exclusions')}
      size="64vw"
      bodyheight="72vh"
      hideActionBtn={readOnly}
      actionButtonLabel="Add"
      actionButtonLoading={saving}
      actionButtonFunction={persist}
      content={
        <>
          {!readOnly && (
            <Form fluid className="coverage-form-grid">
              <BillingCategoryItemFields
                open={open}
                record={record}
                setRecord={setRecord}
                includeAll={false}
                showSubcategory
              />
            </Form>
          )}
          <div className="coverage-nested-block">
            <div className="coverage-nested-title">
              <Translate>Excluded from this limit</Translate>
            </div>
            <MyTable
              data={data?.data ?? []}
              totalCount={data?.totalCount ?? 0}
              loading={isFetching}
              height={260}
              page={paging.page}
              rowsPerPage={paging.size}
              onPageChange={(_e: any, page: number) => setPaging(prev => ({ ...prev, page }))}
              onRowsPerPageChange={(e: any) => setPaging({ size: Number(e.target.value), page: 0 })}
              columns={[
                {
                  key: 'billingItemType',
                  title: 'Category',
                  flexGrow: 2,
                  render: (row: any) => formatEnumString(row.billingItemType) || '-'
                },
                {
                  key: 'subcategoryLabel',
                  title: 'Subcategory',
                  flexGrow: 2,
                  render: (row: any) => row.subcategoryLabel || row.subcategoryKey || '-'
                },
                {
                  key: 'serviceName',
                  title: 'Item',
                  flexGrow: 2,
                  render: (row: any) =>
                    row.serviceName || (row.subcategoryKey ? 'All in subcategory' : 'All in category')
                },
                {
                  key: 'isActive',
                  title: 'Status',
                  flexGrow: 1,
                  render: (row: any) => (row.isActive ? 'Active' : 'Inactive')
                },
                {
                  key: 'actions',
                  title: '',
                  flexGrow: 1,
                  render: (row: any) =>
                    readOnly ? null : (
                      <div className="coverage-row-actions">
                        {row.isActive ? (
                          <MdToggleOff
                            className="icons-style"
                            size={24}
                            title="Deactivate"
                            onClick={() => changeStatus(row)}
                          />
                        ) : (
                          <FaUndo
                            className="icons-style"
                            size={18}
                            title="Activate"
                            onClick={() => changeStatus(row)}
                          />
                        )}
                      </div>
                    )
                }
              ]}
            />
          </div>
        </>
      }
    />
  );
};

export default CoverageLimitExclusionModal;
