// import React, { useEffect, useState } from 'react';
// import { Form } from 'rsuite';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faMagnifyingGlass, faBroom } from '@fortawesome/free-solid-svg-icons';
// import { getHeight } from 'rsuite/esm/DOMHelper';

// import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
// import { useAppDispatch, useAppSelector } from '@/hooks';
// import { setDivContent, setPageCode } from '@/reducers/divSlice';

// import MyTab from '@/components/MyTab';
// import SectionContainer from '@/components/SectionsoContainer';
// import MyInput from '@/components/MyInput';
// import MyButton from '@/components/MyButton/MyButton';

// import Billing from './Billing';
// import Invoices from './Invoices';
// import Receipt from './Receipt';
// import ProfileSidebar from '../patient/patient-profile/ProfileSidebar-new';
// import PatientSide from '../encounter/encounter-main-info-section/PatienSide';

// // ---- NEW IMPORTS ----
// import { initialListRequest, ListRequest } from '@/types/types';
// import { useGetNurseServiceProductListQuery } from '@/services/encounterService';
// import { ApNurseServiceProduct } from '@/types/model-types';

// import { useGetServicesQuery } from '@/services/setup/serviceService';
// import { useGetInventoryProductsQuery } from '@/services/inventory/inventory-products/inventoryProductsService';
// import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService ';
// import { BrandMedication, InventoryProduct } from '@/types/model-types-new';

// // ---------- TYPES ----------

// type BillingItem = {
//   id: string;
//   clinic: string;
//   chargeDate: string; // 'YYYY-MM-DD'
//   type: string;
//   name: string;
//   price: number;      // unit price
//   totalPrice: number; // 👈 NEW: total price (qty * unitPrice أو من الـ backend)
//   currency: string;
//   discount: number;
//   priceList: string;
//   patientKey: string;
//   quantity: number;
// };

// type Invoice = {
//   invoiceNumber: string;
//   createdBy: string;
//   createdAt: string; // 'YYYY-MM-DD'
//   amount: number;
//   status: 'Pending' | 'Paid' | 'Partially';
//   method: string;
//   patientKey: string;
//   items: BillingItem[];
// };

// const SERVICE_CATEGORY_LKEY = '19257854232732994';
// const PRODUCT_CATEGORY_LKEY = '19257880375908711';

// // ---------- COMPONENT ----------

// const Accounting: React.FC = () => {
//   const dispatch = useAppDispatch();
//   const authSlice = useAppSelector((state) => state.auth);

//   const [encounter, setEncounter] = useState({ ...newApEncounter });

//   // patient selection
//   const [expand, setExpand] = useState<boolean>(false);
//   const [patient, setPatient] = useState<any>({ ...newApPatient });

//   const [windowHeight] = useState(getHeight(window));
//   const [refetchData, setRefetchData] = useState(false);

//   // date filter
//   const [dateFilter, setDateFilter] = useState<any>({
//     fromDate: new Date(),
//     toDate: new Date()
//   });

//   // "backend" state
//   const [allBillingItems, setAllBillingItems] = useState<BillingItem[]>([]);
//   const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);

//   // what is actually shown in Billing tab
//   const [filteredBilling, setFilteredBilling] = useState<BillingItem[]>([]);

//   const balance = {
//     freeBalance: 250,
//     outstanding: 1025
//   };

//   const divContent = 'Accounting';

//   // ---- ListRequest for nurse-service-product-list ----
//   const [nurseServiceProductListRequest, setNurseServiceProductListRequest] =
//     useState<ListRequest>({
//       ...initialListRequest,
//       filters: [],
//       pageSize: 100
//     });

//   // ---- Call nurse-service-product-list API ----
//   const {
//     data: nurseServiceProductListResponse,
//     isFetching
//   } = useGetNurseServiceProductListQuery(nurseServiceProductListRequest, {
//     skip: !patient?.key
//   });

//   // ---- Master data (services / products / brands) ----
//   const page = 0;
//   const size = 100;
//   const sort = 'id,asc';

//   const { data: serviceListResponse } = useGetServicesQuery({
//     facilityId: authSlice?.tenant?.selectedFacility?.id,
//     page,
//     size,
//     sort
//   });

