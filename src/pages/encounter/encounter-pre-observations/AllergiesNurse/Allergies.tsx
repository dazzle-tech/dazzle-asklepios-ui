import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { useGetAllergiesQuery, useSaveAllergiesMutation } from '@/services/observationService';
import { useGetAllergensQuery } from '@/services/setupService';
import { ApVisitAllergies } from '@/types/model-types';
import { newApVisitAllergies } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { faArrowRotateRight, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import PlusIcon from '@rsuite/icons/Plus';
import ReloadIcon from '@rsuite/icons/Reload';
import React, { useEffect, useState } from 'react';
import { MdModeEdit } from 'react-icons/md';
import { Checkbox, IconButton, Table } from 'rsuite';
import DetailsModal from './DetailsModal';
import { formatDateWithoutSeconds } from '@/utils';
import './styles.less';
import { useLocation } from 'react-router-dom';
const Allergies = props => {
  const location = useLocation();

  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;
  const [allerges, setAllerges] = useState<ApVisitAllergies>({ ...newApVisitAllergies });
  const [showCanceled, setShowCanceled] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPrev, setShowPrev] = useState(true);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [openToAdd, setOpenToAdd] = useState(true);
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      },
      {
        fieldName: 'status_lkey',
        operator: showCanceled ? 'notMatch' : 'match',
        value: '3196709905099521'
      }
    ]
  });

  const {
    data: allergiesListResponse,
    refetch: fetchallerges,
    isLoading
  } = useGetAllergiesQuery({
    ...listRequest
  });
  const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);

  const [openConfirmResolvedModel, setOpenConfirmResolvedModel] = useState(false);

  const [openConfirmUndoResolvedModel, setOpenConfirmUndoResolvedModel] = useState(false);

  const { data: allergensListToGetName } = useGetAllergensQuery({
    ...initialListRequest
  });
  const [saveAllergies, saveAllergiesMutation] = useSaveAllergiesMutation();
  const dispatch = useAppDispatch();

  const isSelected = rowData => {
    if (rowData && allerges && rowData.key === allerges.key) {
      return 'selected-row';
    } else return '';
  };

  useEffect(() => {
    if (showPrev) {
      const updatedFilters = [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient?.key
        },
        {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '3196709905099521'
        },
        {
          fieldName: 'visit_key',
          operator: 'match',
          value: encounter.key
        }
      ];
      setListRequest(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    } else {
      const updatedFilters = [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient?.key
        },
        {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '3196709905099521'
        }
      ];
      setListRequest(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    }
  }, [showPrev]);
  //Effect when do save allergy , refetch allergies
  useEffect(() => {
    fetchallerges();
  }, [saveAllergiesMutation]);

  useEffect(() => {
    fetchallerges();
  }, [listRequest]);

  useEffect(() => {
    if (showPrev) {
      const updatedFilters = [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient?.key
        },
        {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '3196709905099521'
        },
        {
          fieldName: 'visit_key',
          operator: 'match',
          value: encounter.key
        }
      ];
      setListRequest(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    } else {
      const updatedFilters = [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient?.key
        },
        {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '3196709905099521'
        }
      ];
      setListRequest(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    }
  }, [showCanceled]);

  const handleClear = () => {
    setAllerges({
      ...newApVisitAllergies,
      allergyTypeLkey: null,
      allergenKey: null,
      onsetLkey: null,
      reactionDescription: null,
      sourceOfInformationLkey: null,
      treatmentStrategyLkey: null,
      severityLkey: null,
      criticalityLkey: null,
      typeOfPropensityLkey: null
    });
  };

  const OpenCancellationReasonModel = () => {
    setOpenCancellationReasonModel(true);
  };
  const CloseCancellationReasonModel = () => {
    setOpenCancellationReasonModel(false);
  };
  const OpenConfirmUndoResolvedModel = () => {
    setOpenConfirmUndoResolvedModel(true);
  };
  const CloseConfirmUndoResolvedModel = () => {
    setOpenConfirmUndoResolvedModel(false);
  };
  const OpenConfirmResolvedModel = () => {
    setOpenConfirmResolvedModel(true);
  };
  const CloseConfirmResolvedModel = () => {
    setOpenConfirmResolvedModel(false);
  };
  const handleCancle = async () => {
    try {
      await saveAllergies({
        ...allerges,
        statusLkey: '3196709905099521',
        isValid: false,
        deletedAt: Date.now()
      }).unwrap();
      dispatch(notify({ msg: 'Deleted successfully', sev: 'success' }));

      fetchallerges()
        .then(() => {})
        .catch(error => {
          console.error('Refetch failed:', error);
        });

      CloseCancellationReasonModel();
    } catch {
      dispatch(notify({ msg: ' Deleted Faild', sev: 'error' }));
    }
  };

  const handleResolved = async () => {
    setShowPrev(true);
    try {
      await saveAllergies({
        ...allerges,
        statusLkey: '9766179572884232',
        resolvedAt: Date.now()
      }).unwrap();
      dispatch(notify('Resolved Successfully'));
      setShowPrev(false);
      await fetchallerges()
        .then(() => {
          console.log('Refetch complete');
        })
        .catch(error => {
          console.error('Refetch failed:', error);
        });

      CloseConfirmResolvedModel();
      setShowPrev(true);
      setAllerges({ ...newApVisitAllergies });
    } catch {
      dispatch(notify('Resolved Fill'));
    }
  };

  const handleUndoResolved = async () => {
    setShowPrev(true);
    try {
      await saveAllergies({
        ...allerges,
        statusLkey: '9766169155908512'
      }).unwrap();
      dispatch(notify('Undo Resolved Successfully'));
      setShowPrev(false);
      await fetchallerges()
        .then(() => {})
        .catch(error => {
          console.error('Refetch failed:', error);
        });

      CloseConfirmUndoResolvedModel();
      setShowPrev(true);
      setAllerges({ ...newApVisitAllergies });
    } catch {
      dispatch(notify('Undo Resolved Fill'));
    }
  };
  const tableColumns = [
    {
      key: 'allergyTypeLvalue',
      dataKey: 'allergyTypeLvalue',
      title: <Translate>Allergy Type</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.allergyTypeLvalue?.lovDisplayVale
    },
    {
      key: 'allergenKey',
      dataKey: 'allergenKey',
      title: <Translate>Allergen</Translate>,
      flexGrow: 2,
      render: (rowData: any) => {
        if (!allergensListToGetName?.object) return 'Loading...';
        const found = allergensListToGetName.object.find(item => item.key === rowData.allergenKey);
        return found?.allergenName || 'No Name';
      }
    },
    {
      key: 'severityLvalue',
      dataKey: 'severityLvalue',
      title: <Translate>Severity</Translate>,
      flexGrow: 1,
      render: (rowData: any) => rowData.severityLvalue?.lovDisplayVale
    },
    {
      key: 'criticalityLkey',
      dataKey: 'criticalityLkey',
      title: <Translate>Certainty type</Translate>,
      flexGrow: 2,
      render: (rowData: any) =>
        rowData.criticalityLkey
          ? rowData.criticalityLvalue?.lovDisplayVale
          : rowData.criticalityLkey
    },
    {
      key: 'onsetLvalue',
      dataKey: 'onsetLvalue',
      title: <Translate>Onset</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.onsetLvalue?.lovDisplayVale
    },
    {
      key: 'onsetDate',
      dataKey: 'onsetDate',
      title: <Translate>Onset Date Time</Translate>,
      flexGrow: 2,
      render: (rowData: any) =>
        rowData.onsetDate ? new Date(rowData.onsetDate).toLocaleDateString('en-GB') : 'Undefined'
    },
    {
      key: 'treatmentStrategyLvalue',
      dataKey: 'treatmentStrategyLvalue',
      title: <Translate>Treatment Strategy</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.treatmentStrategyLvalue?.lovDisplayVale
    },
    {
      key: 'sourceOfInformationLvalue',
      dataKey: 'sourceOfInformationLvalue',
      title: <Translate>Source of information</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.sourceOfInformationLvalue?.lovDisplayVale || 'BY Patient'
    },
    {
      key: 'reactionDescription',
      dataKey: 'reactionDescription',
      title: <Translate>Reaction Description</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.reactionDescription
    },
    {
      key: 'typeOfPropensityLkey',
      dataKey: 'typeOfPropensityLkey',
      title: <Translate>Type Of Propensity</Translate>,
      flexGrow: 2,
      render: (rowData: any) =>
        rowData.typeOfPropensityLkey
          ? rowData.typeOfPropensityLvalue?.lovDisplayVale
          : rowData.typeOfPropensityLkey
    },
    {
      key: 'statusLvalue',
      dataKey: 'statusLvalue',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      render: (rowData: any) => rowData.statusLvalue?.lovDisplayVale
    },
    {
      key: '#',
      dataKey: '',
      title: <Translate>Edit</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return (
          <MdModeEdit
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => {
              setOpenDetailsModal(true);
              setOpenToAdd(false);
            }}
          />
        );
      }
    },
    {
      key: 'notes',
      dataKey: 'notes',
      title: <Translate>Notes</Translate>,
      expandable: true
    },
    {
      key: 'certainty',
      dataKey: 'certainty',
      title: <Translate>Certainty</Translate>,
      expandable: true
    },
    {
      key: 'cancellationReason',
      dataKey: 'cancellationReason',
      title: <Translate>Cancellation Reason</Translate>,
      expandable: true
    },
    {
      key: '',
      title: <Translate>Created At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.createdBy}</span>
            <br />
            <span className="date-table-style">
              {rowData.createdAt ? formatDateWithoutSeconds(rowData.createdAt) : ''}
            </span>
          </>
        );
      }
    },
    {
      key: '',
      title: <Translate>Updated At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.updatedBy}</span>
            <br />
            <span className="date-table-style">
              {rowData.createdAt ? formatDateWithoutSeconds(rowData.createdAt) : ''}
            </span>
          </>
        );
      }
    },

    {
      key: '',
      title: <Translate>Cancelled At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.deletedBy}</span>
            <br />
            <span className="date-table-style">
              {rowData.deletedAt ? formatDateWithoutSeconds(rowData.deletedAt) : ''}
            </span>
          </>
        );
      }
    },
    {
      key: '',
      title: <Translate>Resolved At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        if (rowData.statusLkey != '9766169155908512') {
          return (
            <>
              <span>{rowData.resolvedBy}</span>
              <br />
              <span className="date-table-style">
                {rowData.resolvedAt ? formatDateWithoutSeconds(rowData.resolvedAt) : ''}
              </span>
            </>
          );
        } else {
          return null;
        }
      }
    }
  ];
  const pageIndex = listRequest.pageNumber - 1;

  // how many rows per page:
  const rowsPerPage = listRequest.pageSize;

  // total number of items in the backend:
  const totalCount = allergiesListResponse?.extraNumeric ?? 0;

  // handler when the user clicks a new page number:
  const handlePageChange = (_: unknown, newPage: number) => {
    // MUI gives you a zero-based page, so add 1 for your API

    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };

  // handler when the user chooses a different rows-per-page:
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1 // reset to first page
    });
  };
  return (
    <div>
      {/* buttons actions section */}

      <MyTable
        columns={tableColumns}
        data={allergiesListResponse?.object || []}
        onRowClick={rowData => {
          setAllerges(rowData);
          setEditing(rowData.statusLkey == '3196709905099521' ? true : false);
          setOpenToAdd(false);
        }}
        rowClassName={isSelected}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          setListRequest({ ...listRequest, sortBy, sortType });
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        loading={isLoading}
        tableButtons={
          <div className="bt-div-2">
            <div className="bt-left-2">
              <MyButton
                prefixIcon={() => <CloseOutlineIcon />}
                onClick={OpenCancellationReasonModel}
                disabled={!edit ? (allerges?.key == null ? true : false) : true}
              >
                Cancel
              </MyButton>
              <MyButton
                disabled={
                  !edit ? (allerges?.statusLkey != '9766169155908512' ? true : false) : true
                }
                prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}
                onClick={OpenConfirmResolvedModel}
              >
                Resolved
              </MyButton>
              <MyButton
                prefixIcon={() => <ReloadIcon />}
                disabled={
                  !edit ? (allerges?.statusLkey != '9766179572884232' ? true : false) : true
                }
                onClick={OpenConfirmUndoResolvedModel}
              >
                Undo Resolved
              </MyButton>
              <Checkbox
                checked={!showCanceled}
                onChange={() => {
                  setShowCanceled(!showCanceled);
                }}
              >
                Show Cancelled
              </Checkbox>
              <Checkbox
                checked={!showPrev}
                onChange={() => {
                  setShowPrev(!showPrev);
                }}
              >
                Show Previous Allergies
              </Checkbox>
            </div>
            <div className="bt-right-2">
              <MyButton
                disabled={edit}
                prefixIcon={() => <PlusIcon />}
                onClick={() => {
                  handleClear();
                  setOpenDetailsModal(true);
                  setOpenToAdd(true);
                }}
              >
                Add Allergy
              </MyButton>
            </div>
          </div>
        }
      />

      {/* modal for cancell the allergy and write the reason */}
      <CancellationModal
        open={openCancellationReasonModel}
        setOpen={setOpenCancellationReasonModel}
        object={allerges}
        setObject={setAllerges}
        handleCancle={handleCancle}
        fieldName="cancellationReason"
        fieldLabel={'Cancellation Reason'}
        title={'Cancellation'}
      ></CancellationModal>
      {/* open modal to resolve allergy */}
      <MyModal
        open={openConfirmResolvedModel}
        setOpen={setOpenConfirmResolvedModel}
        actionButtonFunction={handleResolved}
        actionButtonLabel="Yes"
        title="Resolve"
        bodyheight="30vh"
        steps={[{ title: 'Is this allergy resolved?', icon: <FontAwesomeIcon icon={faCheck} /> }]}
        content={<></>}
      ></MyModal>

      <MyModal
        open={openConfirmUndoResolvedModel}
        setOpen={setOpenConfirmUndoResolvedModel}
        actionButtonFunction={handleUndoResolved}
        actionButtonLabel="Yes"
        title="Undo Resolve"
        bodyheight="30vh"
        steps={[
          { title: 'Is this allergy active?', icon: <FontAwesomeIcon icon={faArrowRotateRight} /> }
        ]}
        content={<></>}
      ></MyModal>

      {/*modal for add details for allergy and save it */}
      <DetailsModal
        open={openDetailsModal}
        setOpen={setOpenDetailsModal}
        allerges={allerges}
        setAllerges={setAllerges}
        handleClear={handleClear}
        edit={edit}
        patient={patient}
        encounter={encounter}
        fetchallerges={fetchallerges}
        openToAdd={openToAdd}
      />
    </div>
  );
};
export default Allergies;
