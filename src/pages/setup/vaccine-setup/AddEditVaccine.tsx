import ChildModal from '@/components/ChildModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import Icd10Search from '@/components/ICD10SearchComponent/IcdSearchable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import AdversEffects from '@/components/AdversEffectsComponent/AdversEffects';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useAddVaccineBrandMutation,
  useGetVaccineBrandsByVaccineQuery,
  useToggleVaccineBrandActiveMutation,
  useUpdateVaccineBrandMutation
} from '@/services/vaccine/vaccineBrandsService';
import {
  useAddVaccineMutation,
  useUpdateVaccineMutation
} from '@/services/vaccine/vaccineService';

import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { newVaccineBrand } from '@/types/model-types-constructor-new';
import { VaccineBrand } from '@/types/model-types-new';
import { conjureValueBasedOnKeyFromList, formatEnumString } from '@/utils';
import { PaginationPerPage } from '@/utils/paginationPerPage';
import { notify } from '@/utils/uiReducerActions';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import React, { useEffect, useState } from 'react';
import { FaUndo } from 'react-icons/fa';
import { MdDelete, MdMedication, MdModeEdit, MdVaccines } from 'react-icons/md';
import { Form } from 'rsuite';
import './styles.less';

/** ===================== Helpers ===================== */
const toNullIfEmpty = (v: any) => (v === '' ? null : v);
const toNumberOrNull = (v: any) => (v === '' || v === undefined || v === null ? null : Number(v));
const stripUndefined = (obj: Record<string, any>) =>
  Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));

const toHumanBackendError = (err: any, fieldLabels: Record<string, string> = {}): string => {
  const data = err?.data ?? {};
  const title = data?.title || '';
  const detail = data?.detail || '';
  const message = data?.message || '';
  const type = data?.type || '';
  const payloadText: string =
    [title, detail, message].filter(Boolean).join(' | ') || String(err?.error || '');

  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  // Bean Validation / MethodArgumentNotValid / ConstraintViolation
  const isValidation =
    data?.message === 'error.validation' ||
    (typeof title === 'string' && title.toLowerCase().includes('argument not valid')) ||
    (typeof type === 'string' && type.includes('constraint-violation'));

  if (isValidation && Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const normalizeMsg = (msg: string) => {
      const m = (msg || '').toLowerCase();
      if (m.includes('must not be null')) return 'is required';
      if (m.includes('must not be blank')) return 'must not be blank';
      if (m.includes('size must be between')) return 'length is out of range';
      if (m.includes('must be greater than')) return 'value is too small';
      if (m.includes('must be greater than or equal to')) return 'value is too small';
      if (m.includes('must be less than')) return 'value is too large';
      if (m.includes('must be less than or equal to')) return 'value is too large';
      return msg || 'invalid value';
    };
    const lines = data.fieldErrors.map((fe: any) => {
      const label = fieldLabels[fe.field] ?? fe.field;
      return `• ${label}: ${normalizeMsg(fe.message)}`;
    });
    return `Please fix the following fields:\n${lines.join('\n')}${suffix}`;
  }

  const lowerPayload = payloadText.toLowerCase();
  const looksLikeConstraintViolations =
    lowerPayload.includes('constraintviolation') || lowerPayload.includes('interpolatedmessage=');

  if (looksLikeConstraintViolations) {
    const matches: Array<{ field: string; msg: string }> = [];
    const re = /propertyPath\s*=\s*([a-zA-Z0-9_.[\]]+).*?interpolatedMessage\s*=\s*'([^']+)'/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(payloadText)) !== null) {
      matches.push({ field: m[1], msg: m[2] });
    }
    if (matches.length === 0) {
      const re2 = /propertyPath\s*=\s*([a-zA-Z0-9_.[\]]+).*?messageTemplate\s*=\*?\s*'([^']+)'/g;
      while ((m = re2.exec(payloadText)) !== null) {
        matches.push({ field: m[1], msg: m[2] });
      }
    }
    if (matches.length > 0) {
      const normalizeMsg = (msg: string) => {
        const l = msg.toLowerCase();
        if (l.includes('notnull') || l.includes('must not be null')) return 'is required';
        if (l.includes('notblank') || l.includes('must not be blank')) return 'must not be blank';
        if (l.includes('positive') || l.includes('must be greater than'))
          return 'value is too small';
        if (l.includes('max') || l.includes('less than or equal')) return 'value is too large';
        if (l.includes('min') || l.includes('greater than or equal')) return 'value is too small';
        return msg.replace(/[{}]/g, '') || 'invalid value';
      };
      const toLabel = (rawField: string) => {
        const base =
          rawField
            .split(/[.[\]]/)
            .filter(Boolean)
            .pop() || rawField;
        return fieldLabels[base] ?? fieldLabels[rawField] ?? base;
      };
      const lines = matches.map(({ field, msg }) => `• ${toLabel(field)}: ${normalizeMsg(msg)}`);
      return `Please fix the following fields:\n${lines.join('\n')}${suffix}`;
    }
  }

  if (title.toLowerCase().includes('failed to read request')) {
    return (
      'Some fields have invalid format (e.g. empty value for enum or number). ' +
      'Please select valid options or clear numeric fields.' +
      suffix
    );
  }

  const errorKey = message.startsWith('error.') ? message.substring(6) : undefined;
  const keyMap: Record<string, string> = {
    'payload.required': 'Payload is required.',
    'db.constraint': 'Database constraint violation.',
    // Vaccine
    'unique.name.type.roa': 'A vaccine with the same (name, type, roa) already exists.',
    'vaccine.notfound': 'Vaccine not found.',
    'vaccine.required': 'Vaccine id is required.',
    // VaccineBrand
    'vaccineBrand.notfound': 'Vaccine brand not found.',
    'unique.name.unit.volume': 'A vaccine brand with the same (name, unit, volume) already exists.',
    'brand.unique.name': 'Brand name already exists for this vaccine.'
  };

  const humanMsg =
    (errorKey && keyMap[errorKey]) ||
    (data?.errorKey && keyMap[data.errorKey]) ||
    data?.detail ||
    data?.title ||
    data?.message ||
    'Unexpected error';

  return humanMsg + suffix;
};