//   const { data: inventoryProductsResponse } = useGetInventoryProductsQuery({
//     page,
//     size,
//     sort
//   });

//   const { data: brandMedicationList } = useGetAllBrandMedicationsQuery({
//     page: 0,
//     size: 500,
//     sort: 'id,asc'
//   });

//   const services = serviceListResponse?.data ?? [];
//   const products: InventoryProduct[] = inventoryProductsResponse?.data ?? [];
//   const brands: BrandMedication[] = brandMedicationList?.data ?? [];

//   const getProductById = (id?: number | string) =>
//     products.find(p => String(p.Id) === String(id));

//   const getBrandById = (id?: number | string) =>
//     brands.find(b => String(b.id) === String(id));

//   // -----------------------------------------------------------

//   useEffect(() => {
//     dispatch(setPageCode('Operation_Module'));
//     dispatch(setDivContent(divContent));
//   }, [dispatch]);

//   useEffect(() => {
//     console.log('patient', patient);
//   }, [patient]);

//   // ---------- HELPERS ----------

//   const applyDateFilterToBilling = (
//     items: BillingItem[],
//     fromDate: Date | null,
//     toDate: Date | null
//   ) => {
//     return items.filter(item => {
//       const itemDate = new Date(item.chargeDate);

//       if (fromDate && itemDate < fromDate) return false;
//       if (toDate && itemDate > toDate) return false;

//       return true;
//     });
//   };

//   // ---------- HANDLERS ----------

//   const handleSearch = () => {
//     if (!patient?.key) return;

//     const fromDate = dateFilter.fromDate ? new Date(dateFilter.fromDate) : null;
//     const toDate = dateFilter.toDate ? new Date(dateFilter.toDate) : null;

//     const patientItems = allBillingItems.filter(
//       item => item.patientKey === patient.key
//     );

//     const billing = applyDateFilterToBilling(patientItems, fromDate, toDate);
//     setFilteredBilling(billing);
//   };

//   const handleClearFilters = () => {
//     setDateFilter({
//       fromDate: null,
//       toDate: null
//     });

//     if (!patient?.key) {
//       setFilteredBilling([]);
//       return;
//     }

//     const patientItems = allBillingItems.filter(
//       item => item.patientKey === patient.key
//     );
//     setFilteredBilling(patientItems);
//   };

//   // ✅ زر يحوّل كل العناصر المعروضة في الجدول (filteredBilling) لفاتورة واحدة
//   const handleCreateInvoiceForAllFiltered = () => {
//     if (!patient?.key) return;
//     if (!filteredBilling.length) return;

//     const selectedIds = filteredBilling.map(item => item.id);
//     handleCreateInvoiceFromBilling(selectedIds);
//   };

//   // Create an invoice from selected billing row IDs
//   const handleCreateInvoiceFromBilling = (selectedIds: string[]) => {
//     if (!patient?.key || selectedIds.length === 0) return;

//     const itemsToInvoice = allBillingItems.filter(item =>
//       selectedIds.includes(item.id)
//     );

//     if (itemsToInvoice.length === 0) return;

//     const totalAmount = itemsToInvoice.reduce((sum, item) => {
//       const baseTotal =
//         item.totalPrice ?? item.price * (item.quantity || 1);
//       const afterDiscount = baseTotal - (item.discount || 0);
//       return sum + afterDiscount;
//     }, 0);

//     const newInvoiceNumber = `INV-${(allInvoices.length + 1)
//       .toString()
//       .padStart(3, '0')}`;

//     const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

//     const newInvoice: Invoice = {
//       invoiceNumber: newInvoiceNumber,
//       createdBy: 'systemadmin',
//       createdAt: today,
//       amount: totalAmount,
//       status: 'Pending',
//       method: 'N/A',
//       patientKey: patient.key ?? 'DEMO',
//       items: itemsToInvoice
//     };

//     // 1) add the new invoice
//     setAllInvoices(prev => [...prev, newInvoice]);

//     // 2) remove invoiced items from the "unbilled" list
//     const updatedBilling = allBillingItems.filter(
//       item => !selectedIds.includes(item.id)
//     );
//     setAllBillingItems(updatedBilling);

