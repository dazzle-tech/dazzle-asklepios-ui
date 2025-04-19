import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Translate from '@/components/Translate';
import './styles.less';
import * as icons from '@rsuite/icons';

import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { faList, faPlay, faCheck, faRectangleXmark } from '@fortawesome/free-solid-svg-icons';
import EncounterMainInfoSection from '../../encounter-main-info-section';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import FileUploadIcon from '@rsuite/icons/FileUpload';
import PatientOrder from '../diagnostics-order';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import { useGetPractitionersQuery } from '@/services/setupService';
import {
  InputGroup,
  Form,
  Input,
  Panel,
  Text,
  Checkbox,
  Dropdown,
  Button,
  IconButton,
  SelectPicker,
  Table,
  Modal,
  Stack,
  Divider,
  DatePicker,
  Steps,
  ButtonToolbar
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;

import { notify } from '@/utils/uiReducerActions';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  useFetchAttachmentQuery,
  useFetchAttachmentLightQuery,
  useFetchAttachmentByKeyQuery,
  useUploadMutation,
  useDeleteAttachmentMutation,
  useUpdateAttachmentDetailsMutation
} from '@/services/attachmentService';

import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CheckIcon from '@rsuite/icons/Check';
import PlusIcon from '@rsuite/icons/Plus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom ,faPen} from '@fortawesome/free-solid-svg-icons';
import { faBedPulse } from '@fortawesome/free-solid-svg-icons';
import OthersIcon from '@rsuite/icons/Others';
import RemindOutlineIcon from '@rsuite/icons/RemindOutline';
import AttachmentModal from '@/pages/patient/patient-profile/AttachmentUploadModal';
import SearchIcon from '@rsuite/icons/Search';
import BlockIcon from '@rsuite/icons/Block';
import MyInput from '@/components/MyInput';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetIcdListQuery } from '@/services/setupService';
import {
  useGetEncounterReviewOfSystemsQuery,
  useGetProceduresQuery,
  useSaveProceduresMutation
} from '@/services/encounterService';
import { useGetPatientDiagnosisQuery } from '@/services/encounterService';
import { ApPatientDiagnose, ApProcedure } from '@/types/model-types';
import { newApPatientDiagnose, newApProcedure } from '@/types/model-types-constructor';
import {
  useGetDepartmentsQuery,
  useGetProcedureListQuery,
  useGetProcedureCodingListQuery
} from '@/services/setupService';
import Indications from '@/pages/medications/active-ingredients-setup/Indications';
import MyButton from '@/components/MyButton/MyButton';
import AdvancedModal from '@/components/AdvancedModal';
import InfoCardList from '@/components/InfoCardList';
import MyModal from '@/components/MyModal/MyModal';
import Perform from './Perform';
import { title } from 'process';
import Details from './Details';

