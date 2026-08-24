import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/hooks';
import { Panel } from 'rsuite';
import { useGetLovValuesQuery, useSaveLovValueMutation, useToggleActiveLovValueMutation } from '@/services/setupService';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApLovValues } from '@/types/model-types';
import { newApLovValues } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import './styles.less';
import {
  addFilterToListRequest,
  conjureValueBasedOnKeyFromList,
  fromCamelCaseToDBName
} from '@/utils';
import MyInput from '@/components/MyInput';
import { notify } from '@/utils/uiReducerActions';
import BackButton from '@/components/BackButton/BackButton';
import MyTable from '@/components/MyTable';
import AddEditLovValue from './AddEditLovValue';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import TranslationModal from '@/components/TranslationModal';
const LovValues = ({ lov, goBack, width }) => {
  const dispatch = useAppDispatch();
  const [lovValue, setLovValue] = useState<ApLovValues>({
    ...newApLovValues,
    valueColor: '#ffffff'
  });
  const [lovValuePopupOpen, setLovValuePopupOpen] = useState(false);
  const [isdefault, setIsDefault] = useState(false);
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
   const [showTranslationModal, setShowTranslationModal] = useState<boolean>(false);
  const [parentLovValueListRequest, setParentLovValueListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true
  });
  // Fetch lov values list response
  const { data: lovValueListResponse, isFetching } = useGetLovValuesQuery(listRequest);
  // Save lov value
  const [saveLovValue, saveLovValueMutation] = useSaveLovValueMutation();
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = lovValueListResponse?.extraNumeric ?? 0;
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [stateOfDeleteModal, setStateOfDeleteModal] = useState("deactivate");

  const [openConfirmModal, setOpenConfirmModal] = useState(false)
  const [toggleActiveLovValue] = useToggleActiveLovValueMutation();
  // Available fields for filtering
  const filterFields = [
    { label: 'Lov Code', value: 'lovCode' },
    { label: 'Value Code', value: 'valueCode' },
    { label: 'Display Value', value: 'lovDisplayVale' },
    { label: 'Value Description', value: 'valueDescription' },
    { label: 'Value Order', value: 'valueOrder' }
  ];
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && lovValue && rowData.key === lovValue.key) {
      return 'selected-row';
    } else return '';
  };
  // Effects
  // to handle filter table
  useEffect(() => {
    if (recordOfFilter['filter']) {
      handleFilterChange(recordOfFilter['filter'], recordOfFilter['value']);
    } else {
      setListRequest({
        ...initialListRequest,
        pageSize: listRequest.pageSize,
        pageNumber: 1,
        filters: [
          {
            fieldName: 'lov_key',
            operator: 'match',
            value: lov.key
          }
        ]
      });
    }
  }, [recordOfFilter]);

  useEffect(() => {
    if (lov && lov.key) {
      setListRequest(addFilterToListRequest('lov_key', 'match', lov.key, listRequest));
    }
    setLovValuePopupOpen(false);
    setLovValue({ ...newApLovValues, valueColor: '#ffffff' });
    if (lov.parentLov) {
      // load the master LOV values of the parent LOV
      setParentLovValueListRequest({
        ...addFilterToListRequest('lov_key', 'match', lov.parentLov, parentLovValueListRequest),
        ignore: false
      });
    }
  }, [lov]);

  useEffect(() => {
    if (lovValueListResponse?.object) {
      const foundDefault = lovValueListResponse.object.find(Default => {
        return Default.isdefault === true;
      });
      if (foundDefault?.key != null) {
        setIsDefault(true);
      } else {
        setIsDefault(false);
      }
    }
  }, [lovValueListResponse]);

  useEffect(() => {
    if (saveLovValueMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveLovValueMutation.data]);

  // handle click on add new button
  const handleLovValueNew = () => {
    setLovValuePopupOpen(true);
    setLovValue({ ...newApLovValues, lovKey: lov.key, lovCode: lov.lovCode });
  };
  // handle save lov value
  const handleLovValueSave = () => {
    setLovValuePopupOpen(false);
    saveLovValue(lovValue)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'The LOV value has been saved successfully', sev: 'success' }));
        setShowTranslationModal(true);
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to save this LOV value', sev: 'error' }));
      });
  };
  // handle filter table
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'containsIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({
        ...initialListRequest,
        filters: [
          {
            fieldName: 'lov_key',
            operator: 'match',
            value: lov.key
          }
        ]
      });
    }
  };
  // Handle page change in navigation
  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };
  // Handle change rows per page in navigation
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };
  const handleToggleActive = () => {
    toggleActiveLovValue(lovValue.key)
      .unwrap()
      .then(() => {
        dispatch(
          notify({
            msg: lovValue.isValid
              ? 'LOV Value deactivated successfully'
              : 'LOV Value activated successfully',
            sev: 'success'
          })
        );

        setListRequest(prev => ({
          ...prev,
          timestamp: new Date().getTime()
        }));
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Failed to update LOV Value status',
            sev: 'error'
          })
        );
      });
         setOpenConfirmModal(false);
  };
  // Filter table
  const filters = () => (
    <Form layout="inline" fluid>
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={updatedRecord => {
          setRecordOfFilter({
            ...recordOfFilter,
            filter: updatedRecord.filter,
            value: ''
          });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
      />
      <MyInput
        fieldName="value"
        fieldType="text"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Search"
      />
    </Form>
  );

  // Icons column (Edite, reactive/Deactivate)
  const iconsForActions = (rowData: ApLovValues) => (
    <div className="container-of-icons">
      {/* open edit lov value when click on this icon */}
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setLovValuePopupOpen(true)}
      />
      {/* deactivate/activate  when click on one of these icon */}
      {!rowData?.isValid ? (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"

          onClick={() => {
            setStateOfDeleteModal("reactivate");
            setOpenConfirmModal(true)
          }}
        />
      ) : (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteModal("deactivate");

            setOpenConfirmModal(true)
          }}
        />
      )}
    </div>
  );
  //Table columns
  const tableColumns = [
    {
      key: 'lovCode',
      title: <Translate>Lov Code</Translate>,
      flexGrow: 4
    },
    {
      key: 'valueCode',
      title: <Translate>Value Code</Translate>,
      flexGrow: 4
    },
    {
      key: 'lovDisplayVale',
      title: <Translate>Display Vaule</Translate>,
      flexGrow: 4
    },
    {
      key: 'valueDescription',
      title: <Translate>Value Description</Translate>,
      flexGrow: 4
    },
    {
      key: 'valueOrder',
      title: <Translate>Value Order</Translate>,
      flexGrow: 4
    },
    {
      key: 'isDefault',
      title: <Translate>Is Default</Translate>,
      flexGrow: 4,
      render: rowData => <span>{rowData.isdefault ? 'Yes' : 'No'}</span>
    },
    {
      key: 'parentLOVValue',
      title: <Translate>Parent LOV Value</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            lovValueListResponse?.object ?? [],
            rowData.parentValueId,
            'displayVale'
          )}
        </span>
      )
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
      {lov && lov.key && (
        <Panel
          header={
            <p className="title-lov-values">
              <Translate> List of Values for </Translate> <i>{lov?.lovName ?? ''}</i>
            </p>
          }
        >
          <div className="container-of-header-actions-lov-values">
            <BackButton onClick={goBack} appearance="ghost" />
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={handleLovValueNew}
              width="109px"
            >
              Add New
            </MyButton>
          </div>
          <MyTable
            height={450}
            data={lovValueListResponse?.object ?? []}
            loading={isFetching}
            columns={tableColumns}
            rowClassName={isSelected}
            filters={filters()}
            onRowClick={rowData => {
              setLovValue(rowData);
            }}
            sortColumn={listRequest.sortBy}
            sortType={listRequest.sortType}
            onSortChange={(sortBy, sortType) => {
              if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
            }}
            page={pageIndex}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
          <AddEditLovValue
            open={lovValuePopupOpen}
            setOpen={setLovValuePopupOpen}
            lov={lov}
            lovValue={lovValue}
            setLovValue={setLovValue}
            handleSave={handleLovValueSave}
            isdefault={isdefault}
            width={width}
          />
        </Panel>
      )}

      {(!lov || !lov.key) && (
        <BackButton
          text="No Valid Lov Header Selected, Go Back"
          appearance="ghost"
          onClick={goBack}
        />
      )}
      <DeletionConfirmationModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        itemToDelete="Price List"
        actionButtonFunction={handleToggleActive}
        actionType={stateOfDeleteModal}
      />
       <TranslationModal
        open={showTranslationModal}
        setOpen={setShowTranslationModal}
        fields={[
          {
            fieldName: 'Display Value',
            value: lovValue.lovDisplayVale
          }
        ]}
      />
    </div>

  );
};

export default LovValues;
