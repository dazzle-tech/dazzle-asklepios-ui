import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import './styles.less';
import { useAppDispatch, useAppSelector } from '@/hooks';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import ReloadIcon from '@rsuite/icons/Reload';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import {
  Form,
  Input,
  DatePicker,
  Checkbox,
  IconButton,
  Table,
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import MyInput from '@/components/MyInput';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import PlusIcon from '@rsuite/icons/Plus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRotateRight, faCheck, faPersonDotsFromLine } from '@fortawesome/free-solid-svg-icons';
import {
  useGetLovValuesByCodeQuery,
  useGetAllergensQuery
} from '@/services/setupService';
import { useGetAllergiesQuery, useSaveAllergiesMutation } from '@/services/observationService';
import { ApVisitAllergies } from '@/types/model-types';
import { newApVisitAllergies } from '@/types/model-types-constructor';
import MyLabel from '@/components/MyLabel/index';
import CancellationModal from '@/components/CancellationModal';
import DetailsModal from './DetailsModal';
const Allergies = ({ edit, patient, encounter }) => {
  const [allerges, setAllerges] = useState<ApVisitAllergies>({ ...newApVisitAllergies });
  const [showCanceled, setShowCanceled] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPrev, setShowPrev] = useState(true);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);

  const [listRequestallerg, setListRequestallerg] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient.key
      },
      {
        fieldName: 'status_lkey',
        operator: showCanceled ? 'notMatch' : 'match',
        value: '3196709905099521'
      }
    ]
  });

  const { data: allergiesListResponse, refetch: fetchallerges } = useGetAllergiesQuery({
    ...listRequestallerg
  });
  const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);

  const [openConfirmResolvedModel, setOpenConfirmResolvedModel] = useState(false);

  const [openConfirmUndoResolvedModel, setOpenConfirmUndoResolvedModel] = useState(false);

  const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);

  const { data: allergensListToGetName } = useGetAllergensQuery({
    ...initialListRequest
  });

  const [selectedOnsetDate, setSelectedOnsetDate] = useState(null);
  const [saveAllergies, saveAllergiesMutation] = useSaveAllergiesMutation();
  const [reactionDescription, setReactionDescription] = useState();
  const [editOnset, setEditOnset] = useState({ editdate: true });
 

  const dispatch = useAppDispatch();

  const isSelected = rowData => {
    if (rowData && allerges && rowData.key === allerges.key) {
      return 'selected-row';
    } else return '';
  };
 //Effect when reactionDescription get new value and push it to prev 

//effect when Allergy object change and if have onset date handle formating date
  useEffect(() => {
    if (allerges.onsetDate != 0) {
      setEditOnset({ editdate: false });
      setSelectedOnsetDate(new Date(allerges.onsetDate));
    }
    if (allerges.sourceOfInformationLkey != null) {
      seteditSourceof({ editSource: false });
    }
  }, [allerges]);