//     // 3) auto-refresh Billing according to current date filter
//     const fromDate = dateFilter.fromDate
//       ? new Date(dateFilter.fromDate)
//       : null;
//     const toDate = dateFilter.toDate ? new Date(dateFilter.toDate) : null;

//     const updatedFilteredBilling = applyDateFilterToBilling(
//       updatedBilling,
//       fromDate,
//       toDate
//     );

//     setFilteredBilling(updatedFilteredBilling);
//   };

//   // ---------- EFFECTS ----------

//   // عند تغيير المريض: حدّث الفلاتر الخاصة بالـ ListRequest
//   useEffect(() => {
//     if (!patient?.key) {
//       setNurseServiceProductListRequest(prev => ({
//         ...prev,
//         filters: []
//       }));
//       setAllBillingItems([]);
//       setFilteredBilling([]);
//       setAllInvoices([]);
//       return;
//     }

//     setNurseServiceProductListRequest(prev => ({
//       ...prev,
//       filters: [
//         { fieldName: 'patient_key', operator: 'match', value: patient.key },
//         { fieldName: 'deleted_at', operator: 'isNull', value: undefined }
//         // لو حابة تضيفي encounter:
//         // { fieldName: 'encounter_key', operator: 'match', value: encounter?.key },
//       ],
//       pageSize: 100
//     }));
//   }, [patient /*, encounter */]);

//   // تحويل ApNurseServiceProduct[] → BillingItem[] مع اسم السيرفس/البرودكت الحقيقي + totalPrice
//   useEffect(() => {
//     if (!patient?.key || !nurseServiceProductListResponse?.object) {
//       setAllBillingItems([]);
//       setFilteredBilling([]);
//       return;
//     }

//     const apiRows: ApNurseServiceProduct[] =
//       nurseServiceProductListResponse.object ?? [];

//     const mapped: BillingItem[] = apiRows.map(
//       (row: ApNurseServiceProduct, index: number) => {
//         const id = String(row.key ?? index);

//         // النوع
//         const type =
//           row.categoryLkey === SERVICE_CATEGORY_LKEY
//             ? 'Service'
//             : row.categoryLkey === PRODUCT_CATEGORY_LKEY
//             ? 'Product'
//             : 'Other';

//         let name = `Item #${id}`;
//         let clinic = '';

//         // 👇 نفس منطق ServiceAndProductsTab للأسماء
//         if (row.categoryLkey === SERVICE_CATEGORY_LKEY) {
//           const service = services.find(s => s.id === row.serviceId);
//           name = service?.name ? service.name : `Service #${row.serviceId}`;
//           // لو عندك clinic في service تقدري تضيفيه هنا
//           // clinic = service?.clinicName ?? '';
//         } else if (row.categoryLkey === PRODUCT_CATEGORY_LKEY) {
//           const product = getProductById(row.warehouseProductId);
//           if (product) {
//             if (product.type === 'MEDICATION' && product.brandId) {
//               const brand = getBrandById(product.brandId);
//               name = brand?.name ?? product.name;
//             } else {
//               name = product.name;
//             }
//           } else {
//             name = `Product #${row.warehouseProductId}`;
//           }
//         }

//         const quantity = Number(row.quantity ?? 1);
//         const price = Number(row.unitPrice ?? 0);

//         // totalPrice من الـ backend أو نحسبه لو مش موجود
//         const totalPrice =
//           row.totalPrice != null
//             ? Number(row.totalPrice)
//             : price * quantity;

//         // createdAt عندك number → نحطه كتاريخ
//         const dateFromBackend = row.createdAt
//           ? new Date(row.createdAt)
//           : new Date();

//         const chargeDate = dateFromBackend.toISOString().slice(0, 10);

//         return {
//           id,
//           clinic,
//           chargeDate,
//           type,
//           name,
//           price,
//           totalPrice,
//           currency: 'USD', // غيّريها لو عندك عملة من مكان ثاني
//           discount: 0,
//           priceList: 'Standard',
//           patientKey: row.patientKey,
//           quantity
//         };
//       }
//     );

//     setAllBillingItems(mapped);
//     setFilteredBilling(mapped);
//   }, [nurseServiceProductListResponse, patient, services, products, brands]);