const Referrals = ({ edit, patient, encounter }) => {
  const dispatch = useAppDispatch();
  const [selectedRows, setSelectedRows] = useState([]);
  const [showCanceled, setShowCanceled] = useState(true);
  const [showPrev, setShowPrev] = useState(true);
  const [actionType, setActionType] = useState(null);
  const [editing, setEditing] = useState(false);
  const [openPerformModal, setOpenPerformModal] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
  const [indicationsDescription, setindicationsDescription] = useState<string>('');
  const [searchKeywordicd, setSearchKeywordicd] = useState('');
  const [openConfirmDeleteModel, setConfirmDeleteModel] = useState(false);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const patientDiagnoseListResponse = useGetPatientDiagnosisQuery({
    ...initialListRequest,

    timestamp: new Date().getMilliseconds(),
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient.key
      },
      {
        fieldName: 'visit_key',
        operator: 'match',
        value: encounter.key
      }
    ]
  });
  const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
  const [openOrderModel, setOpenOrderModel] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  console.log("open", openDetailsModal);
  const [procedure, setProcedure] = useState<ApProcedure>({
    ...newApProcedure,
    encounterKey: encounter.key,
    currentDepartment: true
  });
  const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
  const { data: ProcedureLevelLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_LEVEL');
  const { data: priorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
  const { data: depTTypesLovQueryResponse } = useGetLovValuesByCodeQuery('DEPARTMENT-TYP');
  const { data: faciltyypesLovQueryResponse } = useGetLovValuesByCodeQuery('FSLTY_TYP');
  const { data: bodypartLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
  const { data: sideLovQueryResponse } = useGetLovValuesByCodeQuery('SIDES');
  const { data: departmentListResponse } = useGetDepartmentsQuery({ ...initialListRequest });
  const [listRequestPro, setListRequestPro] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'category_lkey',
        operator: 'match',
        value: procedure.categoryKey
      }
    ]
  });
  const { data: procedureQueryResponse, refetch: profetch } = useGetProcedureListQuery(
    listRequestPro,
    { skip: procedure.categoryKey == undefined }
  );
  const { data: procedurecodingQueryResponse, refetch: procfetch } = useGetProcedureCodingListQuery(
    {
      ...initialListRequest,
      filters: [
        {
          fieldName: 'procedure_key',
          operator: 'match',
          value: procedure.procedureNameKey
        }
      ]
    },
    { skip: procedure.procedureNameKey == undefined }
  );

  const department = departmentListResponse?.object.filter(
    item => item.departmentTypeLkey === '5673990729647006'
  );
  const [saveProcedures, saveProcedureMutation] = useSaveProceduresMutation();
  const { data: encounterReviewOfSystemsSummaryResponse, refetch } =
    useGetEncounterReviewOfSystemsQuery(encounter.key);
  const summaryText =
    encounterReviewOfSystemsSummaryResponse?.object
      ?.map((item, index) => {
        const systemDetail = item.systemDetailLvalue
          ? item.systemDetailLvalue.lovDisplayVale
          : item.systemDetailLkey;
        return `${index + 1} :${systemDetail}\n note : ${item.notes}`;
      })
      .join('\n') +

    (encounter?.physicalExamNote || '');
  const isSelected = rowData => {
    if (rowData && procedure && rowData.key === procedure.key) {
      return 'selected-row';
    } else return '';
  };
  const [selectedDiagnose, setSelectedDiagnose] = useState<ApPatientDiagnose>({
    ...newApPatientDiagnose,
    visitKey: encounter.key,
    patientKey: patient.key,
    createdBy: 'Administrator'
  });
  const { data: procedures, refetch: proRefetch } = useGetProceduresQuery({
    ...initialListRequest,

    filters: [
      {
        fieldName: 'encounter_key',
        operator: 'match',
        value: encounter.key
      },
      {
        fieldName: 'status_lkey',
        operator: showCanceled ? 'notMatch' : 'match',
        value: '3621690096636149'
      }
    ]
  });
  const [requestedPatientAttacment, setRequestedPatientAttacment] = useState();
  const fetchOrderAttachResponse = useFetchAttachmentQuery(
    {
      type: 'PROCEDURE_ORDER',
      refKey: procedure.key
    },
    { skip: !procedure.key }
  );
  const {
    data: fetchAttachmentByKeyResponce,
    error,
    isLoading,
    isFetching,
    isSuccess,
    refetch: refAtt
  } = useFetchAttachmentByKeyQuery(
    { key: requestedPatientAttacment },
    {
      skip: !requestedPatientAttacment
       || !procedure.key
    }
  );
  const [icdListRequest, setIcdListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });
  const { data: icdListResponseLoading } = useGetIcdListQuery(icdListRequest);

  useEffect(() => {
    if (procedure.indications != null || procedure.indications != '') {
      setindicationsDescription(prevadminInstructions => {
        const currentIcd = icdListResponseLoading?.object?.find(
          item => item.key === procedure.indications
        );

        if (!currentIcd) return prevadminInstructions;

        const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;

        return prevadminInstructions ? `${prevadminInstructions}\n${newEntry}` : newEntry;
      });
    }
  }, [procedure.indications]);
  useEffect(() => {
    if (searchKeywordicd.trim() !== '') {
      setIcdListRequest({
        ...initialListRequest,
        filterLogic: 'or',
        filters: [
          {
            fieldName: 'icd_code',
            operator: 'containsIgnoreCase',
            value: searchKeywordicd
          },
          {
            fieldName: 'description',
            operator: 'containsIgnoreCase',
            value: searchKeywordicd
          }
        ]
      });
    }
  }, [searchKeywordicd]);

  useEffect(() => {
    setListRequestPro(prev => ({
      ...prev,
      filters: [
        ...(procedure?.categoryKey
          ? [
            {
              fieldName: 'category_lkey',
              operator: 'match',
              value: procedure?.categoryKey
            }
          ]
          : [])
      ]
    }));
  }, [procedure?.categoryKey]);
  useEffect(() => {
    if (procedure.currentDepartment) {
      setProcedure({ ...procedure, departmentKey: null, faciltyLkey: null });
    }
  }, [procedure.currentDepartment]);
  useEffect(() => {
    if (patientDiagnoseListResponse.data?.object?.length > 0) {
      setSelectedDiagnose(patientDiagnoseListResponse?.data?.object[0]?.diagnosisObject);
    }
  }, [patientDiagnoseListResponse.data]);
  const handleDownload = async attachment => {
    try {
      if (!attachment?.fileContent || !attachment?.contentType || !attachment?.fileName) {
        console.error('Invalid attachment data.');
        return;
      }

      const byteCharacters = atob(attachment.fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: attachment.contentType });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = attachment.fileName;

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('File downloaded successfully:', attachment.fileName);
      // attachmentRefetch().then(() => {
      //     console.log("Refetch complete");
      // }).catch((error) => {
      //     console.error("Refetch failed:", error);
      // });
    } catch (error) {
      console.error('Error during file download:', error);
    }
  };
  const handleDownloadSelectedPatientAttachment = attachmentKey => {
    setRequestedPatientAttacment(attachmentKey);
    setActionType('download');
    handleDownload(fetchAttachmentByKeyResponce);
  };
  const OpenPerformModel = () => {
    setOpenPerformModal(true);
  };
  const ClosePerformModel = () => {
    setOpenPerformModal(false);
  };
  const handleSearchIcd = value => {
    setSearchKeywordicd(value);
  };
  const handleSave = async () => {
    try {
      await saveProcedures({
        ...procedure,
        statusLkey: '3621653475992516',
        indications: indicationsDescription,
        encounterKey: encounter.key
      })
        .unwrap()
        .then(() => {
          proRefetch();
        });
      handleClear();
      dispatch(notify('saved  Successfully'));
    } catch (error) {
      dispatch(notify('Save Failed'));
    }
  };
  const CloseCancellationReasonModel = () => {
    setOpenCancellationReasonModel(false);
  };
  const handleClear = () => {
    setProcedure({
      ...newApProcedure,

      statusLkey: '3621653475992516',
      indications: indicationsDescription,
      bodyPartLkey: null,
      sideLkey: null,
      faciltyLkey: null,
      priorityLkey: null,
      procedureLevelLkey: null,
      departmentKey: null,
      categoryKey: null,
      procedureNameKey: null
    });
  };

  const renderRowExpanded = rowData => {
    // Add this line to check children data

    return (
      <Table
        data={[rowData]} // Pass the data as an array to populate the table
        autoHeight
      >
        <Column flexGrow={2} fullText>
          <HeaderCell>Facelity</HeaderCell>
          <Cell dataKey="faciltyLvalue.lovDisplayVale">
            {rowData =>
              rowData.faciltyLkey ? rowData.faciltyLvalue.lovDisplayVale : rowData.faciltyLkey
            }
          </Cell>
        </Column>
        <Column flexGrow={2} fullText>
          <HeaderCell>Department</HeaderCell>
          <Cell dataKey="departmentKey">
            {rowData => {
              const d = department?.find(item => item.key === rowData.departmentKey);

              return d?.name || '';
            }}
          </Cell>
        </Column>
        <Column flexGrow={1} fullText>
          <HeaderCell>Current Department</HeaderCell>
          <Cell>{rowData => (rowData.currentDepartment ? 'Yes' : '')}</Cell>
        </Column>
        <Column flexGrow={1} fullText>
          <HeaderCell>Body Part</HeaderCell>
          <Cell dataKey="bodyPartLvalue.lovDisplayVale">
            {rowData =>
              rowData.bodyPartLkey ? rowData.bodyPartLvalue.lovDisplayVale : rowData.bodyPartLkey
            }
          </Cell>
        </Column>
        <Column flexGrow={1} fullText>
          <HeaderCell>Side</HeaderCell>
          <Cell dataKey="sideLvalue.lovDisplayVale">
            {rowData => (rowData.sideLkey ? rowData.sideLvalue.lovDisplayVale : rowData.sideLkey)}
          </Cell>
        </Column>
        <Column flexGrow={1} fullText>
          <HeaderCell>Note</HeaderCell>
          <Cell dataKey="notes">{rowData => rowData.notes}</Cell>
        </Column>
        <Column flexGrow={2} fullText>
          <HeaderCell>Created At</HeaderCell>
          <Cell dataKey="createdAt">
            {rowData => (rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : '')}
          </Cell>
        </Column>
        <Column flexGrow={1} fullText>
          <HeaderCell>Created By</HeaderCell>
          <Cell dataKey="createdBy" />
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

    console.log(nextExpandedRowKeys);
    setExpandedRowKeys(nextExpandedRowKeys);
  };
  const handleCancle = async () => {
    try {
      await saveProcedures({ ...procedure, statusLkey: '3621690096636149', deletedAt: Date.now() })
        .unwrap()
        .then(() => {
          proRefetch();
        });

      dispatch(notify(' procedure deleted successfully'));
      CloseCancellationReasonModel();
    } catch (error) {
      dispatch(notify(' deleted failed'));
    }
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
  const handelAddNew = () => {
    handleClear();
    setOpenDetailsModal(true)
  }
  return (
    <>
      <h5>Procedure Order</h5>
      <br />
      <div className={`top-div ${edit ? 'disabled-panel' : ''}`}>
        <div style={{ flex: 1 }}>
          <Text>Diagnose</Text>
          <textarea
            value={
              selectedDiagnose && selectedDiagnose.icdCode && selectedDiagnose.description
                ? `${selectedDiagnose.icdCode}, ${selectedDiagnose.description}`
                : ''
            }
            readOnly
            rows={5}

            className='fil-width'
          />
        </div>
        <div style={{ flex: 1 }}>
          <Text>Finding Summery</Text>
          <textarea value={summaryText} readOnly rows={5} className='fil-width' />
        </div>
      </div>
      <div className='bt-div'>
        <MyButton
          onClick={() => setOpenCancellationReasonModel(true)}
          disabled={procedure.key ? false : true}
          prefixIcon={() => <BlockIcon />}
        >Cancle</MyButton>
        <Checkbox
          checked={!showCanceled}
          onChange={() => {
            setShowCanceled(!showCanceled);
            if (showCanceled == false) setEditing(true);
          }}
        >
          Show Cancelled
        </Checkbox>
        <div className='bt-right'>
          <MyButton
            onClick={handelAddNew}
          >Add Procedure</MyButton>
        </div>
      </div>
      <Table
        autoHeight
        data={procedures?.object ?? []}
        rowKey="key"
        expandedRowKeys={expandedRowKeys} // Ensure expanded row state is correctly handled
        renderRowExpanded={renderRowExpanded} // This is the function rendering the expanded child table
        shouldUpdateScroll={false}
        onRowClick={rowData => {
          setProcedure(rowData);
          setEditing(rowData.statusLkey == '3621690096636149' ? true : false);
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

        <Column flexGrow={1} fullText>
          <HeaderCell  >
            <Translate>Procedure ID</Translate>
          </HeaderCell>
          <Cell>{rowData => rowData.procedureId}</Cell>
        </Column>

        <Column flexGrow={2} fullText>
          <HeaderCell  >
            <Translate>Procedure Name</Translate>
          </HeaderCell>
          <Cell>{rowData => rowData.procedureName}</Cell>
        </Column>

        <Column flexGrow={2} fullText>
          <HeaderCell  >
            <Translate>Scheduled Date Time</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.scheduledDateTime ? new Date(rowData.scheduledDateTime).toLocaleString() : ' '
            }
          </Cell>
        </Column>

        <Column flexGrow={2} fullText>
          <HeaderCell  >
            <Translate>Category</Translate>
          </HeaderCell>
          <Cell>
            {rowData => {
              const category = CategoryLovQueryResponse?.object?.find(item => {
                return item.key === rowData.categoryKey;
              });

              return category?.lovDisplayVale || ' ';
            }}
          </Cell>
        </Column>

        <Column flexGrow={1} fullText>
          <HeaderCell  >
            <Translate>Priority</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.priorityLkey ? rowData.priorityLvalue?.lovDisplayVale : rowData.priorityLkey
            }
          </Cell>
        </Column>
        <Column flexGrow={1} fullText>
          <HeaderCell  >
            <Translate>Level</Translate>
          </HeaderCell>
          <Cell>
            {rowData =>
              rowData.procedureLevelLkey
                ? rowData.procedureLevelLvalue?.lovDisplayVale
                : rowData.procedureLevelLkey
            }
          </Cell>
        </Column>
        <Column flexGrow={1} fullText>
          <HeaderCell  >
            <Translate>Indications</Translate>
          </HeaderCell>
          <Cell>{rowData => rowData.indications}</Cell>
        </Column>
        <Column flexGrow={1} fullText>
          <HeaderCell  >
            <Translate>Status</Translate>
          </HeaderCell>
          <Cell>{rowData => rowData.statusLvalue?.lovDisplayVale}</Cell>
        </Column>
        <Column flexGrow={1}>
          <HeaderCell  >
            <Translate>Perform</Translate>
          </HeaderCell>
          <Cell  >
            <MyButton
            size='xsmall'
              appearance='subtle'
              color="var(--primary-gray)"
              onClick={OpenPerformModel}><FontAwesomeIcon icon={faBedPulse} /></MyButton>

          </Cell>
        </Column>
        <Column flexGrow={1}>
          <HeaderCell  >
            <Translate>Attached File</Translate>
          </HeaderCell>
          <Cell  >
          <MyButton
                size='xsmall'
                appearance='subtle'
                color="var(--primary-gray)"
                onClick={() =>  handleDownloadSelectedPatientAttachment(fetchOrderAttachResponse.data.key)}><FileDownloadIcon /></MyButton>
          </Cell>
        </Column>
        <Column>
        <HeaderCell  >
            <Translate>Edit</Translate>
          </HeaderCell>
          <Cell >
            <MyButton
              size='xsmall'
              appearance='subtle'
              color="var(--primary-gray)"
              onClick={()=>setOpenDetailsModal(true)}><FontAwesomeIcon icon={faPen} /></MyButton></Cell></Column>
      </Table>
      <MyModal
        open={openPerformModal}
        setOpen={setOpenPerformModal}
        title='Perform Details'
        actionButtonFunction={handleSave}
        size='full'

        steps={[

          {
            title: "Perform", icon: faBedPulse,

          },
        ]}

        content={<Perform encounter={encounter} patient={patient} procedure={procedure} setProcedure={setProcedure} edit={edit} />}
      ></MyModal>
      <Details patient={patient} encounter={encounter} edit={edit}
        procedure={procedure} setProcedure={setProcedure}
        openDetailsModal={openDetailsModal} setOpenDetailsModal={setOpenDetailsModal} />
     
      <Modal open={openCancellationReasonModel} onClose={CloseCancellationReasonModel} overflow>
        <Modal.Title>
          <Translate>
            <h6>Confirm Cancel</h6>
          </Translate>
        </Modal.Title>
        <Modal.Body>
          <Form layout="inline" fluid>
            <MyInput
              width={200}
              column
              fieldLabel="Cancellation Reason"
              fieldType="textarea"
              fieldName="cancellationReason"
              height={120}
              record={procedure}
              setRecord={setProcedure}
            //   disabled={!editing}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Stack spacing={2} divider={<Divider vertical />}>
            <Button appearance="primary" onClick={handleCancle}>
              Cancel
            </Button>
            <Button appearance="ghost" color="cyan" onClick={CloseCancellationReasonModel}>
              Close
            </Button>
          </Stack>
        </Modal.Footer>
      </Modal>
    </>
  );
};
export default Referrals;