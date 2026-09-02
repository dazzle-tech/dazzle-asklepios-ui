import ChildModal from '@/components/ChildModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useCreateDiagnosticTestProfileMutation,
  useGetDiagnosticTestProfilesByTestIdQuery,
  useUpdateDiagnosticTestProfileMutation,
  useToggleDiagnosticTestActiveMutation
} from '@/services/setup/diagnosticTest/diagnosticTestProfileService';
import { useGetLovAllValuesQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import React, { useEffect, useState } from 'react';
import { FaChartLine, FaUndo } from 'react-icons/fa';
import { MdDelete, MdEdit } from 'react-icons/md';
import { Badge, Form, Dropdown, Input, InputGroup } from 'rsuite';
import AddNormalRange from './AddNormalRange';
import './styles.less';
import {
  useCreateDiagnosticTestNormalRangeMutation,
  useDeleteDiagnosticTestNormalRangeMutation,
  useGetDiagnosticTestNormalRangesByProfileTestIdQuery,
  useUpdateDiagnosticTestNormalRangeMutation
} from '@/services/setup/diagnosticTest/diagnosticTestNormalRangeService';
import {
  newDiagnosticTestNormalRange,
  newDiagnosticTestProfile
} from '@/types/model-types-constructor-new';
import { DiagnosticTestNormalRange, DiagnosticTestProfile } from '@/types/model-types-new';
import { initialListRequestAllValues, initialListRequest } from '@/types/types';
import { conjureValueBasedOnKeyFromList, formatEnumString } from '@/utils';
import { useEnumOptions } from '@/services/enumsApi';
import SearchIcon from '@rsuite/icons/Search';
import { useGetLovsQuery } from '@/services/setupService';
import DiagnosticTestNormalRangeTable from './DiagnosticTestNormalRangeTable';

const Profile = ({
  open,
  setOpen,
  diagnosticsTest,
  openNormalRanges,
  selectedProfile
}) => {
  const dispatch = useAppDispatch();
  const [diagnosticsTestProfile, setDiagnosticsTestProfile] = useState<DiagnosticTestProfile>({
    ...newDiagnosticTestProfile
  });

  const [openConfirmDeleteProfile, setOpenConfirmDeleteProfile] = useState<boolean>(false);
  const [openConfirmDeleteProfileNormalRange, setOpenConfirmDeleteProfileNormalRange] =
    useState<boolean>(false);
  const [openChild, setOpenChild] = useState<boolean>(false);
  const [openSubChild, setOpenSubChild] = useState<boolean>(false);


  const [searchKeyword, setSearchKeyword] = useState('');

  const [diagnosticTestNormalRange, setDiagnosticTestNormalRange] =
    useState<DiagnosticTestNormalRange>({
      ...newDiagnosticTestNormalRange
    });

  const [createDiagnosticTestNormalRange] = useCreateDiagnosticTestNormalRangeMutation();
  const [updateDiagnosticTestNormalRange] = useUpdateDiagnosticTestNormalRangeMutation();

  // Fetch units Lov response
  const { data: unitsLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');

  // list of value new function
  const { data: lovValues } = useGetLovAllValuesQuery({ ...initialListRequestAllValues });

  // Fetch LOV list for search
  const { data: lovListResponseData } = useGetLovsQuery({
    ...initialListRequest,
    pageSize: 1000
  });

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  const {
    data: allDiagnosticTestProfiles,
    refetch: refetchDiagnosticsTestProfile,
    isFetching
  } = useGetDiagnosticTestProfilesByTestIdQuery(
    {
      testId: diagnosticsTest?.id,
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort
    },
    { skip: !diagnosticsTest?.id }
  );

  const resultType = useEnumOptions('TestResultType');


  const [addTestProfile] = useCreateDiagnosticTestProfileMutation();
  const [updateTestProfile] = useUpdateDiagnosticTestProfileMutation();
  const [toggleProfileActive] = useToggleDiagnosticTestActiveMutation();
  const [deleteNormalRange] = useDeleteDiagnosticTestNormalRangeMutation();

  // Filter LOV data based on search
  const filteredData = (lovListResponseData?.object ?? []).filter(item =>
    `${item.lovCode} ${item.lovName}`.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  // Display selected LOV
  const resultLovDisplay = (() => {
    if (!diagnosticsTestProfile?.listOfValueId) return '';
    if (!lovListResponseData?.object?.length) return '';

    const found = lovListResponseData.object.find(
      x => String(x.key) === String(diagnosticsTestProfile.listOfValueId)
    );

    return found ? `${found.lovCode}, ${found.lovName}` : '';
  })();

  const isSelected = rowData => {
    if (rowData && diagnosticsTestProfile && rowData.id === diagnosticsTestProfile.id) {
      return 'selected-row';
    } else return '';
  };


  const iconsForActions = (rowData: any) => {
    const isTextType = String(rowData?.resultType ?? '').toUpperCase() === 'TEXT';

    return (
      <div className="container-of-icons" onClick={e => e.stopPropagation()}>
        {!rowData?.isDefault &&
          (rowData?.isActive ? (
            <MdDelete
              title="Deactivate"
              size={24}
              fill="var(--primary-pink)"
              className="icons-style"
              onClick={e => {
                e.stopPropagation();
                setDiagnosticsTestProfile(rowData);
                setOpenConfirmDeleteProfile(true);
              }}
            />
          ) : (
            <FaUndo
              title="Activate"
              size={24}
              fill="var(--primary-gray)"
              className="icons-style"
              onClick={e => {
                e.stopPropagation();
                setDiagnosticsTestProfile(rowData);
                setOpenConfirmDeleteProfile(true);
              }}
            />
          ))}

        {!isTextType && (
          <FaChartLine
            className="icons-style"
            title="Test Normal Ranges"
            size={21}
            fill="var(--primary-gray)"
            onClick={e => {
              e.stopPropagation();
              setDiagnosticsTestProfile(rowData);
              setOpenChild(true);
            }}
          />
        )}
      </div>
    );
  };
  useEffect(() => {
    if (!open) {
      setDiagnosticsTestProfile({ ...newDiagnosticTestProfile });
      setDiagnosticTestNormalRange({ ...newDiagnosticTestNormalRange });
      setOpenConfirmDeleteProfile(false);
      setOpenConfirmDeleteProfileNormalRange(false);
      setOpenChild(false);
      setOpenSubChild(false);
      setSearchKeyword('');
    }
  }, [open]);

  const tableColumns = [
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      flexGrow: 3,
      render: (rowData: any) =>
        rowData.isDefault ? (
          <div>
            <Badge color="blue" content="Default">
              <span className="insurance-badge-text" style={{ fontSize: '14px' }}>
                {rowData.name}
              </span>
            </Badge>
          </div>
        ) : (
          <span>{rowData.name}</span>
        )
    },
    {
      key: 'LovValues',
      title: <Translate>Result Unit</Translate>,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            unitsLovQueryResponse?.object ?? [],
            rowData.resultUnit,
            'lovDisplayVale'
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


  const isEditMode = Boolean(diagnosticsTestProfile?.id);

  const handleSave = async () => {
    if (!diagnosticsTestProfile.resultType) {
      dispatch(notify({ msg: 'Result Type is required', sev: 'error' }));
      return;
    }

    try {
      if (diagnosticsTestProfile.id != null) {
        const { isActive, isDefault, ...payload } = diagnosticsTestProfile;

        await updateTestProfile({
          id: diagnosticsTestProfile.id,
          body: {
            ...payload,
            testId: diagnosticsTest.id,
            listOfValueId: diagnosticsTestProfile.listOfValueId
          }
        }).unwrap();

        dispatch(notify({ msg: 'Updated Successfully', sev: 'success' }));
      } else {
        const { id, isActive, isDefault, ...payload } = diagnosticsTestProfile;

        await addTestProfile({
          ...payload,
          testId: diagnosticsTest.id,
          listOfValueId: diagnosticsTestProfile.listOfValueId
        }).unwrap();

        dispatch(notify({ msg: 'Added Successfully', sev: 'success' }));
      }

      await refetchDiagnosticsTestProfile();

      if (diagnosticsTestProfile.id) {
      } else {
        setDiagnosticsTestProfile({ ...newDiagnosticTestProfile });
        setSearchKeyword('');
      }
    } catch (error: any) {
      const rawMessage =
        error?.data?.properties?.message ||
        error?.data?.message ||
        error?.data?.detail ||
        'Unexpected error';

      const cleanedMessage = rawMessage.replace(/^error\./, '');

      dispatch(
        notify({
          msg: cleanedMessage,
          sev: 'error'
        })
      );
    }
  };

  const handleToggleActive = async () => {
    if (diagnosticsTestProfile.isDefault) {
      dispatch(
        notify({
          msg: 'Default profile cannot be deactivated',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      setOpenConfirmDeleteProfile(false);

      await toggleProfileActive(diagnosticsTestProfile.id).unwrap();

      dispatch(
        notify({
          msg: diagnosticsTestProfile.isActive
            ? 'Profile Deactivated Successfully'
            : 'Profile Activated Successfully',
          sev: 'success'
        })
      );

      await refetchDiagnosticsTestProfile();
      setDiagnosticsTestProfile({ ...newDiagnosticTestProfile });
    } catch (e) {
      dispatch(
        notify({
          msg: 'Failed to change profile status',
          sev: 'error'
        })
      );
    }
  };

  const handleRemoveNormalRange = () => {
    setOpenConfirmDeleteProfileNormalRange(false);
    deleteNormalRange(diagnosticTestNormalRange.id)
      .unwrap()
      .then(() => {
        refetchDiagnosticsTestProfile();
        setDiagnosticTestNormalRange({
          ...newDiagnosticTestNormalRange
        });
        dispatch(notify({ msg: 'Deleted Successfully ', sev: 'success' }));
      });
  };

  const isLovType = diagnosticsTestProfile.resultType?.toUpperCase() === 'LOV';
  const isNumberType = diagnosticsTestProfile?.resultType === 'NUMBER';
  const isTextType = diagnosticsTestProfile?.resultType?.toUpperCase() === 'TEXT';

  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div className="profile-form-header">
              <div className="profile-fields-main-container">
                <MyInput
                  required
                  column
                  fieldName="name"
                  record={diagnosticsTestProfile}
                  setRecord={setDiagnosticsTestProfile}
                  width={'9vw'}
                />
                <MyInput
                  required
                  column
                  fieldName="resultType"
                  fieldType="select"
                  selectData={resultType ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={diagnosticsTestProfile}
                  setRecord={setDiagnosticsTestProfile}
                  width={'9vw'}
                />

              </div>
              <div className='profile-lov-unit-main-container'>
                {!isTextType && isNumberType && (
                  <MyInput
                    column
                    menuMaxHeight={200}
                    width={'100%'}
                    fieldName="resultUnit"
                    fieldType="select"
                    selectData={unitsLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    disableByField='isValid'
                    selectDataValue="key"
                    record={diagnosticsTestProfile}
                    setRecord={setDiagnosticsTestProfile}
                    required
                  />
                )}

                {isLovType && (
                  <div className="lov-block">
                    <div className="container-of-menu-diagnostic">
                      <InputGroup className="search-input-diagnostic" inside>
                        <Input placeholder="Search LOV" value={searchKeyword} onChange={setSearchKeyword} />
                        <InputGroup.Button>
                          <SearchIcon />
                        </InputGroup.Button>
                      </InputGroup>

                      {searchKeyword && (
                        <Dropdown.Menu className="menu-diagnostic">
                          {filteredData.map(mod => (
                            <Dropdown.Item
                              key={mod.key}
                              onClick={() => {
                                setDiagnosticsTestProfile(prev => ({ ...prev, listOfValueId: mod.key }));
                                setSearchKeyword('');
                              }}
                            >
                              <span>{mod.lovCode}</span>
                              <span>{mod.lovName}</span>
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      )}
                    </div>

                    <Input
                      className="search-result-diagnostic"
                      disabled
                      value={resultLovDisplay}
                      placeholder="Selected LOV"
                    />
                  </div>
                )}
              </div>

              <div className="profile-actions">
                <MyButton
                  prefixIcon={() => (isEditMode ? <MdEdit size={18} /> : <AddOutlineIcon />)}
                  color={isEditMode ? 'var(--primary-green)' : 'var(--deep-blue)'}
                  onClick={handleSave}
                >
                  {isEditMode ? 'Update' : 'Add'}
                </MyButton>
              </div>
            </div>



            <div className="table-wrapper">
              <MyTable
                height={380}
                data={allDiagnosticTestProfiles?.data ?? []}
                loading={isFetching}
                columns={tableColumns}
                rowClassName={isSelected}
                page={paginationParams.page}
                rowsPerPage={paginationParams.size}
                totalCount={allDiagnosticTestProfiles?.totalCount ?? 0}
                onPageChange={(_, newPage) =>
                  setPaginationParams(prev => ({
                    ...prev,
                    page: newPage
                  }))
                }
                onRowsPerPageChange={event =>
                  setPaginationParams(prev => ({
                    ...prev,
                    page: 0,
                    size: Number(event.target.value)
                  }))
                }
                onRowClick={rowData => {
                  if (diagnosticsTestProfile?.id === rowData.id) {
                    setDiagnosticsTestProfile({ ...newDiagnosticTestProfile });
                    return;
                  }
                  setDiagnosticsTestProfile(rowData);
                }}
              />
            </div>


            <DeletionConfirmationModal
              open={openConfirmDeleteProfile}
              setOpen={setOpenConfirmDeleteProfile}
              itemToDelete={
                diagnosticsTestProfile?.isActive ? 'Deactivate Profile' : 'Activate Profile'
              }
              confirmationQuestion={`Are you sure you want to ${diagnosticsTestProfile?.isActive ? 'deactivate' : 'activate'
                } this profile?`}
              actionButtonFunction={handleToggleActive}
              actionType="Confirm"
            />

            <DeletionConfirmationModal
              open={openConfirmDeleteProfileNormalRange}
              setOpen={setOpenConfirmDeleteProfileNormalRange}
              itemToDelete="Normal Range"
              actionButtonFunction={handleRemoveNormalRange}
              actionType="Delete"
            />
          </Form>
        );
    }
  };


  const conjureFormContentOfSecondChildModal = () => {
    return (
      <AddNormalRange
        diagnosticTestNormalRange={diagnosticTestNormalRange}
        setDiagnosticTestNormalRange={setDiagnosticTestNormalRange}
        diagnosticsTestProfile={diagnosticsTestProfile}
      />
    );
  };

  const handleSaveNormalRange = async () => {
    try {
      const payload = {
        ...(diagnosticTestNormalRange.id && { id: diagnosticTestNormalRange.id }),
        testId: diagnosticsTest.id,
        profileTestId: diagnosticsTestProfile?.id,

        gender: diagnosticTestNormalRange.gender ?? null,
        condition: diagnosticTestNormalRange.condition ?? null,

        ageFrom: diagnosticTestNormalRange.ageFrom,
        ageFromUnit: diagnosticTestNormalRange.ageFromUnit ?? null,
        ageTo: diagnosticTestNormalRange.ageTo,
        ageToUnit: diagnosticTestNormalRange.ageToUnit ?? null,

        resultLov: diagnosticTestNormalRange.resultLov ?? null,

        normalRangeType: diagnosticTestNormalRange.normalRangeType ?? null,
        rangeFrom: diagnosticTestNormalRange.rangeFrom,
        rangeTo: diagnosticTestNormalRange.rangeTo,

        criticalValue: diagnosticTestNormalRange.criticalValue ?? false,
        criticalValueLessThan: diagnosticTestNormalRange.criticalValueLessThan,
        criticalValueMoreThan: diagnosticTestNormalRange.criticalValueMoreThan,
        lovKeys: diagnosticTestNormalRange.lovKeys ?? []
      };

      if (diagnosticTestNormalRange.id) {
        await updateDiagnosticTestNormalRange({ id: diagnosticTestNormalRange.id, body: payload });
        dispatch(notify({ msg: 'Normal Range Updated', sev: 'success' }));
      } else {
        await createDiagnosticTestNormalRange(payload);
        dispatch(notify({ msg: 'Normal Range Created', sev: 'success' }));
      }

      setDiagnosticTestNormalRange({ ...newDiagnosticTestNormalRange, testId: diagnosticsTest.id });
    } catch (err) {
      dispatch(notify({ msg: 'Failed to Save Normal Range', sev: 'error' }));
    }
  };

  useEffect(() => {
    if (open && diagnosticsTest?.id) {
      refetchDiagnosticsTestProfile();
    }
  }, [open, diagnosticsTest?.id]);

  useEffect(() => {
    if (!diagnosticsTestProfile?.listOfValueId) return;
    if (!lovListResponseData?.object?.length) return;

  }, [diagnosticsTestProfile.listOfValueId, lovListResponseData]);

  useEffect(() => {
    if (open && openNormalRanges) {
      setOpenChild(true);
    }
  }, [open, openNormalRanges]);


  useEffect(() => {
    if (open && selectedProfile) {
      setDiagnosticsTestProfile(selectedProfile);
    }
  }, [open, selectedProfile]);

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <ChildModal
      actionButtonLabel="Save"
      hideActionBtn
      open={open}
      setOpen={setOpen}
      showChild={openChild}
      setShowChild={setOpenChild}
      showSubChild={openSubChild}
      setShowSubChild={setOpenSubChild}
      title="Profiles"
      mainContent={(stepNumber) => (<div dir={dir}>{conjureFormContentOfMainModal(stepNumber)}</div>)}

      mainStep={[{ title: 'Profile', icon: <FaChartLine /> }]}
      childStep={[{ title: 'Normal Range Info', icon: <FaChartLine /> }]}
      childTitle="Normal Ranges"
      childContent={
        <div dir={dir}>
          <DiagnosticTestNormalRangeTable
            profileId={diagnosticsTestProfile?.id}
            testId={diagnosticsTest?.id}
            resultType={diagnosticsTestProfile?.resultType}
            onAdd={range => {
              setDiagnosticTestNormalRange(range);
              setOpenSubChild(true);
            }}
            onEdit={range => {
              setDiagnosticTestNormalRange(range);
              setOpenSubChild(true);
            }}
            onDelete={range => {
              setDiagnosticTestNormalRange(range);
              setOpenConfirmDeleteProfileNormalRange(true);
            }}
          />
        </div>
      }

      hideActionChildBtn={true}
      actionSubChildButtonFunction={handleSaveNormalRange}
      subChildTitle="Add Normal Range"
      subChildContent={<div dir={dir}>{conjureFormContentOfSecondChildModal()}</div>}
      mainSize="xs"
      childSize="40vw"
    />
  );
};

export default Profile;
