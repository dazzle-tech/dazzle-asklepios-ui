

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
import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService ';
import {
  BrandMedication,
  InventoryProduct,
  BillingInvoiceCreateVM,
  BillingInvoiceItemCreateVM,
  BillingItem,
} from '@/types/model-types-new';

import {
  useCreateInvoiceMutation,
  useCreateInvoiceItemMutation,
  useGetPatientAccountSummaryQuery,
} from '@/services/billing/BillingService';

// ---------- CONSTANTS ----------

// ---------- COMPONENT ----------

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
  const [createInvoice] = useCreateInvoiceMutation();
  const [createInvoiceItem] = useCreateInvoiceItemMutation();

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

  const {
    data: patientServicesAndProductsResponse,
    refetch: refetchPatientServicesAndProductsByPatient,
  } = useGetPatientServicesAndProductsByPatientQuery(
    {
      patientId: Number(patient?.id),
      page: 0,
      size: 500,
      sort: 'id,desc',
    },
    {
      skip: !patient?.id,
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

  // ---------- إنشاء Invoice من الـ Billing + تحديث is_valid + تحديث Balance ----------

  const handleCreateInvoiceFromBilling = async (selectedIds: string[]) => {
    if (!patient?.key || selectedIds.length === 0) return;

    const facilityId = authSlice?.tenant?.selectedFacility?.id;
    if (!facilityId) return;

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
      // 1) إنشاء الفاتورة
      const invoicePayload: BillingInvoiceCreateVM = {
        facilityId,
        patientKey: patient.key,
        encounterKey: encounter?.key ?? null,
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        currency,
      };

      const invoice = await createInvoice(invoicePayload).unwrap();

      // 2) إنشاء Invoice Items
      const itemPayloads: BillingInvoiceItemCreateVM[] = itemsToInvoice.map(
        item => ({
          invoiceId: invoice.id,
          nurseServiceProductKey: item.nurseServiceProductKey,
          code: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice:
            item.totalPrice ?? item.price * (item.quantity || 1),
          currency: item.currency,
        })
      );

      await Promise.all(itemPayloads.map(p => createInvoiceItem(p).unwrap()));

      // 4) نعمل refetch للـ list من patient services/products
      if (patient?.id) await refetchPatientServicesAndProductsByPatient();

      // 5) نحدث الـ balance في كرت المريض
      await refetchAccountSummary();

      // 6) ننظف الـ state المحلي برضه
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
    if (!patient?.id) return;
    console.log('[Accounting] Selected patient -> loading services/products', {
      patientId: Number(patient.id),
      patientKey: patient?.key,
    });
  }, [patient?.id, patient?.key]);

  useEffect(() => {
    if (!patient?.key || !patientServicesAndProductsResponse?.data) {
      setAllBillingItems([]);
      setFilteredBilling([]);
      return;
    }

    const apiRows = patientServicesAndProductsResponse.data ?? [];
    console.log('[Accounting] patient services/products API response', {
      patientId: patient?.id,
      totalRows: apiRows.length,
      rows: apiRows,
    });

    const mapped: BillingItem[] = apiRows.map((row, index) => {
      const id = String(row.id ?? index);
      const category = String(row.category ?? '').toUpperCase();

      const type =
        category === 'SERVICE'
          ? 'Service'
          : category === 'PRODUCT'
          ? 'Product'
          : 'Other';

      let name = `Item #${id}`;
      let clinic = '';

      if (category === 'SERVICE') {
        const service = services.find(s => s.id === row.serviceId);
        name = service?.name ?? `Service #${row.serviceId}`;
      } else if (category === 'PRODUCT') {
        const product = getProductById(row.productId);
        if (product) {
          if (product.type === 'MEDICATION' && product.brandId) {
            const brand = getBrandById(product.brandId);
            name = brand?.name ?? product.name;
          } else {
            name = product.name;
          }
        } else {
          name = `Product #${row.productId}`;
        }
      }

      const quantity = Number(row.quantity ?? 1);
      const serviceRow = services.find(s => s.id === row.serviceId) as any;
      const productRow = getProductById(row.productId) as any;
      const price = Number(
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
        currency: 'USD',
        discount: 0,
        priceList: 'Standard',
        patientKey: String(patient.key),
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
    if (!patient?.key) {
      setFilteredBilling([]);
      return;
    }

    const patientItems = allBillingItems.filter(
      item => item.patientKey === patient.key
    );
    setFilteredBilling(patientItems);
  }, [patient, allBillingItems]);

  // ---------- UI SECTIONS ----------

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

                  // Direction handling for RTL/LTR
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
