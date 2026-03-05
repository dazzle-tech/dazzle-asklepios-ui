import PlusIcon from '@rsuite/icons/Plus';
import React, { useState, useRef, useEffect } from 'react';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import AddSocialHistory from './AddSocialHistory';
import {
  useDeleteSocialHistoryMutation,
  useGetSocialHistoryQuery
} from '@/services/patients/socialHistoryService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatDateWithoutSeconds } from '@/utils';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import '../styles.less';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

const SocialHistory = ({ patient, edit, toShowData = false }) => {
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [previewRow, setPreviewRow] = useState<any>(null);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<any>(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);

  const { data: routeLov } = useGetLovValuesByCodeQuery('MED_ROA');
  const { data: freqLov } = useGetLovValuesByCodeQuery('FREQUENT_USE');
  const { data: physicalLov } = useGetLovValuesByCodeQuery('PHYSICAL_LIMITATION');
  const { data: diagnoseLov } = useGetLovValuesByCodeQuery('EATING_DISORDERS');

  const previewRef = useRef<HTMLDivElement>(null);

  const patientId = Number(patient?.id);
  const isValidPatientId = Number.isFinite(patientId) && patientId > 0;

  const { data, isFetching } = useGetSocialHistoryQuery(
    { patientId, page, size, sort: 'id,desc' },
    { skip: !isValidPatientId }
  );

  const [deleteSocialHistory] = useDeleteSocialHistoryMutation();

  useEffect(() => {
    if (previewRow && previewRef.current) {
      previewRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [previewRow]);

  const handleRowClick = (row: any) => {
    setPreviewRow(prev => (prev?.id === row.id ? null : row));
  };

  const handleEdit = (row: any) => {
    const formData = {
      id: row.id,
      patientId: row.patientId,

      isCurrentSmoker: row.isCurrentSmoker || false,
      smokeStartDate: row.smokeStartDate || null,
      cigaretteAmount: row.cigaretteAmount || null,
      cigaretteType: row.cigaretteType || '',

      isPreviousSmoker: row.isPreviousSmoker || false,
      smokeQuitDate: row.smokeQuitDate || null,

      exposureToSecondHandSmoke: row.exposureToSecondHandSmoke || false,

      alcoholConsumption: row.alcoholConsumption || false,
      typeOfAlcohol: row.typeOfAlcohol || '',
      alcoholSinceWhen: row.alcoholSinceWhen || null,

      substanceUse: row.substanceUse || false,
      route: row.route || null,
      frequency: row.frequency || null,

      physicalLimitation: row.physicalLimitation || null,
      diagnosedEatingDisorders: row.diagnosedEatingDisorders || null
    };

    setEditData(formData);
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!rowToDelete?.id) return;

    try {
      await deleteSocialHistory({ id: rowToDelete.id }).unwrap();
      dispatch(notify({ msg: 'Deleted successfully', sev: 'success' }));

      if (previewRow?.id === rowToDelete.id) {
        setPreviewRow(null);
      }

      setOpenDeleteModal(false);
      setRowToDelete(null);
    } catch {
      dispatch(notify({ msg: 'Delete failed', sev: 'error' }));
    }
  };

  const columns = [
    {
      key: 'isCurrentSmoker',
      title: 'CURRENT SMOKER',
      render: r => (r.isCurrentSmoker ? 'Yes' : 'No')
    },
    {
      key: 'smokeStartDate',
      title: 'START DATE',
      render: r => (r.smokeStartDate ? new Date(r.smokeStartDate).toLocaleDateString() : '')
    },
    { key: 'cigaretteAmount', title: 'AMOUNT' },
    { key: 'cigaretteType', title: 'CIGARETTE TYPE' },
    {
      key: 'isPreviousSmoker',
      title: 'PREVIOUS SMOKER',
      render: r => (r.isPreviousSmoker ? 'Yes' : 'No')
    },
    {
      key: 'smokeQuitDate',
      title: 'QUIT DATE',
      render: r => (r.smokeQuitDate ? new Date(r.smokeQuitDate).toLocaleDateString() : '')
    },
    {
      key: 'alcoholConsumption',
      title: 'ALCOHOL',
      render: r => (r.alcoholConsumption ? 'Yes' : 'No')
    },
    {
      key: 'ExposureToSecondHandSmoke',
      title: 'SECOND HAND SMOKE',
      expandable: true,
      render: r => (r.exposureToSecondHandSmoke ? 'Yes' : 'No')
    },
    {
      key: 'createdDate',
      title: 'CREATED AT / BY',
      expandable: true,
      render: (row: any) =>
        row?.createdDate ? (
          <>
            {row?.createdBy} <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.createdDate)}</span>
          </>
        ) : (
          ''
        )
    },
    {
      key: 'lastModifiedDate',
      title: 'UPDATED AT / BY',
      expandable: true,
      render: (row: any) =>
        row?.lastModifiedDate ? (
          <>
            {row?.lastModifiedBy} <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(row.lastModifiedDate)}
            </span>
          </>
        ) : (
          ''
        )
    },
    ...(!toShowData
      ? [
          {
            key: 'actions',
            title: '',
            flexGrow: 1,
            render: row => (
              <div className="flex-gap-12" onClick={e => e.stopPropagation()}>
                <MdModeEdit
                  size={22}
                  fill="var(--primary-gray)"
                  className="pointer"
                  onClick={e => {
                    e.stopPropagation();
                    handleEdit(row);
                  }}
                />
                <MdDelete
                  size={22}
                  fill="var(--primary-pink)"
                  className="pointer"
                  onClick={e => {
                    e.stopPropagation();
                    setRowToDelete(row);
                    setOpenDeleteModal(true);
                  }}
                />
              </div>
            )
          }
        ]
      : [])
  ];

  return (
    <div className="medical-container-div">
      <SectionContainer
        title="Social History"
        action={
          !toShowData && (
            <MyButton
              disabled={edit}
              prefixIcon={() => <PlusIcon />}
              onClick={() => {
                setEditData(null);
                setOpen(true);
              }}
            >
              Add
            </MyButton>
          )
        }
        content={
          <>
            <MyTable
              height={450}
              data={data?.data ?? []}
              loading={isFetching}
              columns={columns}
              page={page}
              rowsPerPage={size}
              totalCount={data?.totalCount ?? 0}
              onRowClick={handleRowClick}
              rowClassName={row => (row?.id === previewRow?.id ? 'selected-row' : '')}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={e => {
                setSize(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />

            {previewRow && (
              <div ref={previewRef} className="margin-top-20">
                <SectionContainer
                  title="Social History Details"
                  content={
                    <Form fluid>
                      <div className="preview-grid">
                        <div className="full-row">
                          <MyInput
                            width={180}
                            column
                            fieldType="checkbox"
                            fieldLabel="Current Smoker"
                            fieldName="isCurrentSmoker"
                            record={previewRow}
                            disabled
                          />
                        </div>

                        {previewRow.isCurrentSmoker && (
                          <>
                            <MyInput
                              width={180}
                              column
                              fieldType="text"
                              fieldLabel="Start date"
                              fieldName="smokeStartDate"
                              record={{
                                smokeStartDate: previewRow.smokeStartDate
                                  ? new Date(previewRow.smokeStartDate).toLocaleDateString()
                                  : '-'
                              }}
                              disabled
                            />

                            <MyInput
                              width={110}
                              column
                              fieldType="text"
                              fieldLabel="Amount"
                              fieldName="cigaretteAmount"
                              record={{
                                cigaretteAmount:
                                  previewRow.cigaretteAmount !== null &&
                                  previewRow.cigaretteAmount !== undefined
                                    ? previewRow.cigaretteAmount
                                    : '-'
                              }}
                              disabled
                              rightAddon="pack/day"
                              rightAddonwidth={80}
                            />

                            <MyInput
                              width={180}
                              column
                              fieldType="text"
                              fieldLabel="Cigarette Type"
                              fieldName="cigaretteType"
                              record={{ cigaretteType: previewRow.cigaretteType || '-' }}
                              disabled
                            />
                          </>
                        )}

                        <div className="full-row">
                          <MyInput
                            width={180}
                            column
                            fieldType="checkbox"
                            fieldLabel="Previous Smoker"
                            fieldName="isPreviousSmoker"
                            record={previewRow}
                            disabled
                          />
                        </div>

                        {previewRow.isPreviousSmoker && (
                          <div className="full-row">
                            <MyInput
                              width={180}
                              column
                              fieldType="text"
                              fieldLabel="Quit date"
                              fieldName="smokeQuitDate"
                              record={{
                                smokeQuitDate: previewRow.smokeQuitDate
                                  ? new Date(previewRow.smokeQuitDate).toLocaleDateString()
                                  : '-'
                              }}
                              disabled
                            />
                          </div>
                        )}

                        <MyInput
                          width={180}
                          column
                          fieldType="checkbox"
                          fieldLabel="Exposure to second-hand smoke"
                          fieldName="exposureToSecondHandSmoke"
                          record={previewRow}
                          disabled
                        />

                        <div className="full-row">
                          <MyInput
                            width={180}
                            column
                            fieldType="checkbox"
                            fieldLabel="Alcohol Consumption"
                            fieldName="alcoholConsumption"
                            record={previewRow}
                            disabled
                          />
                        </div>

                        {previewRow.alcoholConsumption && (
                          <>
                            <MyInput
                              width={180}
                              column
                              fieldType="text"
                              fieldLabel="Since when"
                              fieldName="alcoholSinceWhen"
                              record={{
                                alcoholSinceWhen: previewRow.alcoholSinceWhen
                                  ? new Date(previewRow.alcoholSinceWhen).toLocaleDateString()
                                  : '-'
                              }}
                              disabled
                            />

                            <MyInput
                              width={180}
                              column
                              fieldType="text"
                              fieldLabel="Type of alcohol"
                              fieldName="typeOfAlcohol"
                              record={{ typeOfAlcohol: previewRow.typeOfAlcohol || '-' }}
                              disabled
                            />
                          </>
                        )}

                        <div className="full-row">
                          <MyInput
                            width={180}
                            column
                            fieldType="checkbox"
                            fieldLabel="Substance Use"
                            fieldName="substanceUse"
                            record={previewRow}
                            disabled
                          />
                        </div>

                        {previewRow.substanceUse && (
                          <>
                            <MyInput
                              width={180}
                              column
                              fieldLabel="Route"
                              fieldName="route"
                              fieldType="select"
                              selectData={routeLov?.object ?? []}
                              selectDataLabel="lovDisplayVale"
                              selectDataValue="key"
                              record={previewRow}
                              disabled
                            />

                            <MyInput
                              width={180}
                              column
                              fieldLabel="Frequency"
                              fieldName="frequency"
                              fieldType="select"
                              selectData={freqLov?.object ?? []}
                              selectDataLabel="lovDisplayVale"
                              selectDataValue="key"
                              record={previewRow}
                              disabled
                            />
                          </>
                        )}

                        <MyInput
                          width={180}
                          column
                          fieldLabel="Physical limitations"
                          fieldName="physicalLimitation"
                          fieldType="select"
                          selectData={physicalLov?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          record={previewRow}
                          disabled
                        />

                        <MyInput
                          width={180}
                          column
                          fieldLabel="Diagnosed eating disorders"
                          fieldName="diagnosedEatingDisorders"
                          fieldType="select"
                          selectData={diagnoseLov?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          record={previewRow}
                          disabled
                        />

                        <MyInput
                          width={220}
                          column
                          fieldType="text"
                          fieldLabel="Created By / At"
                          fieldName="createdBy"
                          record={{
                            createdBy: previewRow.createdDate
                              ? `${previewRow.createdBy} - ${formatDateWithoutSeconds(
                                  previewRow.createdDate
                                )}`
                              : previewRow.createdBy || '-'
                          }}
                          disabled
                        />

                        {previewRow.lastModifiedDate && (
                          <MyInput
                            width={220}
                            column
                            fieldType="text"
                            fieldLabel="Last Modified By / At"
                            fieldName="lastModifiedBy"
                            record={{
                              lastModifiedBy: `${
                                previewRow.lastModifiedBy
                              } - ${formatDateWithoutSeconds(previewRow.lastModifiedDate)}`
                            }}
                            disabled
                          />
                        )}
                      </div>
                    </Form>
                  }
                />
              </div>
            )}

            <AddSocialHistory
              open={open}
              setOpen={() => {
                setOpen(false);
                setEditData(null);
              }}
              initialData={editData}
              patient={patient}
            />

            <DeletionConfirmationModal
              open={openDeleteModal}
              setOpen={setOpenDeleteModal}
              itemToDelete="Social History"
              actionType="delete"
              actionButtonFunction={handleDelete}
            />
          </>
        }
      />
    </div>
  );
};

export default SocialHistory;
