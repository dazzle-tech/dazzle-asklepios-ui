import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import { Form, Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { useAppDispatch } from '@/hooks';
import { HiDocumentDuplicate } from 'react-icons/hi2';
import { notify } from '@/utils/uiReducerActions';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import './styles.less';


import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddEditRule from './AddEditRule';
import LinkedFacility from './LinkedFacilities';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import {
  useGetDuplicationCandidatesQuery,
  useDeactivateDuplicationCandidateMutation,
  useReactivateDuplicationCandidateMutation,
  useCreateDuplicationCandidateMutation,
  useUpdateDuplicationCandidateMutation,
  useGetAvailableForRoleQuery
} from '@/services/potintialDuplicateService';
import { newCandidate } from '@/types/model-types-constructor-new';
import { Candidate } from '@/types/model-types-new';
import MyInput from '@/components/MyInput';
import { useEnumByName } from '@/services/enumsApi';

const PotintialDuplicate = () => {
  const dispatch = useAppDispatch();
  const [popupOpen, setPopupOpen] = useState(false);
  const [OpenFacilityModal, setOpenFacilityModal] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const fieldsEnum = useEnumByName("DuplicationField");

  const defaultFields: Record<string, boolean> = fieldsEnum.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {} as Record<string, boolean>);
  console.log("def", defaultFields);
  const [candidate, setCandidate] = useState<Candidate>({ ...newCandidate, fields: defaultFields });
  console.log("candidate", candidate)

  const [openConfirmDeleteRole, setOpenConfirmDeleteRole] = useState<boolean>(false);
  const [stateOfDeleteRole, setStateOfDeleteRole] = useState<string>('delete');


  // Mutations
  const [updateCandidate] = useUpdateDuplicationCandidateMutation();
  const [createCandidate] = useCreateDuplicationCandidateMutation();
  const [deactivateCandidate] = useDeactivateDuplicationCandidateMutation();
  const [reactivateCandidate] = useReactivateDuplicationCandidateMutation();
  const { data:facility } = useGetAvailableForRoleQuery(candidate.id ,{skip:!candidate.id} );
  const [searchTerm, setSearchTerm] = useState({ search: "" });

  const { data: candidateList, isLoading, refetch } = useGetDuplicationCandidatesQuery(searchTerm?.search || undefined);

  // Header page setUp
  const divContent = (
    "Potintial Duplicate"

  );
  dispatch(setPageCode('Potintial_Duplicate'));
  dispatch(setDivContent(divContent));

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && candidate && rowData.id === candidate.id) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (Edit,Linked facilities, reactive/Deactivate)
  const iconsForActions = (rowData: Candidate) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setPopupOpen(true)}
      />
      {rowData?.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteRole('deactivate');
            setOpenConfirmDeleteRole(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteRole('reactivate');
            setOpenConfirmDeleteRole(true);
          }}
        />
      )}
      <HiDocumentDuplicate
        className="icons-style"
        title="Linked Facilities"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setOpenFacilityModal(true)}
      />
    </div>
  );

  // Table columns
  const duplicationFields = useEnumByName("DuplicationField") || [];

  const dynamicFieldColumns = duplicationFields.map(field => ({
    key: field,
    title: <Translate>{field.replace(/_/g, ' ')}</Translate>,
    render: rowData => (rowData.fields?.[field] ? 'True' : 'False')
  }));

  const tableColumns = [
    { key: 'role', title: <Translate>Role</Translate>, render: rowData => rowData.role },
    ...dynamicFieldColumns,
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: rowData => (rowData.isActive ? 'active' : 'inactive')
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];


  // Pagination values
  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handlePageChange = (_: unknown, newPage: number) => {
    setPageIndex(newPage);
  };
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPageIndex(0);
  };
  const totalCount = candidateList?.length ?? 0;

  // Sorting state
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortType, setSortType] = useState<'asc' | 'desc' | null>(null);

  // Sorting logic
  const sortedData = React.useMemo(() => {
    if (!candidateList) return [];
    if (!sortBy) return candidateList;

    return [...candidateList].sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'string') {
        return sortType === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      if (typeof valA === 'number' || typeof valA === 'boolean') {
        return sortType === 'asc'
          ? (valA as any) - (valB as any)
          : (valB as any) - (valA as any);
      }
      return 0;
    });
  }, [candidateList, sortBy, sortType]);

  // Pagination on sorted data
  const paginatedData = sortedData.slice(
    pageIndex * rowsPerPage,
    pageIndex * rowsPerPage + rowsPerPage
  );

  // handle click on add new button
  const handleNew = () => {
    setCandidate({ ...newCandidate });
    setPopupOpen(true);
  };

  // handle save role
  const handleSave = async () => {
    console.log("Candidate in Save", candidate)
    setPopupOpen(false);
    if (!candidate.id) {
      try {

        await createCandidate(candidate).unwrap().then(() => {
          refetch();
        });
        dispatch(notify({ msg: 'The Role has been created successfully', sev: 'success' }));
      } catch (error) {
        if (error.data && error.data.message) {
          dispatch(notify(error.data.message));
        } else {
          dispatch(notify({ msg: error, sev: "error" }));
        }
      }
    } else {
      try {
        await updateCandidate({
          id: candidate.id,
          data: {
            fields: candidate.fields,
            isActive: candidate.isActive,
          }
        }).unwrap()

          .then(() => {
            refetch();
          });
        dispatch(notify({ msg: 'The Role has been updated successfully', sev: 'success' }));
      } catch (error) {
        if (error.data && error.data.message) {
          dispatch(notify(error.data.message));
        } else {
          dispatch(notify({ msg: error, sev: "error" }));
        }
      }
    }
  };

  // handle Deactivate
  const handleDeactivate = () => {
    setOpenConfirmDeleteRole(false);
    deactivateCandidate(candidate.id)
      .unwrap()
      .then(() => {
        refetch();
        dispatch(notify({ msg: 'The Role was successfully Deactivated', sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Faild to Deactivate this Role', sev: 'error' }));
      });
  };

  // handle Reactivate
  const handleReactivate = () => {
    setOpenConfirmDeleteRole(false);
    reactivateCandidate(candidate.id)
      .unwrap()
      .then(() => {
        refetch();
        dispatch(notify({ msg: 'The Role was successfully Reactivated', sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Faild to Reactivate this Role', sev: 'error' }));
      });
  };

  // Effects
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  // change the width variable when the size of window is changed
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const filters = () => {
    return (
      <>
        <Form layout="inline" fluid className="date-filter-form">
          <MyInput
            column
            width='10vw'
            showLabel={false}
            fieldName="search"
            record={searchTerm}
            setRecord={setSearchTerm}
            placeholder="Search by Role"
          />

        </Form>


      </>
    );
  };
  return (
    <Panel>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleNew}
          width="109px"
        >
          Add New
        </MyButton>
      </div>
      <MyTable
        filters={filters()}
        height={450}
        data={paginatedData ?? []}
        // loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setCandidate(rowData);
        }}
        sortColumn={sortBy || undefined}
        sortType={sortType || undefined}
        onSortChange={(column, type) => {
          setSortBy(column);
          setSortType(type);
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
      <AddEditRule
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        candidate={candidate}
        setCandidate={setCandidate}
        handleSave={handleSave}
      />
      <LinkedFacility
        open={OpenFacilityModal}
        setOpen={setOpenFacilityModal}
        width={width}
        Candidate={candidate}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteRole}
        setOpen={setOpenConfirmDeleteRole}
        itemToDelete="Role"
        actionButtonFunction={
          stateOfDeleteRole == 'deactivate' ? handleDeactivate : handleReactivate
        }
        actionType={stateOfDeleteRole}
      />
    </Panel>
  );
};

export default PotintialDuplicate;