//Effect when check Show Prev Allergy and update filter to get prev allergies
  useEffect(() => {
    if (showPrev) {
      const updatedFilters = [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient.key
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
      setListRequestallerg(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    } else {
      const updatedFilters = [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient.key
        },
        {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '3196709905099521'
        }
      ];
      setListRequestallerg(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    }
  }, [showPrev]);
//Effect when do save allergy , refetch allergies 
  useEffect(() => {
    setShowPrev(true);
    fetchallerges();
  }, [saveAllergiesMutation]);

  useEffect(() => {
    fetchallerges();
  }, [listRequestallerg]);

  useEffect(() => {
    if (showPrev) {
      const updatedFilters = [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient.key
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
      setListRequestallerg(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    } else {
      const updatedFilters = [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient.key
        },
        {
          fieldName: 'status_lkey',
          operator: showCanceled ? 'notMatch' : 'match',
          value: '3196709905099521'
        }
      ];
      setListRequestallerg(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    }
  }, [showCanceled]);

  useEffect(() => {
    if (editOnset.editdate) {
      setSelectedOnsetDate(null);
    }
  }, [editOnset.editdate])
 
  const renderRowExpanded = rowData => {
    return (
      <Table
        data={[rowData]} // Pass the data as an array to populate the table
        height={100} // Adjust height as needed
      >
        <Column flexGrow={1} fullText>
          <HeaderCell>Created At</HeaderCell>
          <Cell dataKey="onsetDate">
            {rowData => (rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : '')}
          </Cell>
        </Column>
        <Column flexGrow={1} fullText>
          <HeaderCell>Created By</HeaderCell>
          <Cell dataKey="createdBy" />
        </Column>
        <Column flexGrow={1} fullText>
          <HeaderCell>Updated At</HeaderCell>
          <Cell dataKey="updatedAt">
            {rowData => (rowData.updatedAt ? new Date(rowData.updatedAt).toLocaleString() : '')}
          </Cell>
        </Column>
        <Column flexGrow={1} fullText>
          <HeaderCell>Updated By</HeaderCell>
          <Cell dataKey="updatedBy" />
        </Column>
        <Column flexGrow={2} fullText>
          <HeaderCell>Resolved At</HeaderCell>
          <Cell dataKey="resolvedAt">
            {rowData => {
              if (rowData.statusLkey != '9766169155908512') {
                return rowData.resolvedAt ? new Date(rowData.resolvedAt).toLocaleString() : '';
              }
            }}
          </Cell>
        </Column>
        <Column flexGrow={1} fullText>
          <HeaderCell>Resolved By</HeaderCell>
          <Cell dataKey="resolvedBy" />
        </Column>
        <Column flexGrow={2} fullText>
          <HeaderCell>Cancelled At</HeaderCell>
          <Cell dataKey="deletedAt">
            {rowData => (rowData.deletedAt ? new Date(rowData.deletedAt).toLocaleString() : '')}
          </Cell>
        </Column>
        <Column flexGrow={1} fullText>
          <HeaderCell>Cancelled By</HeaderCell>
          <Cell dataKey="deletedBy" />
        </Column>
        <Column flexGrow={1} fullText>
          <HeaderCell  >
            <Translate>Notes</Translate>
          </HeaderCell>
          <Cell>{rowData => rowData.notes}</Cell>
        </Column>
        <Column flexGrow={2} fullText>
          <HeaderCell  >
            <Translate>Certainty</Translate>
          </HeaderCell>
          <Cell>{rowData => rowData.certainty}</Cell>
        </Column>
        <Column flexGrow={1} fullText>
          <HeaderCell>Cancelliton Reason</HeaderCell>
          <Cell dataKey="cancellationReason" />
        </Column>
      </Table>
    );
  };

  const handleExpanded = rowData => {
    let open = false;
    const nextExpandedRowKeys = [];

    expandedRowKeys.forEach(key => {
      if (key === rowData.key) {
        open = true;
      } else {
        nextExpandedRowKeys.push(key);
      }
    });

    if (!open) {
      nextExpandedRowKeys.push(rowData.key);
    }
    setExpandedRowKeys(nextExpandedRowKeys);
  };

  const ExpandCell = ({ rowData, dataKey, expandedRowKeys, onChange, ...props }) => (
    <Cell {...props} style={{ padding: 5 }}>
      <IconButton
        appearance="subtle"
        onClick={() => {
          onChange(rowData);
        }}
        icon={
          expandedRowKeys.some(key => key === rowData['key']) ? (
            <CollaspedOutlineIcon />
          ) : (
            <ExpandOutlineIcon />
          )
        }
      />
    </Cell>
  );

 
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
    setSelectedOnsetDate(null);
    setEditOnset({ editdate: true });
    seteditSourceof({ editSource: true });
    setReactionDescription(null);
  };

  const handleSave = async () => {
    setShowPrev(true);
    try {
      await saveAllergies({
        ...allerges,
        patientKey: patient.key,
        visitKey: encounter.key,
        statusLkey: '9766169155908512',
        reactionDescription: reactionDescription,
        onsetDate: selectedOnsetDate ? selectedOnsetDate.getTime() : null
      }).unwrap();
      dispatch(notify('Saved Successfully'));
      setOpenDetailsModal(false)
      setShowPrev(false);
      await fetchallerges(); // Ensure refetch is awaited
      await handleClear();
      setShowPrev(true);
    } catch (error) {
      dispatch(notify('Save Failed'));
      console.error('An error occurred:', error);
    }
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
      dispatch(notify(' deleted successfully'));
      setShowCanceled(false);
      fetchallerges()
        .then(() => {
         
        })
        .catch(error => {
          console.error('Refetch failed:', error);
        });

      CloseCancellationReasonModel();
    } catch { }
  };

  const handleResolved = async () => {
    setShowPrev(true);
    try {
      await saveAllergies({
        ...allerges,
        statusLkey: '9766179572884232',
        resolvedAt: Date.now()
      }).unwrap();
      dispatch(notify({msg:'Resolved Successfully',sev:'success'}));
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
      dispatch(notify({msg:'Undo Resolved Successfully',sev:'success'}));
      setShowPrev(false);
      await fetchallerges()
        .then(() => {
          
        })
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
  return (
    <div>

      {/* buttons actions section */}
      <div className='bt-div'>
        <MyButton
          prefixIcon={() => <CloseOutlineIcon />}
          onClick={OpenCancellationReasonModel}
        >Cancel</MyButton>

        <MyButton
          disabled={allerges?.statusLkey != '9766169155908512' ? true : false}
          prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}
          onClick={OpenConfirmResolvedModel}
        >
          Resolved</MyButton>
        <MyButton
          prefixIcon={() => <ReloadIcon />}
          disabled={allerges?.statusLkey != '9766179572884232' ? true : false}
          onClick={OpenConfirmUndoResolvedModel}
        >Undo Resolved</MyButton>

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
        <div className='bt-right'>
          <MyButton
            prefixIcon={() => <PlusIcon />}
            onClick={() => setOpenDetailsModal(true)}
          >Add Allergy</MyButton>
        </div>
      </div>

      <Table
        autoHeight
        data={allergiesListResponse?.object || []}
        rowKey="key"
        expandedRowKeys={expandedRowKeys} // Ensure expanded row state is correctly handled
        renderRowExpanded={renderRowExpanded} // This is the function rendering the expanded child table
        shouldUpdateScroll={false}
        onRowClick={rowData => {
          setAllerges(rowData);
          setEditing(rowData.statusLkey == '3196709905099521' ? true : false);
        }}
        rowClassName={isSelected}
      >
        <Column width={70}  >
          <HeaderCell>#</HeaderCell>
          <ExpandCell
            rowData={rowData => rowData}
            dataKey="key"
            expandedRowKeys={expandedRowKeys}
            onChange={handleExpanded}
          />
        </Column>

        <Column flexGrow={2} fullText>
          <HeaderCell >
            <Translate>Allergy Type</Translate>
          </HeaderCell>
          <Cell>{rowData => rowData.allergyTypeLvalue?.lovDisplayVale}</Cell>
        </Column>
        <Column flexGrow={2} fullText>
          <HeaderCell >
            <Translate>Allergen</Translate>
          </HeaderCell>
          <Cell>
            {rowData => {
              if (!allergensListToGetName?.object) {
                return 'Loading...';
              }
              const getname = allergensListToGetName.object.find(
                item => item.key === rowData.allergenKey
              );

              return getname?.allergenName || 'No Name';
            }}
          </Cell>
        </Column>
        <Column flexGrow={1} fullText>
          <HeaderCell >
            <Translate>Severity</Translate>
          </HeaderCell>
          <Cell>{rowData => rowData.severityLvalue?.lovDisplayVale}</Cell>
        </Column>
        <Column flexGrow={2} fullText>
          <HeaderCell  >
            <Translate>Certainty type</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.criticalityLkey
                ? rowData.criticalityLvalue.lovDisplayVale
                : rowData.criticalityLkey
            }
          </Cell>
        </Column>
        <Column flexGrow={2} fullText>
          <HeaderCell  >
            <Translate>Onset</Translate>
          </HeaderCell>
          <Cell>{rowData => rowData.onsetLvalue?.lovDisplayVale}</Cell>
        </Column>
        <Column flexGrow={2} fullText>
          <HeaderCell  >
            <Translate>Onset Date Time</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.onsetDate ? new Date(rowData.onsetDate).toLocaleString() : 'Undefind'
            }
          </Cell>
        </Column>
        <Column flexGrow={2} fullText>
          <HeaderCell  >
            <Translate>Treatment Strategy</Translate>
          </HeaderCell>
          <Cell>{rowData => rowData.treatmentStrategyLvalue?.lovDisplayVale}</Cell>
        </Column>
        <Column flexGrow={2} fullText>
          <HeaderCell  >
            <Translate>Source of information</Translate>
          </HeaderCell>
          <Cell>
            {rowData => rowData.sourceOfInformationLvalue?.lovDisplayVale || 'BY Patient'}
          </Cell>
        </Column>
        <Column flexGrow={2} fullText>
          <HeaderCell  >
            <Translate>Reaction Description</Translate>
          </HeaderCell>
          <Cell>{rowData => rowData.reactionDescription}</Cell>
        </Column>
        <Column flexGrow={2} fullText>
          <HeaderCell  >
            <Translate>Type Of Propensity</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.typeOfPropensityLkey
                ? rowData.typeOfPropensityLvalue.lovDisplayVale
                : rowData.typeOfPropensityLkey
            }
          </Cell>
        </Column>
        <Column flexGrow={1} fullText>
          <HeaderCell  >
            <Translate>Status</Translate>
          </HeaderCell>
          <Cell>{rowData => rowData.statusLvalue?.lovDisplayVale}</Cell>
        </Column>
      </Table>

      {/* modal for cancell the allergy and write the reason */}
      <CancellationModal
        open={openCancellationReasonModel}
        setOpen={setOpenCancellationReasonModel}
        object={allerges}
        setObject={setAllerges}
        handleCancle={handleCancle}
        fieldName="cancellationReason"
      ></CancellationModal>
     {/* open modal to resolve allergy */}
      <MyModal
      open={openConfirmResolvedModel}
      setOpen={setOpenConfirmResolvedModel}
      actionButtonFunction={handleResolved}
      actionButtonLabel='Yes'
      title="Resolve"
      bodyheight={150}
      steps={[{title:"Is this allergy resolved?" ,icon:faCheck}]}
     content={<></>}
      ></MyModal>
  
       <MyModal
      open={openConfirmUndoResolvedModel}
      setOpen={setOpenConfirmUndoResolvedModel}
      actionButtonFunction={handleUndoResolved}
      actionButtonLabel='Yes'
      title="Undo Resolve"
      bodyheight={150}
      steps={[{title:"Is this allergy active?" ,icon:faArrowRotateRight}]}
     content={<></>}
      ></MyModal>

      {/*modal for add details for allergy and save it */}
      <DetailsModal open={openDetailsModal} setOpen={setOpenDetailsModal} allerges={allerges} setAllerges={setAllerges} handleClear={handleClear} handleSave={handleSave} edit={edit} editing={editing} />
    
    </div>
  );
};
export default Allergies;
