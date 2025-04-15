import React, { useState } from 'react';
import {
  type ApPatient,
  type ApPatientAdministrativeWarnings
} from '@/types/model-types';
import { newApPatientAdministrativeWarnings } from '@/types/model-types-constructor';
import { Modal, Form, Input, ButtonToolbar, IconButton, Panel, Table, Pagination } from 'rsuite';
import { Check } from '@rsuite/icons';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import {
  // useGetLovValuesByCodeQuery,
  useGetPatientAdministrativeWarningsQuery,
  useSavePatientAdministrativeWarningsMutation,
  useUpdatePatientAdministrativeWarningsMutation,
  useDeletePatientAdministrativeWarningsMutation
} from '@/services/patientService';
import { initialListRequest, type ListRequest } from '@/types/types';
import { fromCamelCaseToDBName } from '@/utils';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import CheckOutlineIcon from '@rsuite/icons/CheckOutline';
import ReloadIcon from '@rsuite/icons/Reload';
import CloseIcon from '@rsuite/icons/Close';

const { Column, HeaderCell, Cell } = Table;

interface AdministrativeWarningsModalProps {
  open: boolean;
  onClose: () => void;
  localPatient: ApPatient;
  validationResult: any;
}

const AdministrativeWarningsModal: React.FC<AdministrativeWarningsModalProps> = ({
  open,
  onClose,
  localPatient,
  validationResult
}) => {
  const dispatch = useAppDispatch();
  const [administrativeWarningDetails, setAdministrativeWarningDetails] = useState('');
  const [patientAdministrativeWarnings, setPatientAdministrativeWarnings] =
    useState<ApPatientAdministrativeWarnings>({
      ...newApPatientAdministrativeWarnings
    });
  const [selectedPatientAdministrativeWarnings, setSelectedPatientAdministrativeWarnings] =
    useState<any>({
      ...newApPatientAdministrativeWarnings
    });
  const [selectedRowId, setSelectedRowId] = useState(null);

  // Fetch LOV data
  const { data: administrativeWarningsLovQueryResponse } =
    useGetLovValuesByCodeQuery('ADMIN_WARNINGS');

  // Mutations
  const [savePatientAdministrativeWarnings] = useSavePatientAdministrativeWarningsMutation();
  const [updatePatientAdministrativeWarnings] = useUpdatePatientAdministrativeWarningsMutation();
  const [deletePatientAdministrativeWarnings] = useDeletePatientAdministrativeWarningsMutation();

  // List request for warnings
  const [warningsAdmistritiveListRequest, setWarningsAdmistritiveListRequest] =
    useState<ListRequest>({
      ...initialListRequest,
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: localPatient.key || undefined
        },
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        }
      ]
    });

  // Fetch warnings
  const { data: warnings, refetch: warningsRefetch } = useGetPatientAdministrativeWarningsQuery(
    warningsAdmistritiveListRequest
  );

  // Handle filter change
  const handleFilterChangeInWarning = (fieldName, value) => {
    if (value) {
      setWarningsAdmistritiveListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'containsIgnoreCase',
          String(value),
          warningsAdmistritiveListRequest
        )
      );
    } else {
      setWarningsAdmistritiveListRequest({
        ...warningsAdmistritiveListRequest,
        filters: [
          {
            fieldName: 'patient_key',
            operator: 'match',
            value: localPatient.key || undefined
          },
          {
            fieldName: 'deleted_at',
            operator: 'isNull',
            value: undefined
          }
        ]
      });
    }
  };

  // Helper function for filter
  const addFilterToListRequest = (fieldName, operator, value, listRequest) => {
    const newFilters = listRequest.filters.filter(
      filter =>
        filter.fieldName !== fieldName &&
        filter.fieldName !== 'patient_key' &&
        filter.fieldName !== 'deleted_at'
    );

    return {
      ...listRequest,
      filters: [
        ...newFilters,
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: localPatient.key || undefined
        },
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        },
        {
          fieldName,
          operator,
          value
        }
      ]
    };
  };

  // Check if row is selected
  const isSelected = rowData => {
    if (
      rowData &&
      selectedPatientAdministrativeWarnings &&
      rowData.key === selectedPatientAdministrativeWarnings.key
    ) {
      return 'selected-row';
    } else return '';
  };

  // Handle save
  const handleSavePatientAdministrativeWarnings = () => {
    savePatientAdministrativeWarnings({
      ...patientAdministrativeWarnings,
      description: administrativeWarningDetails,
      patientKey: localPatient.key
    })
      .unwrap()
      .then(() => {
        setPatientAdministrativeWarnings({
          ...patientAdministrativeWarnings,
          description: '',
          warningTypeLkey: undefined
        });
        setAdministrativeWarningDetails('');
        warningsRefetch();
        dispatch(notify('Activated Successfully'));
        setPatientAdministrativeWarnings({ ...newApPatientAdministrativeWarnings });
      });
  };

  // Handle resolve
  const handleUpdateAdministrativeWarningsResolved = () => {
    updatePatientAdministrativeWarnings({
      ...selectedPatientAdministrativeWarnings,
      dateResolved: new Date().toISOString(),
      resolvedBy: 'keyForCurrentUser',
      isValid: false
    })
      .unwrap()
      .then(() => {
        warningsRefetch();
        dispatch(notify('Resolved Successfully'));
        setSelectedPatientAdministrativeWarnings({ ...newApPatientAdministrativeWarnings });
      });
  };

  // Handle undo resolve
  const handleUpdateAdministrativeWarningsUnDoResolved = () => {
    updatePatientAdministrativeWarnings({
      ...selectedPatientAdministrativeWarnings,
      resolutionUndoDate: new Date().toISOString(),
      resolvedUndoBy: 'keyForCurrentUser',
      isValid: true
    })
      .unwrap()
      .then(() => {
        warningsRefetch();
        dispatch(notify('Activated Successfully'));
        setSelectedPatientAdministrativeWarnings({ ...newApPatientAdministrativeWarnings });
      });
  };

  // Handle delete
  const handleDeletePatientAdministrativeWarnings = () => {
    deletePatientAdministrativeWarnings({
      ...selectedPatientAdministrativeWarnings
    })
      .unwrap()
      .then(() => {
        warningsRefetch();
        dispatch(notify('Deleted Successfully'));
        setSelectedPatientAdministrativeWarnings({ ...newApPatientAdministrativeWarnings });
      });
  };

  // Update filters when patient changes
  React.useEffect(() => {
    const updatedFilters = [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: localPatient.key || undefined
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ];
    setWarningsAdmistritiveListRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));
  }, [localPatient.key]);

  return (
    <Modal size="lg" open={open} onClose={onClose}>
      <Modal.Header>
        <Modal.Title>Administrative Warnings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form fluid>
          <MyInput
            vr={validationResult}
            required
            fieldLabel="Warning Type"
            fieldType="select"
            fieldName="warningTypeLkey"
            selectData={administrativeWarningsLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={patientAdministrativeWarnings}
            setRecord={setPatientAdministrativeWarnings}
          />

          <Input
            onChange={setAdministrativeWarningDetails}
            as="textarea"
            rows={3}
            placeholder="Details"
            style={{ width: 357 }}
          />
        </Form>
        <br />
        <ButtonToolbar>
          <IconButton
            appearance="primary"
            color="violet"
            icon={<Check />}
            onClick={handleSavePatientAdministrativeWarnings}
          >
            <Translate>Add</Translate>
          </IconButton>

          <IconButton
            appearance="primary"
            color="cyan"
            disabled={!selectedPatientAdministrativeWarnings.isValid}
            icon={<CheckOutlineIcon />}
            onClick={handleUpdateAdministrativeWarningsResolved}
          >
            <Translate>Resolve</Translate>
          </IconButton>
          <IconButton
            appearance="primary"
            disabled={
              selectedPatientAdministrativeWarnings.isValid == undefined ||
              selectedPatientAdministrativeWarnings.isValid
            }
            icon={<ReloadIcon />}
            onClick={handleUpdateAdministrativeWarningsUnDoResolved}
          >
            <Translate>Undo Resolve</Translate>
          </IconButton>
        </ButtonToolbar>
        <br />
        <Panel>
          <Table
            height={310}
            sortColumn={warningsAdmistritiveListRequest.sortBy}
            sortType={warningsAdmistritiveListRequest.sortType}
            onSortColumn={(sortBy, sortType) => {
              if (sortBy)
                setWarningsAdmistritiveListRequest({
                  ...warningsAdmistritiveListRequest,
                  sortBy,
                  sortType
                });
            }}
            headerHeight={80}
            rowHeight={50}
            bordered
            cellBordered
            onRowClick={rowData => {
              setSelectedPatientAdministrativeWarnings(rowData);
              setSelectedRowId(rowData.key);
            }}
            rowClassName={isSelected}
            data={warnings?.object ?? []}
          >
            <Column sortable flexGrow={3}>
              <HeaderCell>
                <Input
                  onChange={e => handleFilterChangeInWarning('warningTypeLvalue.lovDisplayVale', e)}
                />
                <Translate>Warning Type</Translate>
              </HeaderCell>

              <Cell dataKey="warningTypeLvalue.lovDisplayVale" />
            </Column>
            <Column sortable flexGrow={3}>
              <HeaderCell>
                <Input onChange={e => handleFilterChangeInWarning('description', e)} />
                <Translate>Description</Translate>
              </HeaderCell>
              <Cell dataKey="description" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Input onChange={e => handleFilterChangeInWarning('createdAt', e)} />
                <Translate> Addition Date</Translate>
              </HeaderCell>
              <Cell dataKey="createdAt" />
            </Column>
            <Column sortable flexGrow={3}>
              <HeaderCell>
                <Input onChange={e => handleFilterChangeInWarning('createdBy', e)} />
                <Translate> Added By</Translate>
              </HeaderCell>
              <Cell dataKey="createdBy" />
            </Column>
            <Column sortable flexGrow={3}>
              <HeaderCell>
                <Translate> Status </Translate>
              </HeaderCell>

              <Cell dataKey="isValid">{rowData => (rowData.isValid ? 'Active' : 'Resolved')}</Cell>
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Input onChange={e => handleFilterChangeInWarning('dateResolved', e)} />
                <Translate> Resolution Date</Translate>
              </HeaderCell>
              <Cell dataKey="dateResolved" />
            </Column>
            <Column sortable flexGrow={3}>
              <HeaderCell>
                <Input onChange={e => handleFilterChangeInWarning('resolvedBy', e)} />
                <Translate> Resolved By </Translate>
              </HeaderCell>
              <Cell dataKey="resolvedBy" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Input onChange={e => handleFilterChangeInWarning('resolutionUndoDate', e)} />
                <Translate> Resolution Undo Date</Translate>
              </HeaderCell>
              <Cell dataKey="resolutionUndoDate" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Input onChange={e => handleFilterChangeInWarning('resolvedUndoBy', e)} />
                <Translate>Resolution Undo By</Translate>
              </HeaderCell>
              <Cell dataKey="resolvedUndoBy" />
            </Column>
            <Column sortable flexGrow={2}>
              <HeaderCell>
                <Translate>Delete</Translate>
              </HeaderCell>
              <Cell>
                {rowData => (
                  <div className="deleteButton">
                    <button
                      onClick={() => {
                        setSelectedPatientAdministrativeWarnings(rowData);
                        handleDeletePatientAdministrativeWarnings();
                      }}
                      className="deleteButton"
                      style={{
                        color: selectedRowId === rowData.key ? 'black' : 'gray',
                        background: 'transparent',
                        cursor: selectedRowId === rowData.key ? 'pointer' : 'not-allowed'
                      }}
                      disabled={selectedRowId !== rowData.key}
                    >
                      <CloseIcon />
                    </button>
                  </div>
                )}
              </Cell>
            </Column>
          </Table>
          <div style={{ padding: 20 }}>
            <Pagination
              prev
              next
              first
              last
              ellipsis
              boundaryLinks
              maxButtons={5}
              size="xs"
              layout={['limit', '|', 'pager']}
              limitOptions={[5, 15, 30]}
              limit={warningsAdmistritiveListRequest.pageSize}
              activePage={warningsAdmistritiveListRequest.pageNumber}
              onChangePage={pageNumber => {
                setWarningsAdmistritiveListRequest({
                  ...warningsAdmistritiveListRequest,
                  pageNumber
                });
              }}
              onChangeLimit={pageSize => {
                setWarningsAdmistritiveListRequest({
                  ...warningsAdmistritiveListRequest,
                  pageSize
                });
              }}
              total={warnings?.extraNumeric ?? 0}
            />
          </div>
        </Panel>
      </Modal.Body>
    </Modal>
  );
};

export default AdministrativeWarningsModal;
