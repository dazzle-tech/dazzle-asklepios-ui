import { useState } from 'react';
import { useLazyGetAppointableDepartmentsQuery } from '@/services/security/departmentService';
import { useLazyGetServicesByDepartmentQuery } from '@/services/setup/serviceService';
import { useLazyGetPractitionerByDepartmentQuery } from '@/services/setup/practitioner/PractitionerService';

const PAGE_SIZE = 20;

export const useTemplateFormOptions = () => {
  // ─── Departments ─────────────────────────────────────────────────────────────
  const [allDepartments, setAllDepartments] = useState<any[]>([]);
  const [deptHasMore, setDeptHasMore] = useState(false);
  const [deptNextLink, setDeptNextLink] = useState<string | null>(null);
  const [triggerDepartments, { isFetching: isDeptLoading }] = useLazyGetAppointableDepartmentsQuery();

  // ─── Services ─────────────────────────────────────────────────────────────────
  const [allServices, setAllServices] = useState<any[]>([]);
  const [serviceHasMore, setServiceHasMore] = useState(false);
  const [serviceNextLink, setServiceNextLink] = useState<string | null>(null);
  const [triggerServices, { isFetching: isServiceLoading }] = useLazyGetServicesByDepartmentQuery();

  // ─── Practitioners ────────────────────────────────────────────────────────────
  const [allPractitioners, setAllPractitioners] = useState<any[]>([]);
  const [practitionerHasMore, setPractitionerHasMore] = useState(false);
  const [practitionerNextLink, setPractitionerNextLink] = useState<string | null>(null);
  const [triggerPractitioners, { isFetching: isPractitionerLoading }] = useLazyGetPractitionerByDepartmentQuery();

  // ─── Options (derived) ───────────────────────────────────────────────────────
  const departmentOptions = allDepartments.map(d => ({ label: d.name, value: d.id }));
  const serviceOptions = allServices.map(s => ({ label: s.name, value: s.id }));
  const practitionerOptions = allPractitioners.map(p => ({ label: `${p.firstName} ${p.lastName}`, value: p.id }));

  // ─── Load Functions ──────────────────────────────────────────────────────────
  const loadDepartments = async (facilityId: any, page = 0, append = false) => {
    if (!facilityId) return;
    try {
      const res = await triggerDepartments({ facilityId, page, size: PAGE_SIZE, sort: 'id,asc' }).unwrap();
      const rows = res?.data ?? [];
      const next = res?.links?.next ?? null;
      setDeptHasMore(Boolean(next));
      setDeptNextLink(next);
      setAllDepartments(prev =>
        append ? [...prev, ...rows.filter((d: any) => !prev.some((p: any) => p.id === d.id))] : rows
      );
    } catch {
      setAllDepartments([]);
    }
  };

  const loadServices = async (departmentId: any, page = 0, append = false) => {
    if (!departmentId) return;
    try {
      const res = await triggerServices({ sourceId: departmentId, page, size: PAGE_SIZE, sort: 'id,asc' }).unwrap();
      const rows = res?.data ?? [];
      const next = res?.links?.next ?? null;
      setServiceHasMore(Boolean(next));
      setServiceNextLink(next);
      setAllServices(prev =>
        append ? [...prev, ...rows.filter((s: any) => !prev.some((p: any) => p.id === s.id))] : rows
      );
    } catch {
      setAllServices([]);
    }
  };

  const loadPractitioners = async (departmentId: any, page = 0, append = false) => {
    if (!departmentId) return;
    try {
      const res = await triggerPractitioners({ departmentId, page, size: PAGE_SIZE, sort: 'id,asc' }).unwrap();
      const rows = res?.data ?? [];
      const next = res?.links?.next ?? null;
      setPractitionerHasMore(Boolean(next));
      setPractitionerNextLink(next);
      setAllPractitioners(prev =>
        append ? [...prev, ...rows.filter((p: any) => !prev.some((pp: any) => pp.id === p.id))] : rows
      );
    } catch {
      setAllPractitioners([]);
    }
  };

  return {
    departmentOptions,
    isDeptLoading,
    deptHasMore,
    deptNextLink,
    loadDepartments,
    resetDepartments: () => setAllDepartments([]),

    serviceOptions,
    isServiceLoading,
    serviceHasMore,
    serviceNextLink,
    loadServices,
    resetServices: () => setAllServices([]),

    practitionerOptions,
    isPractitionerLoading,
    practitionerHasMore,
    practitionerNextLink,
    loadPractitioners,
    resetPractitioners: () => setAllPractitioners([]),
  };
};
