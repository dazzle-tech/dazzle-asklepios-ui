# Settlement Report — Field Sources

Screen: **Insurance Claims → Settlement Report**  
Each row is one insurance claim (`claim_request`).

| Field (UI) | Arabic | Source type | Table / field | Fallback / rule |
|---|---|---|---|---|
| Settlement No. | رقم التسوية | Generated | `SET-` + `claim_request.id` | No payer remittance number exists yet |
| Settlement Date | تاريخ التسوية | Claim | `claim_request.submitted_at` | If null → `claim_request.created_date` |
| Insurance Company | شركة التأمين | Patient insurance | `patient_insurances.payer_name` | If blank → NPHIES payer name by `payer_nphies_id`. If claim `patient_insurance_id` is null → use encounter `patient_insurance_id` |
| TPA | شركة إدارة المطالبات | Patient insurance | `patient_insurances.tpa_name` | If blank → NPHIES name by `tpa_nphies_id` / payor `tpa_nphies_id` |
| Claim No. | رقم المطالبة | Claim | `claim_request.prov_claim_no` | If blank → `claim_request.claim_reference` |
| Claim Date | تاريخ المطالبة | Claim | `claim_request.created_date` | — |
| Billed Amount | المبلغ المطالب به | Claim | Sum of `claim_item.net` | If sum is 0 → `claim_request.total_net` |
| Approved Amount | المبلغ المقبول | Derived from claim status | If status is `REJECTED` or `FAILED` → `0` | Else → Insurance Amount. This is **Waseel upload acceptance**, not payer remittance approval |
| Rejected Amount | المبلغ المرفوض | Derived from claim status | If status is `REJECTED` or `FAILED` → Insurance Amount (or Billed Amount if insurance share is 0) | Else → `0` |
| Patient share | المبلغ على المريض | Billing (not claim) | Sum of `claim_item.patient_share` | If that sum is 0 (Waseel stores insurance share only) → sum of `billing_charge_line.patient_responsibility_amount` for linked charge lines |
| Insurance Amount | المبلغ المستحق على التأمين | Claim | Sum of `claim_item.payer_share` | — |
| Paid Amount | المبلغ المدفوع | Invoice | Sum of `financial_document_items.insurance_paid_amount` | **Not from the claim.** Stays `0.00` until insurance payment is posted |
| Outstanding Amount | المبلغ المتبقي | Invoice + claim | Sum of `financial_document_items.insurance_remaining_amount` | If that sum is 0 and Insurance Amount > 0 → Insurance Amount − Paid Amount |
| Settlement Status | حالة التسوية | Derived | `REJECTED` if claim status is `REJECTED` or `FAILED` | `SETTLED` if Paid > 0 and Outstanding ≤ 0; `PARTIALLY_SETTLED` if Paid > 0 and Outstanding > 0; otherwise `UNSETTLED` |

## What comes from the claim vs not

**From the claim (`claim_request` / `claim_item`)**  
Settlement Date, Claim No., Claim Date, Billed Amount, Insurance Amount, and the base used to derive Approved / Rejected.

**Not from the claim**  
- Patient share: billing charge lines  
- Paid Amount / Outstanding Amount: invoice financial document items  
- Settlement No.: generated locally (`SET-{id}`)  
- Insurance Company / TPA: patient insurance master (via claim, or encounter if claim insurance id is empty)

## Current data example

Waseel claim lines often have `patient_share = 0` and `payer_share = net`.  
Paid Amount is `0.00` until a remittance / insurance payment is posted on the invoice.
