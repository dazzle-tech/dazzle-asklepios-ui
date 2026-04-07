

import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faBroom } from '@fortawesome/free-solid-svg-icons';
import { getHeight } from 'rsuite/esm/DOMHelper';

import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';

import MyTab from '@/components/MyTab';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';

import Billing from './Billing';
import Invoices from './Invoices';
import Receipt from './Receipt';
import ProfileSidebar from '../patient/patient-profile/ProfileSidebar-new';
import PatientBillingSide from './PatientBillingSide';

import { useGetPatientServicesAndProductsByPatientQuery } from '@/services/encounters/patientServicesAndProductsService';

import { useGetServicesQuery } from '@/services/setup/serviceService';
import { useGetInventoryProductsQuery } from '@/services/inventory/inventory-products/inventoryProductsService';
import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService';
import {
  BrandMedication,
  InventoryProduct,
  BillingItem,
} from '@/types/model-types-new';

import {
  useGetPatientAccountSummaryQuery,
} from '@/services/billing/BillingService';
import {
  useCreatePatientInvoiceMutation,
} from '@/services/patient/patientBillingInvoiceService';
import {
  useCreatePatientInvoiceItemMutation,
} from '@/services/patient/patientBillingInvoiceItemService';


const Accounting: React.FC = () => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);

  const [encounter, setEncounter] = useState({ ...newApEncounter });
  const [expand, setExpand] = useState<boolean>(false);
  const [patient, setPatient] = useState<any>({ ...newApPatient });

  const [windowHeight] = useState(getHeight(window));
  const [refetchData, setRefetchData] = useState(false);

  const [dateFilter, setDateFilter] = useState<any>({
    fromDate: new Date(),
    toDate: new Date(),
  });

  const [allBillingItems, setAllBillingItems] = useState<BillingItem[]>([]);
  const [filteredBilling, setFilteredBilling] = useState<BillingItem[]>([]);

  const divContent = 'Accounting';

  // ---- RTK Billing mutations ----
  const [createPatientInvoice] = useCreatePatientInvoiceMutation();
  const [createPatientInvoiceItem] = useCreatePatientInvoiceItemMutation();

  // ---- Patient account summary ----
  const {
    data: accountSummary,
    refetch: refetchAccountSummary,
  } = useGetPatientAccountSummaryQuery(
    { patientKey: patient?.key },
    { skip: !patient?.key }
  );

  const balance = {
    freeBalance: Number(accountSummary?.freeBalance ?? 0),
    outstanding: Number(accountSummary?.outstandingBalance ?? 0),
  };

  const toNumericId = (val: unknown): number | null => {
    const n = Number(val as any);
    return Number.isFinite(n) ? n : null;
  };
  const patientNumericId =
    toNumericId(patient?.id) ??
    toNumericId((patient as any)?.patientId) ??
    toNumericId(patient?.key) ??
    null;

  const {
    data: patientServicesAndProductsResponse,
    refetch: refetchPatientServicesAndProductsByPatient,
  } = useGetPatientServicesAndProductsByPatientQuery(
    {
      patientId: patientNumericId as number,
      page: 0,
      size: 500,
      sort: 'id,desc',
    },
    {
      skip: patientNumericId == null,
    }
  );

  // ---- Master data (services / products / brands) ----
  const page = 0;
  const size = 100;
  const sort = 'id,asc';

  const { data: serviceListResponse } = useGetServicesQuery({
    facilityId: authSlice?.tenant?.selectedFacility?.id,
    page,
    size,
    sort,
  });

  const { data: inventoryProductsResponse } = useGetInventoryProductsQuery({
    page,
    size,
    sort,
  });

  const { data: brandMedicationList } = useGetAllBrandMedicationsQuery({
    page: 0,
    size: 500,
    sort: 'id,asc',
  });

  const services = serviceListResponse?.data ?? [];
  const products: InventoryProduct[] = inventoryProductsResponse?.data ?? [];
  const brands: BrandMedication[] = brandMedicationList?.data ?? [];

  const getProductById = (id?: number | string) =>
    products.find(p => String((p as any).id ?? (p as any).Id) === String(id));

  const getBrandById = (id?: number | string) =>
    brands.find(b => String(b.id) === String(id));

  useEffect(() => {
  dispatch(setPageCode('Operation_Module'));
    dispatch(setDivContent(divContent));
  return () => {
    dispatch(setPageCode(''));
    dispatch(setDivContent(''));
  };
}, [dispatch]);

  // ---------- HELPERS ----------

  const applyDateFilterToBilling = (
    items: BillingItem[],
    fromDate: Date | null,
    toDate: Date | null
  ) => {
    return items.filter(item => {
      const itemDate = new Date(item.chargeDate);
      if (fromDate && itemDate < fromDate) return false;
      if (toDate && itemDate > toDate) return false;
      return true;
    });
  };

  // ---------- HANDLERS ----------

  const handleSearch = () => {
    if (!patient?.key) return;

    const fromDate = dateFilter.fromDate ? new Date(dateFilter.fromDate) : null;
    const toDate = dateFilter.toDate ? new Date(dateFilter.toDate) : null;

    const patientItems = allBillingItems.filter(
      item => item.patientKey === patient.key
    );

    const billing = applyDateFilterToBilling(patientItems, fromDate, toDate);
    setFilteredBilling(billing);
  };

  const handleClearFilters = () => {
    setDateFilter({
      fromDate: null,
      toDate: null,
    });

    if (!patient?.key) {
      setFilteredBilling([]);
      return;
    }

    const patientItems = allBillingItems.filter(
      item => item.patientKey === patient.key
    );
    setFilteredBilling(patientItems);
  };


  const handleCreateInvoiceFromBilling = async (selectedIds: string[]) => {
    const hasPatient = patient?.id != null || patient?.key != null;
    if (!hasPatient || selectedIds.length === 0) {
      console.warn('[Accounting] Skip create invoice: missing patient or no selected rows', {
        patient,
        selectedCount: selectedIds.length,
      });
      return;
    }

    const facilityId = authSlice?.tenant?.selectedFacility?.id;
    if (!facilityId) return;
    if (patientNumericId == null || !Number.isFinite(Number(patientNumericId))) {
      console.warn('[Accounting] Cannot create invoice: invalid patientNumericId', {
        patient,
        patientNumericId,
      });
      return;
    }

    const itemsToInvoice = allBillingItems.filter(item =>
      selectedIds.includes(item.id)
    );
    if (!itemsToInvoice.length) return;

    const totalAmount: number = itemsToInvoice.reduce((sum, item) => {
      const baseTotal =
        item.totalPrice ?? item.price * (item.quantity || 1);
      const afterDiscount = baseTotal - (item.discount || 0);
      return sum + afterDiscount;
    }, 0);

    const currency = itemsToInvoice[0]?.currency || 'USD';

    try {
      const invoicePayload = {
        patientId: Number(patient?.id ?? patientNumericId),
        facilityId: Number(facilityId),
        status: 'PENDING',
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        currency,
      };

      console.log('[Accounting] create invoice payload', invoicePayload);
      const invoice = await createPatientInvoice(invoicePayload as any).unwrap();
      console.log('[Accounting] created invoice response', invoice);

      const itemPayloads = itemsToInvoice.map(it => ({
        invoiceId: Number(invoice.id),
        nurseServiceProductId: Number(it.nurseServiceProductKey),
        // Keep both type and display name so payment screens can render full details later.
        code: `${it.type}::${it.name}`,
        quantity: Number(it.quantity),
        unitPrice: Number(it.price),
        totalPrice: Number(it.totalPrice ?? it.price * (it.quantity || 1)),
        currency: it.currency,
      }));

      console.log('[Accounting] create invoice items payloads', itemPayloads);
      await Promise.all(
        itemPayloads.map(p => createPatientInvoiceItem(p as any).unwrap())
      );
      console.log('[Accounting] created invoice items DONE');

      if (patient?.id) await refetchPatientServicesAndProductsByPatient();

      await refetchAccountSummary();

      setAllBillingItems(prev =>
        prev.filter(item => !selectedIds.includes(item.id))
      );
      setFilteredBilling(prev =>
        prev.filter(item => !selectedIds.includes(item.id))
      );
    } catch (e) {
      console.error('Error creating invoice from billing:', e);
    }
  };

  // ---------- EFFECTS ----------

  useEffect(() => {
    if (!patient?.key) {
      setAllBillingItems([]);
      setFilteredBilling([]);
      return;
    }
  }, [patient]);

  useEffect(() => {
    if (patientNumericId == null) {
      console.warn('[Accounting] Skip loading services/products: missing numeric patientId', {
        patientRaw: patient,
      });
      return;
    }
    refetchPatientServicesAndProductsByPatient();
    console.log('[Accounting] Selected patient -> loading services/products', {
      patientId: patientNumericId,
      patientKey: patient?.key,
    });
  }, [patient?.id, patient?.key, patientNumericId]);

  useEffect(() => {
    if (!patientServicesAndProductsResponse?.data) {
      setAllBillingItems([]);
      setFilteredBilling([]);
      return;
    }

    const apiRows = (patientServicesAndProductsResponse.data ?? []).filter(
      (row: any) => !row?.isBilled
    );
    console.log('[Accounting] patient services/products API response', {
      patientId: patient?.id,
      totalRows: apiRows.length,
      rows: apiRows,
    });

    const mapped: BillingItem[] = apiRows.map((row: any, index: number) => {
      const id = String(row.id ?? index);
      const itemType = String(
        row.billingItemType ?? row.category ?? row.productType ?? 'OTHER'
      ).toUpperCase();

      const type =
        itemType === 'SERVICE'
          ? 'Service'
          :  itemType === 'MEDICATION'
          ? 'MEDICATION'
          : itemType === 'PROCEDURE'
          ? 'Procedure'
          : itemType === 'LABORATORY' || itemType === 'RADIOLOGY' || itemType === 'PATHOLOGY'
          ? 'Diagnostic'
          : 'Other';

      let name = `Item #${id}`;
      let clinic = '';

      if (itemType === 'SERVICE') {
        const service = services.find(s => s.id === row.serviceId);
        name = service?.name ?? `Service #${row.serviceId}`;
      } else if (itemType === 'PRODUCT') {
        const product = getProductById(row.productId ?? row.warehouseProductId);
        if (product) {
          if (product.type === 'MEDICATION' && product.brandId) {
            const brand = getBrandById(product.brandId);
            name = brand?.name ?? product.name;
          } else {
            name = product.name;
          }
        } else {
          name = `Product #${row.productId ?? row.warehouseProductId}`;
        }
      } else if (itemType === 'MEDICATION') {
        const brand = getBrandById(row.brandMedicationId ?? row.productId);
        name = brand?.name ?? `Medication #${row.brandMedicationId ?? row.productId}`;
      } else if (itemType === 'LABORATORY' || itemType === 'RADIOLOGY' || itemType === 'PATHOLOGY') {
        name = `Diagnostic #${row.diagnosticTestId ?? row.productId ?? id}`;
      } else if (itemType === 'PROCEDURE') {
        name = `Procedure #${row.procedureId ?? row.productId ?? id}`;
      }

      const quantity = Number(row.quantity ?? 1);
      const serviceRow = services.find(s => s.id === row.serviceId) as any;
      const productRow = getProductById(row.productId ?? row.warehouseProductId) as any;
      const price = Number(
        row?.unitPrice ??
        serviceRow?.price ??
          serviceRow?.unitPrice ??
          productRow?.sellingPrice ??
          productRow?.salePrice ??
          productRow?.price ??
          0
      );
      const totalPrice = price * quantity;

      const dateFromBackend = (row as any).createdDate
        ? new Date((row as any).createdDate)
        : new Date();

      const chargeDate = dateFromBackend.toISOString().slice(0, 10);

      return {
        id,
        nurseServiceProductKey: String(row.id),
        clinic,
        chargeDate,
        type,
        name,
        price,
        totalPrice,
        currency: row?.currency ?? 'USD',
        discount: 0,
        priceList: 'Standard',
        patientKey: String(patientNumericId),
        quantity,
      };
    });

    setAllBillingItems(mapped);
    setFilteredBilling(mapped);
    console.log('[Accounting] mapped billing items', {
      patientId: patient?.id,
      totalRows: mapped.length,
      rows: mapped,
    });
  }, [patientServicesAndProductsResponse, patient, services, products, brands]);

  useEffect(() => {
    setFilteredBilling(allBillingItems);
  }, [allBillingItems]);


  const contentOfSearchSection = () => (
    <>
      <Form layout="inline" fluid className="date-filter-form">
        <MyInput
          column
          width={180}
          fieldType="date"
          fieldLabel="From Date"
          fieldName="fromDate"
          record={dateFilter}
          setRecord={setDateFilter}
          disabled={!patient?.key}
        />
        <MyInput
          width={180}
          column
          fieldType="date"
          fieldLabel="To Date"
          fieldName="toDate"
          record={dateFilter}
          setRecord={setDateFilter}
          disabled={!patient?.key}
        />
      </Form>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'end' }}>
        <MyButton
          prefixIcon={() => <FontAwesomeIcon icon={faMagnifyingGlass} />}
          disabled={!patient?.key}
          onClick={handleSearch}
        >
          Search
        </MyButton>

        <MyButton
          prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
          onClick={handleClearFilters}
          disabled={!patient?.key}
        >
          Clear
        </MyButton>
      </div>
    </>
  );

  const tabData = [
    {
      title: 'Billing',
      content: (
        <Billing
          data={filteredBilling}
          patient={patient}
          onCreateInvoice={handleCreateInvoiceFromBilling}
        />
      ),
    },
    {
      title: 'Invoices',
      content: <Invoices patient={patient} />,
    },
    {
      title: 'Print Receipt(s)',
      content: <Receipt patient={patient} />,
    },
  ];

    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div className="container" dir={dir}>
      <div className="left-box" style={{ width: '100%' }}>
        <SectionContainer
          title="Search Patient"
          content={contentOfSearchSection()}
        />
        <MyTab data={tabData} />
      </div>

      {patient?.id && (
        <div className="right-box">
          <PatientBillingSide
            patient={patient}
            balance={balance}
            setPatient={setPatient}
          />
        </div>
      )}

      {!patient?.id && (
        <div className="right-box">
          <ProfileSidebar
            expand={expand}
            setExpand={setExpand}
            windowHeight={windowHeight}
            setLocalPatient={setPatient}
            refetchData={refetchData}
            setRefetchData={setRefetchData}
          />
        </div>
      )}
    </div>
  );
};

export default Accounting;