/** ===================== Component ===================== */
const AddEditVaccine = ({ open, setOpen, vaccine, setVaccine, edit_new, setEdit_new, refetch }) => {
  const dispatch = useAppDispatch();
  const [vaccineBrand, setVaccineBrand] = useState<VaccineBrand>({ ...newVaccineBrand });
  const [openChildModal, setOpenChildModal] = useState<boolean>(false);

  const [editBrand, setEditBrand] = useState(false);
  const [openConfirmDeleteBrandModal, setOpenConfirmDeleteBrandModal] = useState<boolean>(false);
  const [stateOfDeleteBrandModal, setStateOfDeleteBrandModal] = useState<string>('delete');

  // Pagination & sorting (like Vaccine)
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [sortBy, setSortBy] = useState<'id' | 'name'>('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  // ===== hooks =====
  const {
    data: brandsPage,
    refetch: refetchVaccineBrand,
    isFetching
  } = useGetVaccineBrandsByVaccineQuery(
    { vaccineId: vaccine?.id as number, page, size, sort: `${sortBy},${sortType}` },
    { skip: !vaccine?.id }
  );

  const tableData = brandsPage?.data ?? [];
  const totalCount = brandsPage?.totalCount ?? 0;
  const links = brandsPage?.links || {};

  const { data: manufactureLovQueryResponse } = useGetLovValuesByCodeQuery('GEN_MED_MANUFACTUR');
  const vaccineType = useEnumOptions('VaccineType');
  const roa = useEnumOptions('RouteOfAdministration');
  const durationUnit = useEnumOptions('DurationUnit');
  const volumUnit = useEnumOptions('MeasurementUnit');
  const numberOfDoses = useEnumOptions('NumberOfDoses', {
    labelOverrides: {
      ONE: '1',
      TWO: '2',
      THREE: '3',
      FOUR: '4',
      FIVE: '5',
      SIX: '6',
      SEVEN: '7',
      EIGHT: '8',
      NINE: '9',
      TEN: '10'
    }
  });

  const [addVaccineBrand] = useAddVaccineBrandMutation();
  const [updateVaccineBrand] = useUpdateVaccineBrandMutation();
  const [addVaccine, addVaccineResult] = useAddVaccineMutation();
  const [updateVaccine, updateVaccineResult] = useUpdateVaccineMutation();
  const [toggleVaccineBrandActive] = useToggleVaccineBrandActiveMutation();

  // ===== helpers =====
  const getSelectValue = (val: any, valueKey: string) => {
    if (val == null) return val;
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val;
    if (typeof val === 'object' && valueKey in val) return val[valueKey];
    return val;
  };

  const isSelectedBrand = (rowData: VaccineBrand) =>
    rowData && vaccineBrand && vaccineBrand.id === rowData.id ? 'selected-row' : '';

  // Effects: reflect vaccine save results
  useEffect(() => {
    if (addVaccineResult?.status === 'fulfilled' && addVaccineResult.data) {
      setVaccine(addVaccineResult.data);
      refetch?.();
    }
  }, [addVaccineResult?.status]);

  useEffect(() => {
    if (updateVaccineResult?.status === 'fulfilled' && updateVaccineResult.data) {
      setVaccine(updateVaccineResult.data);
      refetch?.();
    }
  }, [updateVaccineResult?.status]);

  // ===== table icons/actions =====
  const iconsForActions = (rowData: VaccineBrand) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setVaccineBrand(rowData);
          setEditBrand(true);
          setOpenChildModal(true);
        }}
      />
      {rowData?.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setVaccineBrand(rowData);
            setStateOfDeleteBrandModal('deactivate');
            setOpenConfirmDeleteBrandModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setVaccineBrand(rowData);
            setStateOfDeleteBrandModal('reactivate');
            setOpenConfirmDeleteBrandModal(true);
          }}
        />
      )}
    </div>
  );

  const tableColumns = [
    { key: 'name', title: <Translate>Brand Name</Translate>, flexGrow: 3 },
    {
      key: 'manufacture',
      title: <Translate>manufacture</Translate>,
      flexGrow: 3,
      render: (rowData: any) => (
        <span>
          {conjureValueBasedOnKeyFromList(
            manufactureLovQueryResponse?.object ?? [],
            rowData.manufacture,
            'lovDisplayVale'
          )}
        </span>
      )
    },
    {
      key: 'volume',
      title: <Translate>Volume</Translate>,
      flexGrow: 3,
      render: (rowData: VaccineBrand) => (
        <>
          {rowData.volume} {formatEnumString(rowData?.unit)}
        </>
      )
    },
    {
      key: 'marketingAuthorizationHolder',
      title: <Translate>Marketing Authorization Holder</Translate>,
      flexGrow: 3
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      width: 120,
      render: (rowData: VaccineBrand) => (
        <MyBadgeStatus
          contant={rowData.isActive ? 'Active' : 'Inactive'}
          color={rowData.isActive ? '#45b887' : '#969fb0'}
        />
      )
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (rowData: VaccineBrand) => iconsForActions(rowData)
    }
  ];

  // ===== actions (main vaccine) =====
  const handleSave = async () => {
    const raw = {
      ...(vaccine?.id ? { id: vaccine.id } : {}),
      ...vaccine
    };
    const payload = stripUndefined(raw);

    try {
      const saved = vaccine?.id
        ? await updateVaccine({ id: vaccine.id, data: payload as any }).unwrap()
        : await addVaccine(payload as any).unwrap();

      setVaccine(saved);
      dispatch(
        notify({
          msg: vaccine?.id ? 'Vaccine Updated Successfully' : 'Vaccine Added Successfully',
          sev: 'success'
        })
      );
      refetch?.();
      setEdit_new(false);
      setEditBrand(true);
    } catch (err: any) {
      const msg = toHumanBackendError(err, {
        name: 'Vaccine Name',
        type: 'Type',
        roa: 'ROA',
        atcCode: 'ATC Code',
        siteOfAdministration: 'Site of Administration',
        postOpeningDuration: 'Post Opening Duration',
        durationUnit: 'Duration Unit',
        numberOfDoses: 'Number of Doses',
        indications: 'Indications',
        possibleReactions: 'Possible Reactions',
        contraindicationsAndPrecautions: 'Contraindications & Precautions',
        storageAndHandling: 'Storage & Handling',
        isActive: 'Active'
      });
      dispatch(notify({ msg, sev: 'error' }));
    }
  };

  // ===== actions (brand) =====
  const handleSaveVaccineBrand = async () => {
    const manufactureVal = getSelectValue((vaccineBrand as any)?.manufacture, 'key');
    const unitVal = getSelectValue((vaccineBrand as any)?.unit, 'value');

    const createRaw = {
      name: vaccineBrand?.name?.trim?.(),
      manufacture: toNullIfEmpty(manufactureVal),
      volume: toNumberOrNull((vaccineBrand as any)?.volume),
      unit: toNullIfEmpty(unitVal),
      marketingAuthorizationHolder: toNullIfEmpty(
        (vaccineBrand as any)?.marketingAuthorizationHolder
      ),
      isActive: vaccineBrand?.isActive ?? true
    };
    const updateRaw = { id: vaccineBrand?.id, ...createRaw };

    const createData = stripUndefined(createRaw);
    const updateData = stripUndefined(updateRaw);

    try {
      if (vaccineBrand?.id) {
        await updateVaccineBrand({
          id: vaccineBrand.id, // path
          vaccineId: vaccine?.id, // query
          data: updateData
        }).unwrap();
        dispatch(notify({ msg: 'Vaccine Brand Updated Successfully', sev: 'success' }));
      } else {
        await addVaccineBrand({
          vaccineId: vaccine?.id, // query
          data: createData // body
        }).unwrap();
        dispatch(notify({ msg: 'Vaccine Brand Added Successfully', sev: 'success' }));
      }

      setVaccineBrand({ ...newVaccineBrand, vaccineId: vaccine?.id });
      refetchVaccineBrand?.();
      setOpenChildModal(false);
      setEdit_new(false);
      setEditBrand(true);
    } catch (err: any) {
      const msg = toHumanBackendError(err, {
        id: 'Brand Id',
        name: 'Brand Name',
        manufacture: 'Manufacture',
        volume: 'Volume',
        unit: 'Unit',
        marketingAuthorizationHolder: 'Marketing Authorization Holder',
        isActive: 'Active'
      });
      dispatch(notify({ msg, sev: 'error' }));
    }
  };

  const handleDeactiveReactivateBrand = async () => {
    if (!vaccineBrand?.id) return;
    try {
      const updated = await toggleVaccineBrandActive({ id: vaccineBrand.id }).unwrap();
      refetchVaccineBrand?.();
      dispatch(
        notify({
          msg: updated.isActive
            ? 'The Vaccine Brand was successfully reactivated'
            : 'The Vaccine Brand was successfully deactivated',
          sev: 'success'
        })
      );
      setVaccineBrand({ ...newVaccineBrand, vaccineId: vaccine?.id });
    } catch (err: any) {
      const msg = toHumanBackendError(err, { id: 'Brand Id' });
      dispatch(notify({ msg, sev: 'error' }));
    }
    setOpenConfirmDeleteBrandModal(false);
  };

  // ===== sorting like Vaccine page =====
  const handleSortChange = (column: 'id' | 'name', type: 'asc' | 'desc') => {
    setSortBy(column);
    setSortType(type);
    setPage(0); // go to first page on sort change
  };

  // ===== pagination like Vaccine page =====
  const handlePageChange = (_: unknown, newPage: number) => {
    const currentPage = page;
    const linksMap = links || {};
    let targetLink: string | null | undefined = null;

    if (newPage > currentPage && linksMap.next) targetLink = linksMap.next;
    else if (newPage < currentPage && linksMap.prev) targetLink = linksMap.prev;
    else if (newPage === 0 && linksMap.first) targetLink = linksMap.first;
    else if (newPage > currentPage + 1 && linksMap.last) targetLink = linksMap.last;

    if (targetLink) {
      try {
        const { page: p, size: s } = (PaginationPerPage as any).extractPaginationFromLink
          ? (PaginationPerPage as any).extractPaginationFromLink(targetLink)
          : { page: newPage, size };
        setPage(p);
        setSize(s);
      } catch {
        PaginationPerPage.handlePageChange(
          _,
          newPage,
          { page, size, sort: `${sortBy},${sortType}` },
          linksMap,
          (updater: any) => {
            if (typeof updater === 'function') {
              const next = updater({ page, size, sort: `${sortBy},${sortType}` });
              setPage(next.page);
              setSize(next.size);
            } else {
              setPage(updater.page);
              setSize(updater.size);
            }
          }
        );
      }
    } else {
      PaginationPerPage.handlePageChange(
        _,
        newPage,
        { page, size, sort: `${sortBy},${sortType}` },
        linksMap,
        (updater: any) => {
          if (typeof updater === 'function') {
            const next = updater({ page, size, sort: `${sortBy},${sortType}` });
            setPage(next.page);
            setSize(next.size);
          } else {
            setPage(updater.page);
            setSize(updater.size);
          }
        }
      );
    }
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setSize(newSize);
    setPage(0);
  };

  // ===== renderers =====
  const conjureFormContentOfMainModal = (stepNumber: number) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div className="container-of-two-fields-vaccine">
              <div className="container-of-field-vaccine">
                <MyInput
                  width="100%"
                  fieldLabel="Vaccine Name"
                  fieldName="name"
                  record={vaccine}
                  setRecord={setVaccine}
                  placeholder="Medical Component"
                  disabled={!edit_new}
                  required
                />
              </div>
              <div className="container-of-field-vaccine">
                <MyInput
                  width="100%"
                  fieldLabel="ATC Code"
                  fieldName="atcCode"
                  record={vaccine}
                  setRecord={setVaccine}
                  disabled={!edit_new}
                />
              </div>
            </div>

            <br />

            <div className="container-of-two-fields-vaccine">
              <div className="container-of-field-vaccine">
                <MyInput
                  width="100%"
                  fieldLabel="Type"
                  fieldType="select"
                  fieldName="type"
                  selectData={vaccineType ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={vaccine}
                  setRecord={setVaccine}
                  disabled={!edit_new}
                  menuMaxHeight={200}
                  searchable={false}
                  required
                />
              </div>
              <div className="container-of-field-vaccine">
                <MyInput
                  width="100%"
                  fieldLabel="ROA"
                  fieldType="select"
                  fieldName="roa"
                  selectData={roa ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={vaccine}
                  setRecord={setVaccine}
                  disabled={!edit_new}
                  menuMaxHeight={200}
                  required
                />
              </div>
            </div>

            <br />

            <div className="container-of-two-fields-vaccine">
              <div className="container-of-field-vaccine">
                <MyInput
                  width="100%"
                  fieldLabel="Site of Administration"
                  fieldName="siteOfAdministration"
                  record={vaccine}
                  setRecord={setVaccine}
                  disabled={!edit_new}
                />
              </div>
              <div className="container-of-field-vaccine">
                <MyInput
                  width="100%"
                  fieldLabel="Post Opening Duration"
                  fieldName="postOpeningDuration"
                  record={vaccine}
                  setRecord={setVaccine}
                  disabled={!edit_new}
                  fieldType="number"
                />
              </div>
            </div>

            <br />

            <div className="container-of-two-fields-vaccine">
              <div className="container-of-field-vaccine">
                <MyInput
                  width="100%"
                  fieldLabel="Duration Unit"
                  fieldType="select"
                  fieldName="durationUnit"
                  selectData={durationUnit ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={vaccine}
                  setRecord={setVaccine}
                  disabled={!edit_new}
                  menuMaxHeight={200}
                />
              </div>
              <div className="container-of-field-vaccine">
                <MyInput
                  width="100%"
                  fieldLabel="Number of Doses"
                  fieldType="select"
                  fieldName="numberOfDoses"
                  selectData={numberOfDoses ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={vaccine}
                  setRecord={setVaccine}
                  disabled={!edit_new || (vaccine?.numberOfDoses && vaccine?.id)}
                  menuMaxHeight={200}
                />
              </div>
            </div>

            <br />

            <Icd10Search
              object={vaccine}
              setOpject={setVaccine}
              fieldName="indications"
              label="Indications (ICD-10)"
              mode="multiICD10"
            />
            <AdversEffects
              object={vaccine}
              setOpject={setVaccine}
              fieldName="possibleReactions"
              label="Possible Reactions"
            />

            <div className="container-of-two-fields-vaccine">
              <div className="container-of-field-vaccine">
                <MyInput
                  width="100%"
                  fieldType="textarea"
                  disabled={!edit_new}
                  fieldName="contraindicationsAndPrecautions"
                  record={vaccine}
                  setRecord={setVaccine}
                />
              </div>
              <div className="container-of-field-vaccine">
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
            <div className="container-of-add-new-button">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setVaccineBrand({ ...newVaccineBrand, vaccineId: vaccine?.id });
                  setEditBrand(true);
                  setOpenChildModal(true);
                }}
                width="109px"
              >
                Add New
              </MyButton>
            </div>

            <MyTable
              height={450}
              data={vaccine?.id ? tableData : []}
              totalCount={vaccine?.id ? totalCount : 0}
              loading={isFetching}
              columns={tableColumns}
              rowClassName={isSelectedBrand}
              onRowClick={(rowData: VaccineBrand) => setVaccineBrand(rowData)}
              // sorting like Vaccine page
              sortColumn={sortBy}
              sortType={sortType}
              onSortChange={(col, type) => {
                if (!col || !type) return;
                const safeCol = col === 'id' || col === 'name' ? col : 'id';
                handleSortChange(safeCol as 'id' | 'name', type as 'asc' | 'desc');
              }}
              // pagination like Vaccine page
              page={page}
              rowsPerPage={size}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
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

  const conjureFormContentOfChildModal = () => (
    <Form layout="inline" fluid>
      <MyInput
        required
        width={350}
        column
        fieldLabel="Brand Name"
        fieldName="name"
        record={vaccineBrand}
        setRecord={setVaccineBrand}
        disabled={!editBrand && !vaccine?.id}
      />
      <MyInput
        required
        width={350}
        column
        fieldLabel="manufacture"
        fieldType="select"
        fieldName="manufacture"
        selectData={manufactureLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={vaccineBrand}
        setRecord={setVaccineBrand}
        disabled={!editBrand && !vaccine?.id}
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
        disabled={!editBrand && !vaccine?.id}
      />
      <MyInput
        required
        width={350}
        column
        fieldLabel="Unit"
        fieldType="select"
        fieldName="unit"
        selectData={volumUnit ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={vaccineBrand}
        setRecord={setVaccineBrand}
        disabled={!editBrand && !vaccine?.id}
        menuMaxHeight={200}
      />
      <MyInput
        width={350}
        column
        fieldLabel="Marketing Authorization Holder"
        fieldName="marketingAuthorizationHolder"
        record={vaccineBrand}
        setRecord={setVaccineBrand}
        disabled={!editBrand && !vaccine?.id}
      />
    </Form>
  );

  return (
    <ChildModal
      actionChildButtonFunction={handleSaveVaccineBrand}
      actionButtonFunction={() => setOpen(false)}
      open={open}
      setOpen={setOpen}
      showChild={openChildModal}
      setShowChild={setOpenChildModal}
      title={vaccine?.id ? 'Edit Vaccine' : 'New Vaccine'}
      mainContent={conjureFormContentOfMainModal}
      mainStep={[
        {
          title: 'Vaccine Details',
          icon: <MdVaccines />,
          disabledNext: !vaccine?.id,
          footer: <MyButton onClick={handleSave}>Save</MyButton>
        },
        { title: 'Brand Products', icon: <MdMedication /> }
      ]}
      childTitle={
        vaccineBrand?.id ? 'Edit Brand Product of Vaccine' : 'New Brand Product of Vaccine'
      }
      childContent={conjureFormContentOfChildModal()}
      mainSize="sm"
    />
  );
};

export default AddEditVaccine;
