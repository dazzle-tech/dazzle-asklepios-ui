import React, { useEffect, useState } from 'react';
import {
  useDeactiveActivVaccineBrandsMutation,
  useGetIcdListQuery,
  useGetLovValuesByCodeQuery,
  useGetVaccineBrandsListQuery,
  useSaveVaccineBrandMutation,
  useSaveVaccineMutation
} from '@/services/setupService';
import SearchIcon from '@rsuite/icons/Search';
import MyInput from '@/components/MyInput';
import { Dropdown, Form } from 'rsuite';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { MdVaccines } from 'react-icons/md';
import { MdMedication } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { initialListRequest, ListRequest } from '@/types/types';
import MyButton from '@/components/MyButton/MyButton';
import { ApVaccineBrands } from '@/types/model-types';
import { newApVaccineBrands } from '@/types/model-types-constructor';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
const AddEditVaccine = ({ open, setOpen, vaccine, setVaccine, edit_new, setEdit_new, refetch }) => {
  const dispatch = useAppDispatch();

  const [indicationsIcd, setIndicationsIcd] = useState({ indications: null });
  const [vaccineBrand, setVaccineBrand] = useState<ApVaccineBrands>({ ...newApVaccineBrands });
  const [openChildModal, setOpenChildModal] = useState<boolean>(false);
  const [indicationsDescription, setindicationsDescription] = useState<string>('');
  const [possibleDescription, setPossibleDescription] = useState('');
  // const [searchKeyword, setSearchKeyword] = useState('');
  const [recordOfSearch, setRecordOfSearch] = useState({ searchKeyword: '' });
  const [recordOfPossibleDescription, setRecordOfPossibleDescription] = useState({
    possibleDescription: ''
  });
  const [recordOfIndicationsDescription, setRecordOfIndicationsDescription] = useState({
    indicationsDescription: ''
  });
  const [editBrand, setEditBrand] = useState(false);
  const [openConfirmDeleteBrandModal, setOpenConfirmDeleteBrandModal] = useState<boolean>(false);
  const [stateOfDeleteBrandModal, setStateOfDeleteBrandModal] = useState<string>('delete');
  const [vaccineBrandsListRequest, setVaccineBrandsListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });
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
  // Fetch vaccine Brands list response
  const {
    data: vaccineBrandsListResponseLoading,
    refetch: refetchVaccineBrand,
    isFetching
  } = useGetVaccineBrandsListQuery(vaccineBrandsListRequest);
  // Fetch icd list response
  const { data: icdListResponseLoading } = useGetIcdListQuery(icdListRequest);
  // Fetch type Lov list response
  const { data: typeLovQueryResponse } = useGetLovValuesByCodeQuery('VACCIN_TYP');
  // Fetch ROA Lov list response
  const { data: rOALovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
  // Fetch unit Lov list response
  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
  // Fetch medAdvers Lov list response
  const { data: medAdversLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');
  // Fetch manufacturer Lov list response
  const { data: manufacturerLovQueryResponse } = useGetLovValuesByCodeQuery('GEN_MED_MANUFACTUR');
  // Fetch volum Unit Lov list response
  const { data: volumUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  // deactivate/activate VaccineBrand
  const [deactiveVaccineBrand] = useDeactiveActivVaccineBrandsMutation();
  // save VaccineBrand
  const [saveVaccineBrand] = useSaveVaccineBrandMutation();
  // save Vaccine
  const [saveVaccine, saveVaccineMutation] = useSaveVaccineMutation();
  // customise item appears on the selected indications list
  const modifiedData = (icdListResponseLoading?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.icdCode} - ${item.description}`
  }));
  // class name for selected row on brands table
  const isSelectedBrand = rowData => {
    if (rowData && vaccineBrand && vaccineBrand.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };

  // Effects
  // clear possibleReactions and indications when close the pop up
  useEffect(() => {
    if (!open) {
      setRecordOfIndicationsDescription({
        indicationsDescription: ''
      });
      setRecordOfPossibleDescription({
        possibleDescription: ''
      });
      setIndicationsIcd({ indications: null });
    }
  }, [open]);
  // update record Of Indications Description when indications Description is updated
  useEffect(() => {
    setRecordOfIndicationsDescription({
      indicationsDescription: indicationsDescription
    });
  }, [indicationsDescription]);
  // update record Of Possible Description when possible Description is updated
  useEffect(() => {
    setRecordOfPossibleDescription({
      possibleDescription: possibleDescription
    });
  }, [possibleDescription]);
  // when the user select a possipleReaction add it to Possible Description
  useEffect(() => {
    if (vaccine.possibleReactions != null) {
      const foundItem = medAdversLovQueryResponse?.object?.find(
        item => item.key === vaccine.possibleReactions
      );
      const displayValue = foundItem?.lovDisplayVale || '';
      if (displayValue) {
        setPossibleDescription(prevadminInstructions =>
          prevadminInstructions ? `${prevadminInstructions}, ${displayValue}` : displayValue
        );
      }
    }
  }, [vaccine.possibleReactions]);
  // when the user select an indication add it to indications Description
  useEffect(() => {
    if (indicationsIcd.indications != null) {
      setindicationsDescription(prevadminInstructions => {
        const currentIcd = icdListResponseLoading?.object?.find(
          item => item.key === indicationsIcd.indications
        );
        if (!currentIcd) return prevadminInstructions;
        const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;
        return prevadminInstructions ? `${prevadminInstructions}\n${newEntry}` : newEntry;
      });
    }
  }, [indicationsIcd.indications]);
  // when the vaccine is changed update the list request
  useEffect(() => {
    setVaccineBrandsListRequest(prev => ({
      ...prev,
      filters: [
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        },
        ...(vaccine?.key
          ? [
              {
                fieldName: 'vaccine_key',
                operator: 'match',
                value: vaccine.key
              }
            ]
          : [])
      ]
    }));
    //claer
    setindicationsDescription(vaccine?.key ? vaccine.indications : '');
    setPossibleDescription(vaccine?.key ? vaccine.possibleReactions : '');
  }, [vaccine?.key]);

  useEffect(() => {
    if (saveVaccineMutation && saveVaccineMutation.status === 'fulfilled') {
      setVaccine(saveVaccineMutation.data);
      refetch();
    }
  }, [saveVaccineMutation]);

  useEffect(() => {
    if (recordOfSearch['searchKeyword'].trim() !== '') {
      setIcdListRequest({
        ...initialListRequest,
        filterLogic: 'or',
        filters: [
          {
            fieldName: 'icd_code',
            operator: 'containsIgnoreCase',
            value: recordOfSearch['searchKeyword']
          },
          {
            fieldName: 'description',
            operator: 'containsIgnoreCase',
            value: recordOfSearch['searchKeyword']
          }
        ]
      });
    }
  }, [recordOfSearch['searchKeyword']]);

  // Icons column (Edite, reactive/Deactivate)
  const iconsForActions = (rowData: ApVaccineBrands) => (
    <div className="container-of-icons-vaccine">
      <MdModeEdit
        className="icons-vaccine"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setOpenChildModal(true);
        }}
      />
      {rowData?.isValid ? (
        <MdDelete
          className="icons-vaccine"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteBrandModal('deactivate');
            setOpenConfirmDeleteBrandModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-vaccine"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteBrandModal('reactivate');
            setOpenConfirmDeleteBrandModal(true);
          }}
        />
      )}
    </div>
  );
  //Table columns
  const tableColumns = [
    {
      key: 'brandName',
      title: <Translate>Brand Name</Translate>,
      flexGrow: 3
    },
    {
      key: 'manufacturer',
      title: <Translate>Manufacturer</Translate>,
      flexGrow: 3,
      render: rowData =>
        rowData.manufacturerLvalue
          ? rowData.manufacturerLvalue.lovDisplayVale
          : rowData.manufacturerLkey
    },
    {
      key: 'volume',
      title: <Translate>Volume</Translate>,
      flexGrow: 3,
      render: rowData => (
        <>
          {rowData.volume}{' '}
          {rowData.unitLvalue ? rowData.unitLvalue.lovDisplayVale : rowData.unitLkey}
        </>
      )
    },
    {
      key: 'marketingAuthorizationHolder',
      title: <Translate>Marketing Authorization Holder</Translate>,
      flexGrow: 3
    },
    {
      key: 'isValid',
      title: <Translate>Status</Translate>,
      flexGrow: 3,
      render: rowData => (rowData.isValid ? 'Valid' : 'InValid')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];
  // handle save vaccine
  const handleSave = () => {
    saveVaccine({
      ...vaccine,
      possibleReactions: possibleDescription,
      indications: indicationsDescription,
      isValid: true
    })
      .unwrap()
      .then(() => {
        if (vaccine.key) {
          dispatch(notify('Vaccine Updated Successfully'));
        } else {
          dispatch(notify('Vaccine Added Successfully'));
        }

        refetch();
        setEdit_new(false);
        setEditBrand(true);
      })
      .catch(() => {
        dispatch(notify('Failed to Save Vaccine'));
      });
  };
  //handle save vaccine brand
  const handleSaveVaccineBrand = () => {
    saveVaccineBrand({ ...vaccineBrand, vaccineKey: vaccine.key, valid: true })
      .unwrap()
      .then(() => {
        setVaccineBrand({ ...newApVaccineBrands, brandName: '' });
        dispatch(notify('Vaccine Brand Added Successfully'));
        refetchVaccineBrand();
        setVaccineBrand({
          ...newApVaccineBrands,
          vaccineKey: vaccine.key,
          brandName: '',
          manufacturerLkey: null,
          volume: 0,
          unitLkey: null,
          marketingAuthorizationHolder: ''
        });
        setEdit_new(false);
      })
      .catch(() => {
        dispatch(notify('Failed to Save Vaccine Brand'));
      });
  };
  
  // handle Deactive/Reactivate Brand
  const handleDeactiveReactivateBrand = () => {
    deactiveVaccineBrand(vaccineBrand)
      .unwrap()
      .then(() => {
        refetchVaccineBrand();

        dispatch(
          notify({
            msg: 'The Vaccine Brand was successfully ' + stateOfDeleteBrandModal,
            sev: 'success'
          })
        );
        setVaccineBrand(newApVaccineBrands);
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Failed to ' + stateOfDeleteBrandModal + ' this Vaccine Brand',
            sev: 'error'
          })
        );
      });
    setOpenConfirmDeleteBrandModal(false);
  };
  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div className="container-of-two-fields-vaccine">
              <div className='container-of-field-vaccine'>
              <MyInput
                width="100%"
                fieldLabel="Vaccine Code"
                fieldName="vaccineCode"
                record={vaccine}
                setRecord={setVaccine}
                disabled={!edit_new}
              />
              </div>
              <div className='container-of-field-vaccine'>
              <MyInput
                width="100%"
                fieldLabel="Vaccine Name"
                fieldName="vaccineName"
                record={vaccine}
                setRecord={setVaccine}
                plachplder={'Medical Component'}
                disabled={!edit_new}
              />
              </div>
            </div>
            <br/>
            <div className="container-of-two-fields-vaccine">
              <div className='container-of-field-vaccine'>
              <MyInput
                width="100%"
                fieldLabel="ATC Code"
                fieldName="atcCode"
                record={vaccine}
                setRecord={setVaccine}
                disabled={!edit_new}
              />
            </div>
            <div className='container-of-field-vaccine'>
              <MyInput
                width="100%"
                fieldLabel="Type"
                fieldType="select"
                fieldName="typeLkey"
                selectData={typeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={vaccine}
                setRecord={setVaccine}
                disabled={!edit_new}
                menuMaxHeight={200}
              />
              </div>
            </div>
            <br/>
            <div className="container-of-two-fields-vaccine">
               <div className='container-of-field-vaccine'>
              <MyInput
                width="100%"
                fieldLabel="ROA"
                fieldType="select"
                fieldName="roaLkey"
                selectData={rOALovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={vaccine}
                setRecord={setVaccine}
                disabled={!edit_new}
                menuMaxHeight={200}
              />
              </div>
               <div className='container-of-field-vaccine'>
              <MyInput
                width="100%"
                fieldLabel="Site of Administration"
                fieldName="siteOfAdministration"
                record={vaccine}
                setRecord={setVaccine}
                disabled={!edit_new}
              />
              </div>
            </div>
            <br/>
            <div className="container-of-two-fields-vaccine">
               <div className='container-of-field-vaccine'>
              <MyInput
                width="100%"
                fieldLabel="Post Opening Duration"
                fieldName="postOpeningDuration"
                record={vaccine}
                setRecord={setVaccine}
                disabled={!edit_new}
              />
              </div>
               <div className='container-of-field-vaccine'>
              <MyInput
                width="100%"
                fieldLabel="Duration Unit"
                fieldType="select"
                fieldName="durationUnitLkey"
                selectData={unitLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={vaccine}
                setRecord={setVaccine}
                disabled={!edit_new}
                menuMaxHeight={200}
              />
              </div>
            </div>
            <br/>
              <MyInput
                width="100%"
                fieldLabel="Indications"
                fieldName="searchKeyword"
                record={recordOfSearch}
                setRecord={setRecordOfSearch}
               rightAddon={<SearchIcon />}
              />

            <div className="container-of-menu-diagnostic">
              {recordOfSearch['searchKeyword'] && (
                <Dropdown.Menu disabled={!edit_new} className="menu-diagnostic">
                  {modifiedData?.map(mod => (
                    <Dropdown.Item
                      key={mod.key}
                      eventKey={mod.key}
                      onClick={() => {
                        setIndicationsIcd({
                          ...indicationsIcd,
                          indications: mod.key
                        });
                        setRecordOfSearch({ searchKeyword: '' });
                      }}
                    >
                      <span>{mod.icdCode} </span>
                      <span>{mod.description}</span>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              )}
            </div>
            <MyInput
              disabled={true}
              fieldType="textarea"
              record={recordOfIndicationsDescription}
              setRecord={''}
              showLabel={false}
              fieldName="indicationsDescription"
              width="100%"
            />
            <MyInput
              width="100%"
              fieldLabel="Possible Reactions"
              fieldType="select"
              fieldName="possibleReactions"
              selectData={medAdversLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={vaccine}
              setRecord={setVaccine}
              disabled={!edit_new}
              menuMaxHeight={200}
            />
            <MyInput
              disabled={true}
              fieldType="textarea"
              record={recordOfPossibleDescription}
              setRecord={''}
              showLabel={false}
              fieldName="possibleDescription"
              width="100%"
            />
            <div className="container-of-two-fields-vaccine">
               <div className='container-of-field-vaccine'>
              <MyInput
                width="100%"
                fieldType="textarea"
                disabled={!edit_new}
                fieldName="contraindicationsAndPrecautions"
                record={vaccine}
                setRecord={setVaccine}
              />
              </div>
               <div className='container-of-field-vaccine'>
              <MyInput
                width="100%"
                fieldType="textarea"
                disabled={!edit_new}
                fieldName="storageAndHandling"
                record={vaccine}
                setRecord={setVaccine}
              />
              </div>
            </div>
          </Form>
        );
      case 1:
        return (
          <Form>
            <div className="container-of-add-new-button-vaccine">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setOpenChildModal(true);
                }}
                width="109px"
              >
                Add New
              </MyButton>
            </div>
            <MyTable
              height={450}
              data={vaccine.key ? vaccineBrandsListResponseLoading?.object ?? [] : []}
              loading={isFetching}
              columns={tableColumns}
              rowClassName={isSelectedBrand}
              onRowClick={rowData => {
                setVaccineBrand(rowData);
              }}
              sortColumn={vaccineBrandsListRequest.sortBy}
              sortType={vaccineBrandsListRequest.sortType}
              onSortChange={(sortBy, sortType) => {
                if (sortBy)
                  setVaccineBrandsListRequest({ ...vaccineBrandsListRequest, sortBy, sortType });
              }}
            />
            <DeletionConfirmationModal
              open={openConfirmDeleteBrandModal}
              setOpen={setOpenConfirmDeleteBrandModal}
              itemToDelete="Brand Product"
              actionButtonFunction={handleDeactiveReactivateBrand}
              actionType={stateOfDeleteBrandModal}
            />
          </Form>
        );
    }
  };
  // Child modal content
  const conjureFormContentOfChildModal = () => {
    return (
      <Form layout="inline" fluid>
        <MyInput
          required
          width={350}
          column
          fieldLabel="Brand Name"
          fieldName="brandName"
          record={vaccineBrand}
          setRecord={setVaccineBrand}
          disabled={!editBrand && !vaccine.key}
        />
        <MyInput
          required
          width={350}
          column
          fieldLabel="Manufacturer"
          fieldType="select"
          fieldName="manufacturerLkey"
          selectData={manufacturerLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={vaccineBrand}
          setRecord={setVaccineBrand}
          disabled={!editBrand && !vaccine.key}
          menuMaxHeight={200}
        />
        <MyInput
          required
          width={350}
          column
          fieldType="number"
          fieldLabel="Volume"
          fieldName="volume"
          record={vaccineBrand}
          setRecord={setVaccineBrand}
          disabled={!editBrand && !vaccine.key}
        />
        <MyInput
          required
          width={350}
          column
          fieldLabel="Unit"
          fieldType="select"
          fieldName="unitLkey"
          selectData={volumUnitLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={vaccineBrand}
          setRecord={setVaccineBrand}
          disabled={!editBrand && !vaccine.key}
          menuMaxHeight={200}
        />
        <MyInput
          width={350}
          column
          fieldLabel="Marketing Authorization Holder"
          fieldName="marketingAuthorizationHolder"
          record={vaccineBrand}
          setRecord={setVaccineBrand}
          disabled={!editBrand && !vaccine.key}
        />
      </Form>
    );
  };
  return (
    <ChildModal
      actionChildButtonFunction={handleSaveVaccineBrand}
      actionButtonFunction={() => setOpen(false)}
      open={open}
      setOpen={setOpen}
      showChild={openChildModal}
      setShowChild={setOpenChildModal}
      title={vaccine?.key ? 'Edit Vaccine' : 'New Vaccine'}
      mainContent={conjureFormContentOfMainModal}
      mainStep={[
        {
          title: 'Vaccine Details',
          icon: <MdVaccines />,
          disabledNext: !vaccine?.key,
          footer: <MyButton onClick={handleSave}>Save</MyButton>
        },
        {
          title: 'Brand Products',
          icon: <MdMedication />
        }
      ]}
      childTitle={
        vaccineBrand?.key ? 'Edit Brand Product of Vaccine' : 'New Brand Product of Vaccine'
      }
      childContent={conjureFormContentOfChildModal}
      mainSize="sm"
    />
  );
};
export default AddEditVaccine;
