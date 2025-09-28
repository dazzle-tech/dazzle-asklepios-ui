import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Checkbox } from 'rsuite';
import MyTable from '@/components/MyTable';
import {
  useSaveElectrocardiogramECGMutation,
  useGetElectrocardiogramECGsQuery
} from '@/services/encounterService';
import Translate from '@/components/Translate';
import { MdModeEdit } from 'react-icons/md';
import PlusIcon from '@rsuite/icons/Plus';
import { newApElectrocardiogramEcg } from '@/types/model-types-constructor';
import { ApElectrocardiogramEcg } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import AddElectrocardiogram from './AddElectrocardiogram';
import { formatDateWithoutSeconds } from '@/utils';
import epg from '@/images/epg.png'; // استيراد الصورة

const ElectrocardiogramECG = ({ patient, encounter, edit }) => {
  const authSlice = useAppSelector(state => state.auth);
  const [open, setOpen] = useState(false);
  const [electrocardiogramEcg, setElectrocardiogramEcg] = useState<ApElectrocardiogramEcg>({
    ...newApElectrocardiogramEcg,
    stSegmentChangesLkey: null,
    waveAbnormalitiesLkey: null,
    heartRate: null,
    prInterval: null,
    qrsDuration: null,
    qtInterval: null
  });
  const [saveElectrocardiogramECG] = useSaveElectrocardiogramECGMutation();
  const [popupCancelOpen, setPopupCancelOpen] = useState(false);
  const [electrocardiogramEcgStatus, setElectrocardiogramEcgStatus] = useState('');
  const [allData, setAllData] = useState(false);
  const dispatch = useAppDispatch();

  // State جديد لتخزين الصور المختارة
  const [selectedImages, setSelectedImages] = useState<
    { imageUrl: string; createdAt: string; createdBy: string }[]
  >([]);

  const [electrocardiogramEcgListRequest, setElectrocardiogramEcgListRequest] =
    useState<ListRequest>({
      ...initialListRequest,
      filters: [
        { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
        { fieldName: 'patient_key', operator: 'match', value: patient?.key },
        { fieldName: 'encounter_key', operator: 'match', value: encounter?.key }
      ]
    });

  const {
    data: electrocardiogramEcgResponse,
    refetch: refetchelectrocardiogramEcg,
    isLoading
  } = useGetElectrocardiogramECGsQuery(electrocardiogramEcgListRequest);

  const isSelected = rowData => {
    if (rowData && electrocardiogramEcg && electrocardiogramEcg.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };

  const handleClearField = () => {
    setElectrocardiogramEcg({
      ...newApElectrocardiogramEcg,
      stSegmentChangesLkey: null,
      waveAbnormalitiesLkey: null
    });
  };

  const handleAddNewElectrocardiogram = () => {
    handleClearField();
    setOpen(true);
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setElectrocardiogramEcgListRequest({
      ...electrocardiogramEcgListRequest,
      pageNumber: newPage + 1
    });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setElectrocardiogramEcgListRequest({
      ...electrocardiogramEcgListRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };

  const handleCancle = () => {
    saveElectrocardiogramECG({
      ...electrocardiogramEcg,
      statusLkey: '3196709905099521',
      deletedAt: new Date().getTime(),
      deletedBy: authSlice.user.key
    })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'ECG Canceled Successfully', sev: 'success' }));
        refetchelectrocardiogramEcg();
      });
    setPopupCancelOpen(false);
  };

  useEffect(() => {
    setElectrocardiogramEcgListRequest(prev => ({
      ...prev,
      filters: [
        { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
        ...(patient?.key && encounter?.key
          ? [
              { fieldName: 'patient_key', operator: 'match', value: patient?.key },
              { fieldName: 'encounter_key', operator: 'match', value: encounter?.key }
            ]
          : [])
      ]
    }));
  }, [patient?.key, encounter?.key]);

  useEffect(() => {
    setElectrocardiogramEcgListRequest(prev => ({
      ...prev,
      filters: [
        ...(electrocardiogramEcgStatus !== ''
          ? [
              { fieldName: 'status_lkey', operator: 'match', value: electrocardiogramEcgStatus },
              { fieldName: 'patient_key', operator: 'match', value: patient?.key },
              ...(allData === false
                ? [{ fieldName: 'encounter_key', operator: 'match', value: encounter?.key }]
                : [])
            ]
          : [
              { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
              { fieldName: 'patient_key', operator: 'match', value: patient?.key },
              ...(allData === false
                ? [{ fieldName: 'encounter_key', operator: 'match', value: encounter?.key }]
                : [])
            ])
      ]
    }));
  }, [electrocardiogramEcgStatus, allData]);

  useEffect(() => {
    setElectrocardiogramEcgListRequest(prev => {
      const filters =
        electrocardiogramEcgStatus !== '' && allData
          ? [{ fieldName: 'patient_key', operator: 'match', value: patient?.key }]
          : electrocardiogramEcgStatus === '' && allData
          ? [
              { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
              { fieldName: 'patient_key', operator: 'match', value: patient?.key }
            ]
          : prev.filters;
      return { ...initialListRequest, filters };
    });
  }, [allData, electrocardiogramEcgStatus]);

  const pageIndex = electrocardiogramEcgListRequest.pageNumber - 1;
  const rowsPerPage = electrocardiogramEcgListRequest.pageSize;
  const totalCount = electrocardiogramEcgResponse?.extraNumeric ?? 0;

  const columns = [
    {
      key: 'imageSelect',
      title: '',
      render: rowData => {
        const isChecked = selectedImages.some(img => img.key === rowData.key); // تحقق لكل صف
        return (
          <Checkbox
            checked={isChecked}
            onChange={(value, checked) => {
              setSelectedImages(prev => {
                if (checked) {
                  // إضافة فقط هذه الصورة
                  return [
                    ...prev.filter(img => img.key !== rowData.key), // إزالة أي نسخة موجودة مسبقًا لنفس الصف
                    {
                      key: rowData.key,
                      imageUrl: rowData.imageUrl,
                      createdAt: rowData.createdAt,
                      createdBy: rowData.createByUser?.fullName || ''
                    }
                  ];
                } else {
                  // إزالة الصورة إذا تم إلغاء الاختيار
                  return prev.filter(img => img.key !== rowData.key);
                }
              });
            }}
          />
        );
      }
    },
    {
      key: 'image',
      title: 'IMAGE',
      render: rowData =>
        rowData?.imageUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src={rowData.imageUrl}
              alt="ECG"
              style={{ width: '60px', height: '60px', objectFit: 'cover', marginBottom: '4px' }}
            />
            <span style={{ fontSize: '10px', textAlign: 'center' }}>
              {rowData.createByUser?.fullName}
              <br />
              {formatDateWithoutSeconds(rowData.createdAt)}
            </span>
          </div>
        ) : (
          ' '
        )
    },
    {
      key: 'indication',
      title: <Translate>INDICATION</Translate>,
      render: rowData => rowData?.indication
    },
    ,
    {
      key: 'ecgLeadType',
      title: <Translate>ECG LEAD TYPE</Translate>,
      render: rowData => rowData?.ecgLeadType
    },
    {
      key: 'heartRate',
      title: <Translate>HEART RATE</Translate>,
      render: rowData => (rowData?.heartRate ? `${rowData?.heartRate ?? ''} BPM` : ' ')
    },
    {
      key: 'prInterval',
      title: <Translate>PR INTERVAL</Translate>,
      render: rowData => (rowData?.prInterval ? `${rowData?.prInterval ?? ''} ms` : ' ')
    },
    {
      key: 'qrsDuration',
      title: <Translate>QRS DURATION</Translate>,
      render: rowData => (rowData?.qrsDuration ? `${rowData?.qrsDuration ?? ''} ms` : ' ')
    },
    {
      key: 'qtInterval',
      title: <Translate>QT INTERVAL</Translate>,
      render: rowData => (rowData?.qtInterval ? `${rowData?.qtInterval ?? ''} ms` : ' ')
    },
    {
      key: 'stSegmentChanges',
      title: <Translate>ST SEGMENT CHANGES</Translate>,
      render: rowData =>
        rowData?.stSegmentChangesLvalue?.lovDisplayVale ?? rowData?.stSegmentChangesLkey
    },
    {
      key: 'waveAbnormalities',
      title: <Translate>T WAVE ABNORMALITIES</Translate>,
      render: rowData =>
        rowData?.waveAbnormalitiesLvalue?.lovDisplayVale ?? rowData?.waveAbnormalitiesLkey
    },
    {
      key: 'details',
      title: <Translate>EDIT</Translate>,
      flexGrow: 2,
      fullText: true,
      render: rowData => (
        <MdModeEdit
          title="Edit"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setElectrocardiogramEcg(rowData);
            setOpen(true);
          }}
        />
      )
    },
    {
      key: 'createdAt',
      title: 'CREATED AT/BY',
      expandable: true,
      render: row =>
        row?.createdAt ? (
          <>
            {row?.createByUser?.fullName}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'updatedAt',
      title: 'UPDATED AT/BY',
      expandable: true,
      render: row =>
        row?.updatedAt ? (
          <>
            {row?.updateByUser?.fullName}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.updatedAt)}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'deletedAt',
      title: 'CANCELLED AT/BY',
      expandable: true,
      render: row =>
        row?.deletedAt ? (
          <>
            {row?.deleteByUser?.fullName}
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.deletedAt)}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'cancellationReason',
      title: 'CANCELLATION REASON',
      dataKey: 'cancellationReason',
      expandable: true
    }
  ];
  return (
    // الجزء الخاص بعرض الصور أسفل الجدول وكل Checkbox مستقل
    <div>
      <MyTable
        data={electrocardiogramEcgResponse?.object ?? []}
        loading={isLoading}
        height={600}
        onRowClick={rowData => setElectrocardiogramEcg({ ...rowData })}
        rowClassName={isSelected}
        page={pageIndex}
        columns={[
          ...columns,
          {
            key: 'imageSelect',
            title: '',
            render: rowData => (
              <Checkbox
                checked={selectedImages.some(img => img.key === rowData.key)}
                onChange={(value, checked) => {
                  setSelectedImages(prev => {
                    if (checked) {
                      // إضافة صورة واحدة للـ row الحالي
                      return [
                        ...prev.filter(img => img.key !== rowData.key),
                        {
                          key: rowData.key,
                          imageUrl: rowData.imageUrl,
                          createdAt: rowData.createdAt,
                          createdBy: rowData.createByUser?.fullName || ''
                        }
                      ];
                    } else {
                      // إزالة الصورة إذا تم إلغاء الاختيار
                      return prev.filter(img => img.key !== rowData.key);
                    }
                  });
                }}
              />
            )
          }
        ]}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={
          <div className="bt-div-2">
            <div className="bt-left-2">
              <MyButton
                onClick={() => setPopupCancelOpen(true)}
                prefixIcon={() => <CloseOutlineIcon />}
                disabled={!edit ? !electrocardiogramEcg?.key : true}
              >
                <Translate>Cancel</Translate>
              </MyButton>
              <Checkbox
                onChange={(value, checked) =>
                  setElectrocardiogramEcgStatus(checked ? '3196709905099521' : '')
                }
              >
                Show Cancelled
              </Checkbox>
              <Checkbox onChange={(value, checked) => setAllData(checked)}>Show All</Checkbox>
            </div>
            <div className="bt-right-2">
              <MyButton
                disabled={edit}
                prefixIcon={() => <PlusIcon />}
                onClick={handleAddNewElectrocardiogram}
              >
                Add
              </MyButton>
            </div>
          </div>
        }
      />

      {/* عرض الصور أسفل الجدول */}
      
{/* عرض الصور أسفل الجدول */}
{selectedImages.length > 0 && (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
    {selectedImages.map((img, index) => (
      <div
        key={index}
        style={{
          width: 'calc(33.33% - 8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '8px'
        }}
      >
        <img
          src={img.imageUrl || epg} // استخدم الصورة الافتراضية إذا لم توجد صورة
          alt="ECG"
          style={{ width: '100%', height: '120px', objectFit: 'cover' }}
        />
        <span style={{ fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>
          {formatDateWithoutSeconds(img.createdAt)}
        </span>
      </div>
    ))}
  </div>
)}

      <AddElectrocardiogram
        open={open}
        setOpen={setOpen}
        patient={patient}
        encounter={encounter}
        electrocardiogramEcgObject={electrocardiogramEcg}
        refetch={refetchelectrocardiogramEcg}
        edit={edit}
      />
      <CancellationModal
        title="Cancel ECG"
        fieldLabel="Cancellation Reason"
        open={popupCancelOpen}
        setOpen={setPopupCancelOpen}
        object={electrocardiogramEcg}
        setObject={setElectrocardiogramEcg}
        handleCancle={handleCancle}
        fieldName="cancellationReason"
      />
    </div>
  );
};

export default ElectrocardiogramECG;
