import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import AdvancedModal from '@/components/AdvancedModal';
import { InputGroup, Form, Input, Dropdown, Stack, DatePicker } from 'rsuite';

import { ApEncounterVaccination } from '@/types/model-types';
import { useSaveEncounterVaccineMutation } from '@/services/observationService';
import { newApEncounterVaccination } from '@/types/model-types-constructor';

import type {
  Vaccine,
  VaccineBrand,
  VaccineDose,
  VaccineDosesInterval
} from '@/types/model-types-new';
import {
  newVaccine,
  newVaccineBrand,
  newVaccineDose,
  newVaccineDosesInterval
} from '@/types/model-types-constructor-new';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';

import {
  useLazyGetVaccinesByNameQuery
} from '@/services/vaccine/vaccineService';
import {
  useGetVaccineDosesByVaccineIdQuery
} from '@/services/vaccine/vaccineDosesService';
import {
  useGetIntervalsByVaccineIdQuery
} from '@/services/vaccine/vaccineDosesIntervalService';
import {
  useGetVaccineBrandsByVaccineQuery
} from '@/services/vaccine/vaccineBrandsService';

// enums hook
import { useEnumOptions } from '@/services/enumsApi';

import SearchIcon from '@rsuite/icons/Search';
import { useAppSelector, useAppDispatch } from '@/hooks';
import MyLabel from '@/components/MyLabel';
import { notify } from '@/utils/uiReducerActions';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';
import InfoCardList from '@/components/InfoCardList';
import clsx from 'clsx';

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  patient: any;
  encounter: any;
  encounterVaccination: ApEncounterVaccination;
  setEncounterVaccination: (v: ApEncounterVaccination) => void;
  vaccineObject: Vaccine;
  vaccineDoseObjet: VaccineDose;
  vaccineBrandObject: VaccineBrand;
  refetch: () => void;
  isDisabled?: boolean;
  edit?: boolean;
}