//   // إعادة فلترة عند تغيير المريض/البيانات
//   useEffect(() => {
//     if (!patient?.key) {
//       setFilteredBilling([]);
//       setAllInvoices([]);
//       return;
//     }

//     const patientItems = allBillingItems.filter(
//       item => item.patientKey === patient.key
//     );
//     setFilteredBilling(patientItems);
//   }, [patient, allBillingItems]);

//   // ---------- UI SECTIONS ----------

//   const contentOfSearchSection = () => {
//     return (
//       <>
//         <Form layout="inline" fluid className="date-filter-form">
//           <MyInput
//             column
//             width={180}
//             fieldType="date"
//             fieldLabel="From Date"
//             fieldName="fromDate"
//             record={dateFilter}
//             setRecord={setDateFilter}
//             disabled={!patient?.key}
//           />
//           <MyInput
//             width={180}
//             column
//             fieldType="date"
//             fieldLabel="To Date"
//             fieldName="toDate"
//             record={dateFilter}
//             setRecord={setDateFilter}
//             disabled={!patient?.key}
//           />
//         </Form>
//         <div style={{ display: 'flex', gap: '10px', justifyContent: 'end' }}>
//           <MyButton
//             prefixIcon={() => <FontAwesomeIcon icon={faMagnifyingGlass} />}
//             disabled={!patient?.key}
//             onClick={handleSearch}
//           >
//             Search
//           </MyButton>

//           <MyButton
//             prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
//             onClick={handleClearFilters}
//             disabled={!patient?.key}
//           >
//             Clear
//           </MyButton>

//           {/* ⭐ زر يحوّل كل العناصر المعروضة لفاتورة واحدة */}
//           <MyButton
//             onClick={handleCreateInvoiceForAllFiltered}
//             disabled={!patient?.key || filteredBilling.length === 0}
//           >
//             Invoice All
//           </MyButton>
//         </div>
//       </>
//     );
//   };

//   const tabData = [
//     {
//       title: 'Billing',
//       content: (
//         <Billing
//           data={filteredBilling}
//           onCreateInvoice={handleCreateInvoiceFromBilling}
//           patient={patient}
//           // تقدري تمري isFetching لو Billing يدعم لودينغ
//           // isLoading={isFetching}
//         />
//       )
//     },
//     {
//       title: 'Invoices',
//       content: <Invoices data={allInvoices} />
//     },
//     {
//       title: 'Print Receipt(s)',
//       content: <Receipt />
//     }
//   ];

//   return (
//     <div className="container">
//       <div className="left-box" style={{ width: '100%' }}>
//         <SectionContainer
//           title="Search Patient"
//           content={contentOfSearchSection()}
//         />
//         <MyTab data={tabData} />
//       </div>

//       <br />

//       <div>
//         {!patient?.key ? (
//           <ProfileSidebar
//             expand={expand}
//             setExpand={setExpand}
//             windowHeight={windowHeight}
//             setLocalPatient={setPatient}
//             refetchData={refetchData}
//             setRefetchData={setRefetchData}
//           />
//         ) : (
//           <div
//             style={{
//               border: '1px solid var(--rs-border-primary)',
//               borderRadius: '5px'
//             }}
//           >
//             <PatientSide
//               patient={patient}
//               encounter={encounter}
//               setPatient={setPatient}
//               hideVisitDetails
//               balance={balance}
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Accounting;









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
import PatientSide from '../encounter/encounter-main-info-section/PatienSide';

import { initialListRequest, ListRequest } from '@/types/types';
import { useGetNurseServiceProductListQuery } from '@/services/encounterService';
import { ApNurseServiceProduct } from '@/types/model-types';

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

