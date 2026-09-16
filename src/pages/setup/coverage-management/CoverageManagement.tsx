import React, { useEffect, useState } from 'react';
import { Form, Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useEnumOptions } from '@/services/enumsApi';
import { formatEnumString } from '@/utils';
import CoveragePagedSelect, { useLookupPaging } from './CoveragePagedSelect';
import CoverageContractEditor from './CoverageContractEditor';
import CoverageRulePanels from './CoverageRulePanels';
import { emptyContract, notifyError, notifySuccess, approvalCoverageCompanyLabel } from './coverageHelpers';
import {
  useSearchCoverageCompaniesQuery,
  useSearchCoverageContractsQuery,
  useToggleCoverageContractActiveMutation,
  type CoverageContract
} from '@/services/setup/coverageManagement/coverageManagementService';
import './styles.less';

const CoverageManagement = () => {
  const dispatch = useAppDispatch();
  const guarantorTypes = useEnumOptions('GuarantorType');
  const classNames = useEnumOptions('CoverageClassName');
  const [headerOpen, setHeaderOpen] = useState(false);
  const [headerRecord, setHeaderRecord] = useState<CoverageContract>(emptyContract());
  const [selected, setSelected] = useState<CoverageContract>(emptyContract());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleActionType, setToggleActionType] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [paginationParams, setPaginationParams] = useState({ page: 0, size: 15, sort: 'id,desc' });
  const [filter, setFilter] = useState({
    guarantorType: '',
    companyId: undefined as number | undefined,
    className: '',
    search: '',
    isActive: '' as boolean | ''
  });
  const [applied, setApplied] = useState(filter);
  const companyLookup = useLookupPaging(filter.guarantorType);
  const companies = useSearchCoverageCompaniesQuery(
    {
      guarantorType: filter.guarantorType,
      page: companyLookup.page,
      size: 15,
      search: companyLookup.appliedSearch,
      sort: filter.guarantorType === 'INSURANCE' ? 'nameEn,asc' : 'name,asc'
    },
    { skip: !filter.guarantorType }
  );
  const contractsQuery = useSearchCoverageContractsQuery({
    ...paginationParams,
    guarantorType: applied.guarantorType || undefined,
    companyId: applied.companyId,
    className: applied.className || undefined,
    search: applied.search || undefined,
    ...(typeof applied.isActive === 'boolean' ? { isActive: applied.isActive } : {})
  });
  const [toggleActive] = useToggleCoverageContractActiveMutation();

  useEffect(() => {
    dispatch(setPageCode('COVERAGE_MANAGEMENT'));
    dispatch(setDivContent('Coverage Management'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const openHeader = (contract: CoverageContract) => {
    setHeaderRecord(contract);
    setHeaderOpen(true);
  };

  return (
    <Panel>
      <MyTable
        data={contractsQuery.data?.data ?? []}
        totalCount={contractsQuery.data?.totalCount ?? 0}
        loading={contractsQuery.isFetching}
        height={360}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={(_e: any, page: number) => setPaginationParams(prev => ({ ...prev, page }))}
        onRowsPerPageChange={(e: any) =>
          setPaginationParams(prev => ({ ...prev, size: Number(e.target.value), page: 0 }))
        }
        onRowClick={(row: CoverageContract) => setSelected(row)}
        rowClassName={(row: CoverageContract) => (selected.id && selected.id === row.id ? 'selected-row' : '')}
        filters={
          <Form fluid className="form-of-filters-set-up">
            <MyInput
              width="180px"
              fieldLabel="Coverage Type"
              fieldType="select"
              fieldName="guarantorType"
              record={filter}
              setRecord={(next: any) => setFilter({ ...next, companyId: undefined })}
              selectData={guarantorTypes}
              showLabel={false}
              placeholder="Coverage Type"
            />
            <CoveragePagedSelect
              fieldName="companyId"
              fieldLabel="Company"
              record={filter}
              setRecord={setFilter}
              result={companies}
              page={companyLookup.page}
              setPage={companyLookup.setPage}
              search={companyLookup.search}
              setSearch={companyLookup.setSearch}
              resetToken={filter.guarantorType}
              disabled={!filter.guarantorType}
              placeholder="Company"
              showLabel={false}
              width="180px"
            />
            <MyInput
              width="140px"
              fieldType="select"
              fieldName="className"
              record={filter}
              setRecord={setFilter}
              selectData={classNames}
              showLabel={false}
              placeholder="Class"
            />
            <MyInput
              width="140px"
              fieldType="select"
              fieldName="isActive"
              record={filter}
              setRecord={setFilter}
              selectData={[
                { label: 'All', value: '' },
                { label: 'Active', value: true },
                { label: 'Inactive', value: false }
              ]}
              placeholder="Status"
              selectDataLabel="label"
              selectDataValue="value"
              showLabel={false}
            />
            <MyInput
              width="180px"
              fieldName="search"
              record={filter}
              setRecord={setFilter}
              showLabel={false}
              placeholder="Code / Policy"
            />
            <MyButton
              color="var(--deep-blue)"
              width="90px"
              onClick={() => {
                setApplied(filter);
                setPaginationParams(prev => ({ ...prev, page: 0 }));
              }}
            >
              Search
            </MyButton>
          </Form>
        }
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              width="109px"
              onClick={() => openHeader(emptyContract())}
            >
              Add New
            </MyButton>
          </div>
        }
        columns={[
          { key: 'code', title: <Translate>Code</Translate>, flexGrow: 1 },
          { key: 'policyNumber', title: <Translate>Policy Number</Translate>, flexGrow: 2 },
          {
            key: 'guarantorType',
            title: <Translate>Coverage Type</Translate>,
            flexGrow: 2,
            render: (row: CoverageContract) => formatEnumString(row.guarantorType)
          },
          { key: 'companyName', title: <Translate>Company</Translate>, flexGrow: 2 },
          {
            key: 'approvalCoverageCompany',
            title: <Translate>Approval Coverage Co.</Translate>,
            flexGrow: 1.4,
            render: (row: CoverageContract) => approvalCoverageCompanyLabel(row.approvalCoverageCompany)
          },
          { key: 'insurancePayerName', title: <Translate>Insurance Name</Translate>, flexGrow: 2 },
          {
            key: 'className',
            title: <Translate>Class</Translate>,
            flexGrow: 1,
            render: (row: CoverageContract) => formatEnumString(row.className)
          },
          { key: 'priceListName', title: <Translate>Price List</Translate>, flexGrow: 2 },
          { key: 'startDate', title: <Translate>Start date</Translate>, flexGrow: 1 },
          { key: 'endDate', title: <Translate>End Date</Translate>, flexGrow: 1 },
          {
            key: 'isActive',
            title: <Translate>Status</Translate>,
            flexGrow: 1,
            render: (row: CoverageContract) => (row.isActive ? 'Active' : 'Inactive')
          },
          {
            key: 'actions',
            title: '',
            flexGrow: 1.2,
            render: (row: CoverageContract) => (
              <div className="coverage-row-actions">
                <MdModeEdit
                  className="icons-style"
                  size={22}
                  onClick={event => {
                    event.stopPropagation();
                    setSelected(row);
                    openHeader(row);
                  }}
                />
                {row.isActive ? (
                  <MdDelete
                    className="icons-style"
                    title="Deactivate"
                    size={22}
                    fill="var(--primary-pink)"
                    onClick={event => {
                      event.stopPropagation();
                      setSelected(row);
                      setToggleActionType('deactivate');
                      setConfirmOpen(true);
                    }}
                  />
                ) : (
                  <FaUndo
                    className="icons-style"
                    size={18}
                    title="Activate"
                    onClick={event => {
                      event.stopPropagation();
                      setSelected(row);
                      setToggleActionType('reactivate');
                      setConfirmOpen(true);
                    }}
                  />
                )}
              </div>
            )
          }
        ]}
      />

      {selected.id ? (
        <CoverageRulePanels
          key={`${selected.id}-${Boolean(selected.isActive)}`}
          contractId={Number(selected.id)}
          readOnly={!selected.isActive}
        />
      ) : null}

      <CoverageContractEditor
        open={headerOpen}
        setOpen={setHeaderOpen}
        contract={headerRecord}
        onSaved={saved => setSelected(saved)}
      />

      <DeletionConfirmationModal
        open={confirmOpen}
        setOpen={setConfirmOpen}
        itemToDelete="Coverage contract"
        actionType={toggleActionType}
        actionButtonFunction={async () => {
          if (!selected.id) return;
          setConfirmOpen(false);
          try {
            const updated = await toggleActive(selected.id).unwrap();
            setSelected(updated);
            notifySuccess(dispatch, 'Coverage contract status updated');
          } catch (error: any) {
            notifyError(dispatch, error, 'Unable to update status');
          }
        }}
      />
    </Panel>
  );
};

export default CoverageManagement;
