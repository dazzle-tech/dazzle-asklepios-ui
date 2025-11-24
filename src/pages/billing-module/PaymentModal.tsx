// import { useAppDispatch } from '@/hooks';
// import AddOutlineIcon from '@rsuite/icons/AddOutline';
// import MyButton from '@/components/MyButton/MyButton';
// import { newApEncounter } from '@/types/model-types-constructor';
// import React, { useEffect, useState } from 'react';
// import 'react-tabs/style/react-tabs.css';
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
// import { faBroom } from '@fortawesome/free-solid-svg-icons';
// import { faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
// import { faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';
// import { useCompleteEncounterRegistrationMutation } from '@/services/encounterService';
// import { notify } from '@/utils/uiReducerActions';
// import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
// import { calculateAgeFormat } from '@/utils';
// import MyModal from '@/components/MyModal/MyModal';
// // import '../styles.less';
// import PatientPaymentInfo from './PatientPaymentInfo';
// import AddPayment from './AddPayment';

// const PaymentModal = ({open, localPatient,setOpen, localVisit, isDisabeld = false }) => {
//     const dispatch = useAppDispatch();
//     const [localEncounter, setLocalEncounter] = useState({ ...newApEncounter, visitTypeLkey: '2041082245699228', patientKey: localPatient.key, plannedStartDate: new Date(), patientAge: calculateAgeFormat(localPatient.dob), discharge: false });
//     const [validationResult, setValidationResult] = useState({});
//     const [saveEncounter, saveEncounterMutation] = useCompleteEncounterRegistrationMutation();
//     const [isReadOnly, setIsReadOnly] = useState(isDisabeld);
//     const encounterStatusNew = '91063195286200'; // TODO change this to be fetched from redis based on LOV CODE

//     // Handle Save Encounter
//     const handleSave = () => {
//         if (localEncounter && localEncounter.patientKey) {
//             saveEncounter({
//                 ...localEncounter,
//                 patientKey: localPatient.key,
//                 plannedStartDate: new Date(),
//                 encounterStatusLkey: ["4217389643435490", "5433343011954425", "2039548173192779"].includes(localEncounter?.resourceTypeLkey) ? "5256965920133084" : localEncounter?.resourceTypeLkey === "6743167799449277" ? "8890456518264959" : encounterStatusNew,
//                 patientAge: calculateAgeFormat(localPatient.dob),
//                 visitTypeLkey: ['2039534205961578', '2039516279378421'].includes(localEncounter.resourceTypeLkey) ? '2041082245699228' : null
//             }).unwrap().then().catch(e => {

//                 if (e.status === 422) {
//                     console.log("Validation error: Unprocessable Entity", e);

//                 } else {
//                     console.log("An unexpected error occurred", e);
//                     dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
//                 }
//             });
//         } else {
//             dispatch(notify({ msg: 'encounter not linked to patient', sev: 'error' }));
//         }
//     };
//     // Handle Clear Fields
//     const handleClear = () => {
//         setLocalEncounter({
//             ...newApEncounter, patientKey: localPatient.key, plannedStartDate: new Date(),
//             encounterStatusLkey: undefined,
//             encounterClassLkey: null,
//             encounterPriorityLkey: null,
//             encounterTypeLkey: null,
//             serviceTypeLkey: null,
//             patientStatusLkey: null,
//             basedOnLkey: null,
//             visitTypeLkey: null,
//             physicalExamSummeryKey: null,
//             dischargeTypeLkey: null,
//             paymentTypeLkey: null,
//             payerTypeLkey: null,
//             locationTypeLkey: null,
//             physicianKey: null,
//             departmentKey: null,
//             reasonLkey: null,
//             discharge: false
//         });
//     };
//     // Effects
//     useEffect(() => {
//         if (saveEncounterMutation && saveEncounterMutation.status === 'fulfilled') {
//             setLocalEncounter(saveEncounterMutation.data);;
//             dispatch(notify({ msg: 'Encounter Saved Successfuly', sev: "success" }));
//         } else if (saveEncounterMutation && saveEncounterMutation.status === 'rejected') {
//             setValidationResult(saveEncounterMutation.error);
//         }
//     }, [saveEncounterMutation]);
//     useEffect(() => {
//         if (localVisit?.key != undefined) {
//             setLocalEncounter({ ...localVisit });
//             setIsReadOnly(true);
//         }
//     }, [localVisit]);

