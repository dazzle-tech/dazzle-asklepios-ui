import React, { useEffect, useState } from 'react';
import {
  useDeactiveActivVaccineBrandsMutation,
  useGetIcdListQuery,
  useGetLovValuesByCodeQuery,
  useGetVaccineBrandsListQuery,
  useSaveVaccineBrandMutation,
  useSaveVaccineMutation
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Dropdown, Form, Input, InputGroup, Text } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserNurse } from '@fortawesome/free-solid-svg-icons';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import SearchIcon from '@rsuite/icons/Search';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import clsx from 'clsx';
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
const AddEditVaccine = ({
  open,
  setOpen,
  vaccine,
  setVaccine,
  //   width,
  edit_new,
  setEdit_new,
  refetch
  //   handleSave
}) => {
  const dispatch = useAppDispatch();

  const [indicationsIcd, setIndicationsIcd] = useState({ indications: null });
  const [vaccineBrand, setVaccineBrand] = useState<ApVaccineBrands>({ ...newApVaccineBrands });
  const [openChildModal, setOpenChildModal] = useState<boolean>(false);
  const [possibleDescription, setPossibleDescription] = useState('');
  const [editBrand, setEditBrand] = useState(false);
  const [saveVaccineBrand, saveVaccineBrandMutation] = useSaveVaccineBrandMutation();
  const [openConfirmDeleteBrandModal, setOpenConfirmDeleteBrandModal] = useState<boolean>(false);
  const [stateOfDeleteBrandModal, setStateOfDeleteBrandModal] = useState<string>('delete');

  const { data: typeLovQueryResponse } = useGetLovValuesByCodeQuery('VACCIN_TYP');
  const { data: rOALovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
  const { data: medAdversLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');
  const { data: manufacturerLovQueryResponse } = useGetLovValuesByCodeQuery('GEN_MED_MANUFACTUR');
  const { data: volumUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const [deactiveVaccineBrand, deactiveVaccineBrandMutation] =
    useDeactiveActivVaccineBrandsMutation();

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
  const {
    data: vaccineBrandsListResponseLoading,
    refetch: refetchVaccineBrand,
    isFetching
  } = useGetVaccineBrandsListQuery(vaccineBrandsListRequest);

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
  const [indicationsDescription, setindicationsDescription] = useState<string>('');
  const modifiedData = (icdListResponseLoading?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.icdCode} - ${item.description}`
  }));

  const isSelectedBrand = rowData => {
    if (rowData && vaccineBrand && vaccineBrand.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };

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
  }, [vaccine?.key]);

  // Icons column (Edite, reactive/Deactivate)
  const iconsForActions = (rowData: ApVaccineBrands) => (
    <div className="container-of-icons-practitioners">
      <MdModeEdit
        className="icons-practitioners"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setOpenChildModal(true);
        }}
      />
      {rowData?.isValid ? (
        <MdDelete
          className="icons-practitioners"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            console.log('delete');
            setStateOfDeleteBrandModal('deactivate');
            setOpenConfirmDeleteBrandModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-practitioners"
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
const [saveVaccine, saveVaccineMutation] = useSaveVaccineMutation();
  useEffect(() => {
    if (saveVaccineMutation && saveVaccineMutation.status === 'fulfilled') {
      setVaccine(saveVaccineMutation.data);
      refetch();
    }
  }, [saveVaccineMutation]);
    const handleSave = () => {
      console.log("in save");
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
        });
    };
  
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
      });
  };

  const handleDeactiveReactivateBrand = () => {
    console.log('in deactivate/reactivate');
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
            msg: 'Tailed to ' + stateOfDeleteBrandModal + ' this Vaccine Brand',
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
          <Form layout="inline" fluid>
            <div className="container-of-two-fields-vaccine">
              <MyInput
                width={250}
                column
                fieldLabel="Vaccine Code"
                fieldName="vaccineCode"
                record={vaccine}
                setRecord={setVaccine}
                disabled={!edit_new}
              />
              <MyInput
                width={250}
                column
                fieldLabel="Vaccine Name"
                fieldName="vaccineName"
                record={vaccine}
                setRecord={setVaccine}
                plachplder={'Medical Component'}
                disabled={!edit_new}
              />
            </div>
            <div className="container-of-two-fields-vaccine">
              <MyInput
                width={250}
                column
                fieldLabel="ATC Code"
                fieldName="atcCode"
                record={vaccine}
                setRecord={setVaccine}
                disabled={!edit_new}
              />
              <MyInput
                width={250}
                column
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
            <div className="container-of-two-fields-vaccine">
              <MyInput
                width={250}
                column
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
              <MyInput
                width={250}
                column
                fieldLabel="Site of Administration"
                fieldName="siteOfAdministration"
                record={vaccine}
                setRecord={setVaccine}
                disabled={!edit_new}
              />
            </div>
            <div className="container-of-two-fields-vaccine">
              <MyInput
                width={250}
                column
                fieldLabel="Post Opening Duration"
                fieldName="postOpeningDuration"
                record={vaccine}
                setRecord={setVaccine}
                disabled={!edit_new}
              />
              <MyInput
                width={250}
                column
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
            <div className="container-of-two-fields-vaccine">
              {' '}
              <MyInput
                width={250}
                column
                fieldLabel="Indications"
                fieldType="select"
                fieldName="indicationsIcd"
                selectData={modifiedData}
                selectDataLabel="combinedLabel"
                selectDataValue="item"
                record={indicationsIcd}
                setRecord={setIndicationsIcd}
                disabled={!edit_new}
                menuMaxHeight={200}
              />
              {/* <div>
                <Text style={{ fontWeight: '800', fontSize: '16px' }}>Indications</Text>
                <InputGroup inside style={{ width: '415px' }}>
                  <Input
                    disabled={!edit_new}
                    placeholder="Search ICD"
                    value={searchKeyword}
                    onChange={handleSearch}
                  />
                  <InputGroup.Button>
                    <SearchIcon />
                  </InputGroup.Button>
                </InputGroup>
                {searchKeyword && (
                  <Dropdown.Menu disabled={!edit_new} className="dropdown-menuresult">
                    {modifiedData?.map(mod => (
                      <Dropdown.Item
                        key={mod.key}
                        eventKey={mod.key}
                        onClick={() => {
                          setIndicationsIcd({
                            ...indicationsIcd,
                            indications: mod.key
                          });
                          setSearchKeyword('');
                        }}
                      >
                        <span style={{ marginRight: '19px' }}>{mod.icdCode}</span>
                        <span>{mod.description}</span>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                )}
              </div> */}
              <MyInput
                width={250}
                column
                fieldLabel="Possible Reactions"
                fieldType="select"
                fieldName={'possibleReactions'}
                selectData={medAdversLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={vaccine}
                setRecord={setVaccine}
                disabled={!edit_new}
                menuMaxHeight={200}
              />
            </div>
            <div className="container-of-two-fields-vaccine">
              {/* <Input
                as="textarea"
                disabled={true}
                // onChange={e => setindicationsDescription}
                value={indicationsDescription || vaccine.indications}
                style={{ width: 415 }}
                rows={4}
              /> */}
              <MyInput
                disabled={true}
                fieldType="textarea"
                value={indicationsDescription || vaccine.indications}
                record={''}
                setRecord={''}
                showLabel={false}
                fieldName=""
                width={250}
              />

              {/* <Input
                as="textarea"
                disabled={true}
                // onChange={e => setPossibleDescription}
                value={possibleDescription || vaccine.possibleReactions}
                style={{ width: 415 }}
                rows={4}
              /> */}
              <MyInput
                disabled={true}
                fieldType="textarea"
                value={possibleDescription || vaccine.possibleReactions}
                record={''}
                setRecord={''}
                showLabel={false}
                fieldName=""
                width={250}
              />
            </div>
            <div className="container-of-two-fields-vaccine">
              <MyInput
                width={250}
                column
                fieldType="textarea"
                disabled={!edit_new}
                fieldName="contraindicationsAndPrecautions"
                record={vaccine}
                setRecord={setVaccine}
              />

              <MyInput
                width={250}
                column
                fieldType="textarea"
                disabled={!edit_new}
                fieldName="storageAndHandling"
                record={vaccine}
                setRecord={setVaccine}
              />
            </div>
          </Form>
        );
      case 1:
        return (
          <Form>
            <div className="container-of-add-new-button-practitioners">
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
      // actionButtonLabel={vaccine?.key ? 'Save' : 'Create'}
      // actionButtonFunction={handleSave}
      actionChildButtonFunction={handleSaveVaccineBrand}
      open={open}
      setOpen={setOpen}
      showChild={openChildModal}
      setShowChild={setOpenChildModal}
      title={vaccine?.key ? 'Edit Vaccine' : 'New Vaccine'}
      mainContent={conjureFormContentOfMainModal}
      //   mainStep={[{ title: 'Vaccine Details', icon: <FontAwesomeIcon icon={faUserNurse} /> }]}
      mainStep={[
        {
          title: 'Vaccine Details',
          icon: <MdVaccines />,
          disabledNext: !vaccine?.key,
          footer: (
            <MyButton
              onClick={handleSave}
            >
              Save
            </MyButton>
          )
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
      //   mainSize = {width > 600 ? '570px' : '300px'}
      mainSize="sm"
    />
  );
};
export default AddEditVaccine;