const AddEncounterVaccine = ({
  open,
  setOpen,
  patient,
  encounter,
  encounterVaccination,
  setEncounterVaccination,
  vaccineObject,
  vaccineDoseObjet,
  vaccineBrandObject,
  refetch,
  isDisabled = false,
  edit
}) => {
  const authSlice = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();

  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [vaccine, setVaccine] = useState<Vaccine>({ ...vaccineObject });
  const [vaccineBrand, setVaccineBrand] = useState<VaccineBrand>({ ...vaccineBrandObject });
  const [vaccineDose, setVaccineDose] = useState<VaccineDose>({ ...vaccineDoseObjet });
  const [vaccineToDose, setVaccineToDose] = useState<VaccineDose>({ ...newVaccineDose });

  const [administrationReaction, setAdministrationReactions] = useState<{
    administrationReactionsLkey: string | null;
  }>({
    administrationReactionsLkey: ''
  });

  const [isEncounterVaccineStatusClose, setIsEncounterVacineStatusClose] = useState(false);
  const [hasExternalFacility, setHasExternalFacility] = useState({
    isHas: encounterVaccination?.externalFacilityName === '' ? false : true
  });

  const [vaccineDoseInterval, setVaccineDoseInterval] =
    useState<VaccineDosesInterval>({ ...newVaccineDosesInterval });

  const [isDisabledField, setIsDisabledField] = useState(false);

  const [saveEncounterVaccine] = useSaveEncounterVaccineMutation();

  // ========================= LOV / ENUMS =========================

  const typeEnumOptions = useEnumOptions('VaccineType');     // [{label, value}, ...]
  const roaEnumOptions = useEnumOptions('MedRoa');
  const numOfDosesEnumOptions = useEnumOptions('NumberOfDoses');
  const unitEnumOptions = useEnumOptions('Unit');

  const { data: manufacturerLovQueryResponse } = useGetLovValuesByCodeQuery('GEN_MED_MANUFACTUR');
  const { data: medAdversLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');
  const { data: numSerialLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS_SERIAL');

  const [triggerSearchVaccines, { data: vaccinesSearchResult }] =
    useLazyGetVaccinesByNameQuery();

  // Brands by vaccine
  const { data: vaccineBrandsPage } = useGetVaccineBrandsByVaccineQuery(
    {
      vaccineId: vaccine?.id as number | undefined,
      page: 0,
      size: 100,
      sort: 'id,asc'
    },
    { skip: !vaccine?.id }
  );

  // Doses by vaccine
  const { data: vaccineDosesPage } = useGetVaccineDosesByVaccineIdQuery(
    {
      vaccineId: vaccine?.id as number | undefined,
      page: 0,
      size: 100,
      sort: 'id,asc'
    },
    { skip: !vaccine?.id }
  );

  // Intervals by vaccine
  const { data: intervalsPage } = useGetIntervalsByVaccineIdQuery(
    {
      vaccineId: vaccine?.id as number | undefined,
      page: 0,
      size: 100,
      sort: 'id,asc'
    },
    { skip: !vaccine?.id }
  );

  // ========================= Lists for dropdowns =========================

  const modifiedData: (Vaccine & { combinedLabel: string })[] =
    (vaccinesSearchResult?.data ?? []).map((item: Vaccine) => ({
      ...item,
      combinedLabel: `${item.name}`
    }));

  const brandsNameList = (vaccineBrandsPage?.data ?? []).map((item: VaccineBrand) => ({
    value: String(item.id),
    label: item.name,
    vaccineBrand: item
  }));

  const dosesList = (vaccineDosesPage?.data ?? []).map((item: VaccineDose) => ({
    value: String(item.id),
    label: item.doseNumber,
    vaccineDoses: item
  }));

  // ========================= Handlers =========================

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
  };

  const handleClearField = () => {
    setEncounterVaccination({ ...newApEncounterVaccination, statusLkey: null });
    setVaccine({ ...newVaccine });
    setVaccineBrand({ ...newVaccineBrand });
    setVaccineDose({ ...newVaccineDose });
    setVaccineToDose({ ...newVaccineDose });
    setIsEncounterVacineStatusClose(false);
    setVaccineDoseInterval({ ...newVaccineDosesInterval });
    setHasExternalFacility({ isHas: false });
    setAdministrationReactions({ administrationReactionsLkey: null });
    setSearchKeyword('');
  };

  const handleSaveEncounterVaccine = () => {
    if (encounterVaccination.key === undefined) {
      // create
      saveEncounterVaccine({
        ...encounterVaccination,
        vaccineId: vaccine?.id,
        vaccineBrandId: vaccineBrand?.id,
        vaccineDoseId: vaccineDose?.id,
        patientKey: patient.key,
        encounterKey: encounter.key,
        statusLkey: '9766169155908512',
        createdBy: authSlice.user.key
      })
        .unwrap()
        .then(() => {
          dispatch(notify({ msg: 'Encounter Vaccine Added Successfully', sev: 'success' }));
          setEncounterVaccination({ ...newApEncounterVaccination, statusLkey: null });
          refetch();
          handleClearField();
          setOpen(false);
        });
    } else {
      // update
      saveEncounterVaccine({
        ...encounterVaccination,
        vaccineId: vaccine?.id,
        vaccineBrandId: vaccineBrand?.id,
        vaccineDoseId: vaccineDose?.id,
        patientKey: patient.key,
        encounterKey: encounter.key,
        updatedBy: authSlice.user.key
      })
        .unwrap()
        .then(() => {
          dispatch(notify({ msg: 'Encounter Vaccine Updated Successfully', sev: 'success' }));
          refetch();
          handleClearField();
          setOpen(false);
        });
    }
  };

  // ========================= Effects =========================

  // Encounter closed?
  useEffect(() => {
    if (encounter?.encounterStatusLkey === '91109811181900') {
      setIsEncounterStatusClosed(true);
    }
  }, [encounter?.encounterStatusLkey]);

  useEffect(() => {
    if (searchKeyword.trim() !== '') {
      triggerSearchVaccines({
        name: searchKeyword,
        page: 0,
        size: 50,
        sort: 'id,asc'
      });
    }
  }, [searchKeyword, triggerSearchVaccines]);

  // sync من props
  useEffect(() => {
    setVaccine({ ...vaccineObject });
  }, [vaccineObject]);

  useEffect(() => {
    setVaccineBrand({ ...vaccineBrandObject });
  }, [vaccineBrandObject]);

  useEffect(() => {
    setVaccineDose({ ...vaccineDoseObjet });
  }, [vaccineDoseObjet]);

  // status close
  useEffect(() => {
    if (encounterVaccination?.statusLkey === '3196709905099521') {
      setIsEncounterVacineStatusClose(true);
    } else {
      setIsEncounterVacineStatusClose(false);
    }
  }, [encounterVaccination?.statusLkey]);

  useEffect(() => {
    if (isEncounterStatusClosed || isDisabled || isEncounterVaccineStatusClose) {
      setIsDisabledField(true);
    } else {
      setIsDisabledField(false);
    }
  }, [isEncounterStatusClosed, isDisabled, isEncounterVaccineStatusClose]);

  // build administrationReactions string
  useEffect(() => {
    if (administrationReaction.administrationReactionsLkey != null) {
      const foundItemKey = medAdversLovQueryResponse?.object?.find(
        item => item.key === administrationReaction.administrationReactionsLkey
      );
      const foundItem = foundItemKey?.lovDisplayVale || '';
      setEncounterVaccination(prevEncounterVaccination => ({
        ...prevEncounterVaccination,
        administrationReactions: prevEncounterVaccination.administrationReactions
          ? prevEncounterVaccination.administrationReactions.includes(foundItem)
            ? prevEncounterVaccination.administrationReactions
            : `${prevEncounterVaccination.administrationReactions}, ${foundItem}`
          : foundItem
      }));
    }
  }, [
    administrationReaction.administrationReactionsLkey,
    medAdversLovQueryResponse,
    setEncounterVaccination
  ]);

  useEffect(() => {
    setHasExternalFacility({
      isHas: encounterVaccination?.externalFacilityName === '' ? false : true
    });
  }, [encounterVaccination]);

  useEffect(() => {
    const vaccineId = vaccine?.id;
    const currentDoseId = vaccineDose?.id;

    if (!vaccineId || !currentDoseId || !intervalsPage?.data || !vaccineDosesPage?.data) {
      setVaccineDoseInterval({ ...newVaccineDosesInterval });
      setVaccineToDose({ ...newVaccineDose });
      return;
    }

    const fromDoseId = Number(currentDoseId);
    const interval: VaccineDosesInterval | undefined = intervalsPage.data.find(
      (i: VaccineDosesInterval) => i.fromDoseId === fromDoseId
    );

    if (interval) {
      setVaccineDoseInterval({
        ...newVaccineDosesInterval,
        id: interval.id,
        vaccineId: interval.vaccineId,
        fromDoseId: interval.fromDoseId,
        toDoseId: interval.toDoseId,
        intervalBetweenDoses: interval.intervalBetweenDoses,
        unit: interval.unit
      });

      const toDose = (vaccineDosesPage.data as VaccineDose[]).find(
        d => d.id === interval.toDoseId
      );
      if (toDose) {
        setVaccineToDose({ ...newVaccineDose, ...toDose });
      } else {
        setVaccineToDose({ ...newVaccineDose });
      }
    } else {
      setVaccineDoseInterval({ ...newVaccineDosesInterval });
      setVaccineToDose({ ...newVaccineDose });
    }
  }, [intervalsPage, vaccineDosesPage, vaccineDose?.id, vaccine?.id]);

  // ========================= UI =========================

  return (
    <AdvancedModal
      open={open}
      setOpen={setOpen}
      isDisabledActionBtn={edit}
      leftTitle={`${vaccine?.name || ''} Vaccine`}
      rightTitle="Add Vaccine"
      size="87vw"
      actionButtonFunction={handleSaveEncounterVaccine}
      footerButtons={
        <MyButton appearance="ghost" onClick={handleClearField}>
          Clear
        </MyButton>
      }
      rightContent={
        <div className={clsx('right-main-container', { 'disabled-panel': edit })}>
          {/* =================== Search =================== */}
          <div className="search-list">
            <MyLabel label="Vaccine Name" />
            <InputGroup inside>
              <Input
                disabled={isDisabledField}
                placeholder="Search"
                value={searchKeyword}
                onChange={handleSearch}
              />
              <InputGroup.Button disabled={isDisabledField}>
                <SearchIcon />
              </InputGroup.Button>
            </InputGroup>
            {searchKeyword && (
              <Dropdown.Menu className="dropdown-menuresult">
                {modifiedData?.map(mod => (
                  <Dropdown.Item
                    key={mod.id}
                    eventKey={mod.id}
                    onClick={() => {
                      setVaccine({ ...newVaccine, ...mod });
                      setVaccineBrand({ ...newVaccineBrand });
                      setVaccineDose({ ...newVaccineDose });
                      setVaccineToDose({ ...newVaccineDose });
                      setVaccineDoseInterval({ ...newVaccineDosesInterval });
                      setSearchKeyword('');
                    }}
                  >
                    <span>{mod.name}</span>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            )}
          </div>

          {/* =================== Main Form =================== */}
          <Form layout="inline" fluid className="fields-container">
            <MyInput
              column
              disabled
              fieldType="text"
              fieldLabel="Vaccin Name"
              fieldName="name"
              record={vaccine}
              setRecord={setVaccine}
            />
            <MyInput
              column
              disabled
              fieldType="text"
              fieldLabel="ATC Code"
              fieldName="atcCode"
              record={vaccine}
              setRecord={setVaccine}
            />
            <MyInput
              column
              fieldLabel="Type"
              fieldType="select"
              fieldName="type"
              selectData={typeEnumOptions ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={vaccine}
              setRecord={setVaccine}
              disabled
            />
            <MyInput
              column
              fieldLabel="Number of Doses"
              fieldType="select"
              fieldName="numberOfDoses"
              selectData={numOfDosesEnumOptions ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={vaccine}
              setRecord={setVaccine}
              disabled
            />
            <MyInput
              column
              fieldLabel="ROA"
              fieldType="select"
              fieldName="roa"
              selectData={roaEnumOptions ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={vaccine}
              setRecord={setVaccine}
              disabled
            />
            <MyInput
              column
              fieldLabel="Site of Administration"
              fieldName="siteOfAdministration"
              record={vaccine}
              setRecord={setVaccine}
              disabled
            />
            {/* Used Brand */}
            <MyInput
              column
              searchable={false}
              fieldLabel="Used Brand"
              fieldType="select"
              fieldName="id"
              selectData={brandsNameList}
              selectDataLabel="label"
              selectDataValue="value"
              record={{ id: vaccineBrand?.id ? String(vaccineBrand.id) : '' }}
              setRecord={updated => {
                const selectedItem = brandsNameList.find(item => item.value === updated.id);
                if (!selectedItem) {
                  setVaccineBrand({ ...newVaccineBrand });
                } else {
                  setVaccineBrand({ ...newVaccineBrand, ...(selectedItem.vaccineBrand as VaccineBrand) });
                }
              }}
              placeholder="Select"
              disabled={isDisabledField}
            />
            <MyInput
              column
              disabled
              fieldType="text"
              fieldLabel="Volume"
              fieldName="volume"
              record={vaccineBrand}
              setRecord={setVaccineBrand}
            />
            <MyInput
              disabled
              column
              fieldLabel="Unit"
              fieldType="select"
              fieldName="unit"
              selectData={unitEnumOptions ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={vaccineBrand}
              setRecord={setVaccineBrand}
            />
            <MyInput
              column
              fieldLabel="Vaccine Manufacturer"
              fieldType="select"
              fieldName="manufacturer"
              selectData={manufacturerLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={vaccineBrand}
              setRecord={setVaccineBrand}
              disabled
            />
            <MyInput
              column
              disabled={isDisabledField}
              fieldType="text"
              fieldLabel="Vaccine Lot Number"
              fieldName="vaccineLotNumber"
              record={encounterVaccination}
              setRecord={setEncounterVaccination}
            />
            {/* Dose Name */}
            <MyInput
              column
              searchable={false}
              fieldLabel="Dose Name"
              fieldType="select"
              fieldName="id"
              selectData={dosesList}
              selectDataLabel="label"
              selectDataValue="value"
              record={{ id: vaccineDose?.id ? String(vaccineDose.id) : '' }}
              setRecord={updated => {
                const selectedItem = dosesList.find(item => item.value === updated.id);
                if (selectedItem) {
                  setVaccineDose({ ...newVaccineDose, ...(selectedItem.vaccineDoses as VaccineDose) });
                } else {
                  setVaccineDose({ ...newVaccineDose });
                }
              }}
              placeholder={vaccineDose?.doseNumber || 'Select'}
              disabled={isDisabledField}
            />
            {/* Next Dose (display only) */}
            <MyInput
              column
              fieldLabel="Next Dose"
              fieldType="text"
              fieldName="doseNumber"
              record={vaccineToDose}
              setRecord={setVaccineToDose}
              disabled
            />
            {/* Next Dose Due Date */}
            <MyInput
              column
              fieldLabel="Next Dose Due Date"
              fieldName="combined"
              placeholder={
                vaccineDoseInterval?.intervalBetweenDoses && vaccineDoseInterval?.unit
                  ? `${vaccineDoseInterval.intervalBetweenDoses} ${
                      unitEnumOptions?.find(u => u.value === vaccineDoseInterval.unit)?.label || ''
                    }`
                  : ' '
              }
              record={''}
              disabled
            />
            <MyInput
              column
              disabled={isDisabledField}
              fieldType="text"
              fieldLabel="Administration Site"
              fieldName="actualSide"
              record={encounterVaccination}
              setRecord={setEncounterVaccination}
            />
            <MyInput
              column
              fieldLabel="External Facility"
              fieldType="checkbox"
              fieldName="isHas"
              record={hasExternalFacility}
              setRecord={setHasExternalFacility}
              disabled={isDisabledField}
            />
            <MyInput
              column
              fieldType="text"
              fieldLabel="External Facility Name"
              fieldName="externalFacilityName"
              record={encounterVaccination}
              setRecord={setEncounterVaccination}
              disabled={!hasExternalFacility.isHas}
            />
            {/* Date Administered */}
              <div className="vaccine-input-wrapper">
              <div>
                <MyLabel label="Date Administered" />
              </div>
              <Stack
                spacing={10}
                direction="column"
                alignItems="flex-start"
                className="date-time-picker"
              >
                <DatePicker
                  format="MM/dd/yyyy hh:mm"
                  showMeridian
                  disabled={isDisabledField}
                  style={{ width: '145px' }}
                  value={
                    encounterVaccination.dateAdministered
                      ? new Date(encounterVaccination.dateAdministered)
                      : null
                  }
                  placeholder={
                    encounterVaccination.dateAdministered
                      ? new Date(encounterVaccination.dateAdministered).toLocaleString('en-GB')
                      : 'M/d/y hh:mm'
                  }
                  onChange={newValue => {
                    if (newValue) {
                      setEncounterVaccination(prev => ({
                        ...prev,
                        dateAdministered: newValue.getTime()
                      }));
                    } else {
                      setEncounterVaccination(prev => ({
                        ...prev,
                        dateAdministered: null
                      }));
                    }
                  }}
                />
              </Stack>
            </div>
          </Form>

          {/* =================== Bottom Form =================== */}
          <Form layout="inline" fluid className="form-container">
            <div className="inputs-group">
              <MyInput
                column
                width={200}
                fieldLabel="Administration Reactions"
                fieldType="select"
                fieldName="administrationReactionsLkey"
                selectData={medAdversLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={administrationReaction}
                setRecord={setAdministrationReactions}
                disabled={isDisabledField}
              />
              <MyInput
                disabled={isDisabledField}
                showLabel={false}
                fieldType="textarea"
                fieldLabel="Administration Reactions"
                fieldName="administrationReactions"
                record={encounterVaccination}
                setRecord={setEncounterVaccination}
                rows={4}
              />
            </div>
            <MyInput
              disabled={isDisabledField}
              column
              fieldType="textarea"
              fieldLabel="Notes"
              fieldName="notes"
              record={encounterVaccination}
              setRecord={setEncounterVaccination}
              rows={6}
            />
          </Form>
        </div>
      }
      leftContent={
        <div className="left-main-container">
          <Form layout="inline" fluid className="fields-container">
            <MyInput
              width={160}
              column
              fieldLabel="Vaccine Code"
              fieldName="vaccineCode"
              record={vaccine}
              setRecord={setVaccine}
              disabled
            />
            <MyInput
              width={160}
              column
              fieldLabel="ATC Code"
              fieldName="atcCode"
              record={vaccine}
              setRecord={setVaccine}
              disabled
            />
            <MyInput
              width={160}
              column
              fieldLabel="Post Opening Duration"
              fieldName="postOpeningDuration"
              record={vaccine}
              setRecord={setVaccine}
              disabled
            />
            <MyInput
              width={160}
              column
              fieldLabel="Duration Unit"
              fieldType="select"
              fieldName="durationUnit"
              selectData={unitEnumOptions ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={vaccine}
              setRecord={setVaccine}
              disabled
            />
          </Form>
          <div>
            <h6>Vaccine Brands</h6>
            <InfoCardList
              list={vaccine?.id ? vaccineBrandsPage?.data ?? [] : []}
              fields={[
                'manufacture',
                'volume',
                'unit',
                'marketingAuthorizationHolder',
                'isActive'
              ]}
              fieldLabels={{
                manufacture: 'Manufacturer',
                volume: 'Volume',
                unit: 'Unit',
                marketingAuthorizationHolder: 'MAH',
                isActive: 'isActive'
              }}
                computedFields={{
                manufacture: (item) =>
                    manufacturerLovQueryResponse?.object?.find(i => i.key === item.manufacture)?.lovDisplayVale || " ",
                isActive: (item) => {
                    const isActive = vaccineBrandsPage?.data?.find(i => i.id === item.id)?.isActive;
                    return isActive ? "Yes" : "No";
                }}}
              titleField="name"
            />
          </div>
        </div>
      }
    />
  );
};

export default AddEncounterVaccine;