const SERVICE_CATEGORY_LKEY = '19257854232732994';
const PRODUCT_CATEGORY_LKEY = '19257880375908711';

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
  const { data: accountSummary } = useGetPatientAccountSummaryQuery(
    { patientKey: patient?.key },
    { skip: !patient?.key }
  );

  const balance = {
    freeBalance: Number(accountSummary?.freeBalance ?? 0),
    outstanding: Number(accountSummary?.outstandingBalance ?? 0),
  };

  // ---- ListRequest for nurse-service-product-list ----
  const [nurseServiceProductListRequest, setNurseServiceProductListRequest] =
    useState<ListRequest>({
      ...initialListRequest,
      filters: [],
      pageSize: 100,
    });

  const {
    data: nurseServiceProductListResponse,
    isFetching,
    refetch: refetchNurseList,
  } = useGetNurseServiceProductListQuery(nurseServiceProductListRequest, {
    skip: !patient?.key,
  });

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
    products.find(p => String(p.Id) === String(id));

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

      // ✅ لا تعملي refetch، خليه على الـ state
      // refetchNurseList();

      // ✅ شيل الآيتيمز اللي انعملها إنفويس من البيلنغ
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
      setNurseServiceProductListRequest(prev => ({
        ...prev,
        filters: [],
      }));
      setAllBillingItems([]);
      setFilteredBilling([]);
      return;
    }

    setNurseServiceProductListRequest(prev => ({
      ...prev,
      filters: [
        { fieldName: 'patient_key', operator: 'match', value: patient.key },
        { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
      ],
      pageSize: 100,
    }));
  }, [patient]);

  // تحويل ApNurseServiceProduct[] → BillingItem[]
  useEffect(() => {
    if (!patient?.key || !nurseServiceProductListResponse?.object) {
      setAllBillingItems([]);
      setFilteredBilling([]);
      return;
    }

    const apiRows: ApNurseServiceProduct[] =
      nurseServiceProductListResponse.object ?? [];

    const mapped: BillingItem[] = apiRows.map((row, index) => {
      const id = String(row.key ?? index);

      const type =
        row.categoryLkey === SERVICE_CATEGORY_LKEY
          ? 'Service'
          : row.categoryLkey === PRODUCT_CATEGORY_LKEY
          ? 'Product'
          : 'Other';

      let name = `Item #${id}`;
      let clinic = '';

      if (row.categoryLkey === SERVICE_CATEGORY_LKEY) {
        const service = services.find(s => s.id === row.serviceId);
        name = service?.name ?? `Service #${row.serviceId}`;
      } else if (row.categoryLkey === PRODUCT_CATEGORY_LKEY) {
        const product = getProductById(row.warehouseProductId);
        if (product) {
          if (product.type === 'MEDICATION' && product.brandId) {
            const brand = getBrandById(product.brandId);
            name = brand?.name ?? product.name;
          } else {
            name = product.name;
          }
        } else {
          name = `Product #${row.warehouseProductId}`;
        }
      }

      const quantity = Number(row.quantity ?? 1);
      const price = Number(row.unitPrice ?? 0);
      const totalPrice =
        row.totalPrice != null ? Number(row.totalPrice) : price * quantity;

      const dateFromBackend = row.createdAt
        ? new Date(row.createdAt)
        : new Date();

      const chargeDate = dateFromBackend.toISOString().slice(0, 10);

      return {
        id,
        nurseServiceProductKey: String(row.key),
        clinic,
        chargeDate,
        type,
        name,
        price,
        totalPrice,
        currency: 'USD',
        discount: 0,
        priceList: 'Standard',
        patientKey: row.patientKey,
        quantity,
      };
    });

    setAllBillingItems(mapped);
    setFilteredBilling(mapped);
  }, [nurseServiceProductListResponse, patient, services, products, brands]);

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

  return (
    <div className="container">
      <div className="left-box" style={{ width: '100%' }}>
        <SectionContainer
          title="Search Patient"
          content={contentOfSearchSection()}
        />
        <MyTab data={tabData} />
      </div>

      <br />

      <div>
        {!patient?.key ? (
          <ProfileSidebar
            expand={expand}
            setExpand={setExpand}
            windowHeight={windowHeight}
            setLocalPatient={setPatient}
            refetchData={refetchData}
            setRefetchData={setRefetchData}
          />
        ) : (
          <div
            style={{
              border: '1px solid var(--rs-border-primary)',
              borderRadius: '5px',
            }}
          >
            <PatientSide
              patient={patient}
              encounter={encounter}
              setPatient={setPatient}
              hideVisitDetails
              balance={balance}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Accounting;