//     // This function returns the appropriate form component based on the current step number.
//     // Step 0: Shows the RegistrationEncounter component.
//     // Step 1: Shows the PatientPaymentInfo component.
//     // Step 2: Shows the AddPayment component. 
//     const conjureFormContent = stepNumber => {
//         switch (stepNumber) {
            
//             case 0:
//                 return (
//                     <PatientPaymentInfo localPatient={localPatient} localEncounter={localEncounter} setLocalEncounter={setLocalEncounter} isReadOnly={isReadOnly} />
//                 );
//             case 1:
//                 return (
//                     <AddPayment isReadOnly={isReadOnly} />
//                 );
//         };
//     };

//     return (
//         <MyModal
//             open={open}
//             setOpen={setOpen}
//             title="Payment"
//             steps={[
//             //     {
//             //     title: 'Encounter', disabledNext: !localEncounter?.key, icon: <FontAwesomeIcon icon={faCalendarCheck} />, footer: <><MyButton prefixIcon={() => <FontAwesomeIcon icon={faBroom} />} onClick={handleClear} disabled={isReadOnly} >Clear</MyButton>
//             //         <MyButton
//             //             disabled={isReadOnly}
//             //             onClick={handleSave}
//             //             prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}>Save</MyButton> </>
//             // }
//                  {
//                 title: 'Payment', icon: <FontAwesomeIcon icon={faFileInvoiceDollar} />, footer: <MyButton
//                     disabled={isReadOnly}
//                     prefixIcon={() => <AddOutlineIcon />}
//                 >
//                    Add payment
//                 </MyButton>
//             }
//                 , { title: 'Add Payment', icon: <FontAwesomeIcon icon={faMoneyBillWave} /> }]}
//             content={step => conjureFormContent(step)}
//             size="55vw"
//             bodyheight="65vh"
//             hideActionBtn={isReadOnly}
//         />
//     );
// };
// export default PaymentModal;
import { useAppDispatch } from '@/hooks';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyButton from '@/components/MyButton/MyButton';
import { newApEncounter } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import 'react-tabs/style/react-tabs.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faBroom, faMoneyBillWave, faFileInvoiceDollar, faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { useCompleteEncounterRegistrationMutation } from '@/services/encounterService';
import { notify } from '@/utils/uiReducerActions';
import { calculateAgeFormat } from '@/utils';
import MyModal from '@/components/MyModal/MyModal';
import PatientPaymentInfo from './PatientPaymentInfo';
import AddPayment from './AddPayment';

// نفس BillingItem/Invoice اللي عندك في Invoices.tsx
type BillingItem = {
  id: string;
  clinic: string;
  chargeDate: string;
  type: string;
  name: string;
  price: number;
  currency: string;
  discount: number;
  priceList: string;
  patientKey: string;
  quantity?: number;
};

type Invoice = {
  invoiceNumber: string;
  createdBy: string;
  createdAt: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Partially';
  method: string;
  patientKey: string;
  items: BillingItem[];
};

type PaymentModalProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  localPatient: any;
  localVisit: any;
  isDisabeld?: boolean;
  invoice?: Invoice | null;   // 🔹 الفاتورة اللي جايه من Invoices
};

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  localPatient,
  setOpen,
  localVisit,
  isDisabeld = false,
  invoice
}) => {
  const dispatch = useAppDispatch();
  const [localEncounter, setLocalEncounter] = useState({
    ...newApEncounter,
    visitTypeLkey: '2041082245699228',
    patientKey: localPatient.key,
    plannedStartDate: new Date(),
    patientAge: calculateAgeFormat(localPatient.dob),
    discharge: false
  });
  const [validationResult, setValidationResult] = useState({});
  const [saveEncounter, saveEncounterMutation] =
    useCompleteEncounterRegistrationMutation();
  const [isReadOnly, setIsReadOnly] = useState(isDisabeld);
  const encounterStatusNew = '91063195286200';

  const handleSave = () => {
    if (localEncounter && localEncounter.patientKey) {
      saveEncounter({
        ...localEncounter,
        patientKey: localPatient.key,
        plannedStartDate: new Date(),
        encounterStatusLkey: ['4217389643435490', '5433343011954425', '2039548173192779'].includes(
          localEncounter?.resourceTypeLkey
        )
          ? '5256965920133084'
          : localEncounter?.resourceTypeLkey === '6743167799449277'
          ? '8890456518264959'
          : encounterStatusNew,
        patientAge: calculateAgeFormat(localPatient.dob),
        visitTypeLkey: ['2039534205961578', '2039516279378421'].includes(
          localEncounter.resourceTypeLkey
        )
          ? '2041082245699228'
          : null
      })
        .unwrap()
        .then()
        .catch(e => {
          if (e.status === 422) {
            console.log('Validation error: Unprocessable Entity', e);
          } else {
            console.log('An unexpected error occurred', e);
            dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
          }
        });
    } else {
      dispatch(
        notify({ msg: 'encounter not linked to patient', sev: 'error' })
      );
    }
  };

  const handleClear = () => {
    setLocalEncounter({
      ...newApEncounter,
      patientKey: localPatient.key,
      plannedStartDate: new Date(),
      encounterStatusLkey: undefined,
      encounterClassLkey: null,
      encounterPriorityLkey: null,
      encounterTypeLkey: null,
      serviceTypeLkey: null,
      patientStatusLkey: null,
      basedOnLkey: null,
      visitTypeLkey: null,
      physicalExamSummeryKey: null,
      dischargeTypeLkey: null,
      paymentTypeLkey: null,
      payerTypeLkey: null,
      locationTypeLkey: null,
      physicianKey: null,
      departmentKey: null,
      reasonLkey: null,
      discharge: false
    });
  };

  useEffect(() => {
    if (saveEncounterMutation && saveEncounterMutation.status === 'fulfilled') {
      setLocalEncounter(saveEncounterMutation.data);
      dispatch(
        notify({ msg: 'Encounter Saved Successfuly', sev: 'success' })
      );
    } else if (saveEncounterMutation && saveEncounterMutation.status === 'rejected') {
      setValidationResult(saveEncounterMutation.error as any);
    }
  }, [saveEncounterMutation, dispatch]);

  useEffect(() => {
    if (localVisit?.key !== undefined) {
      setLocalEncounter({ ...localVisit });
      setIsReadOnly(true);
    }
  }, [localVisit]);

  // ✅ هنا نحقن items تبعت الفاتورة في AddPayment
  const conjureFormContent = (stepNumber: number) => {
    switch (stepNumber) {
      case 0:
        return (
          <PatientPaymentInfo
            localPatient={localPatient}
            localEncounter={localEncounter}
            setLocalEncounter={setLocalEncounter}
            isReadOnly={isReadOnly}
          />
        );
      case 1:
        return (
          <AddPayment
            isReadOnly={isReadOnly}
            invoiceItems={invoice?.items ?? []} // 🔹 هنا أرسلنا آيتم الفاتورة
          />
        );
      default:
        return null;
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Payment"
      steps={[
        // لو بدك ترجعي encounter step رجّعي البلوك اللي تحت
        // {
        //   title: 'Encounter',
        //   disabledNext: !localEncounter?.key,
        //   icon: <FontAwesomeIcon icon={faCalendarCheck} />,
        //   footer: (
        //     <>
        //       <MyButton
        //         prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
        //         onClick={handleClear}
        //         disabled={isReadOnly}
        //       >
        //         Clear
        //       </MyButton>
        //       <MyButton
        //         disabled={isReadOnly}
        //         onClick={handleSave}
        //         prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
        //       >
        //         Save
        //       </MyButton>
        //     </>
        //   )
        // },
        {
          title: 'Payment',
          icon: <FontAwesomeIcon icon={faFileInvoiceDollar} />,
          footer: (
            <MyButton
              disabled={isReadOnly}
              prefixIcon={() => <AddOutlineIcon />}
            >
              Add payment
            </MyButton>
          )
        },
        {
          title: 'Add Payment',
          icon: <FontAwesomeIcon icon={faMoneyBillWave} />
        }
      ]}
      content={step => conjureFormContent(step)}
      size="55vw"
      bodyheight="65vh"
      hideActionBtn={isReadOnly}
    />
  );
};

export default PaymentModal;
