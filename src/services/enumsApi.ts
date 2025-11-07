// src/services/enumsApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import type { OpenAPIV3_1 } from 'openapi-types';
import { BaseQuery, onQueryStarted } from '../newApi';
import { useMemo } from 'react';

/* -------------------------------- Types -------------------------------- */

export type Enumerations = Record<string, string[]>;

export type EnumOptionsParams = {
  exclude?: string[];
  labelOverrides?: Record<string, string>;
  labelFormatter?: (value: string) => string;
};

/* ------------------------------- Helpers ------------------------------- */

type SchemaOrRef = OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject;

const isRef = (s: SchemaOrRef): s is OpenAPIV3_1.ReferenceObject => !!(s as any).$ref;

const isArraySchema = (s: OpenAPIV3_1.SchemaObject): s is OpenAPIV3_1.ArraySchemaObject =>
  s.type === 'array' || (!!(s as any).items && 'items' in s);

const isStringSchema = (
  s: OpenAPIV3_1.SchemaObject
): s is OpenAPIV3_1.SchemaObject & { enum?: string[] } =>
  s.type === 'string' || Array.isArray((s as any).enum);

function resolveSchema(
  spec: OpenAPIV3_1.Document,
  schemaOrRef?: SchemaOrRef
): OpenAPIV3_1.SchemaObject {
  if (!schemaOrRef) return {};
  if (isRef(schemaOrRef)) {
    const ref = schemaOrRef.$ref;
    const path = ref.replace(/^#\//, '').split('/');
    let node: any = spec as any;
    for (const key of path) node = node?.[key];
    if (!node) return {};
    return resolveSchema(spec, node as SchemaOrRef);
  }
  return schemaOrRef;
}

function extractEnumStrings(
  spec: OpenAPIV3_1.Document,
  schema: OpenAPIV3_1.SchemaObject
): string[] {
  if (isArraySchema(schema)) {
    const itemsResolved = resolveSchema(spec, (schema as OpenAPIV3_1.ArraySchemaObject).items);
    if (isStringSchema(itemsResolved) && Array.isArray(itemsResolved.enum)) {
      return itemsResolved.enum.map(String);
    }
    return [];
  }
  if (isStringSchema(schema) && Array.isArray(schema.enum)) {
    return schema.enum.map(String);
  }
  return [];
}

/* --------------------------- Default labeler --------------------------- */
function formatEnumLabel(value: string) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/* --------------------------------- API --------------------------------- */

export const enumsApi = createApi({
  reducerPath: 'enumsApi',
  baseQuery: BaseQuery,
  endpoints: (builder) => ({
    getAllEnums: builder.query<Enumerations, void>({
      query: () => '/setup-service/v3/api-docs',
      transformResponse: (spec: OpenAPIV3_1.Document): Enumerations => {
        const enumsSchema = spec.components?.schemas?.['Enumerations'];
        if (!enumsSchema || typeof enumsSchema !== 'object') return {};
        const properties = (enumsSchema as OpenAPIV3_1.SchemaObject).properties ?? {};
        const out: Enumerations = {};
        for (const [propName, propSchema] of Object.entries(properties)) {
          const resolved = resolveSchema(spec, propSchema as SchemaOrRef);
          out[propName] = extractEnumStrings(spec, resolved);
        }
        return out;
      },
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
    }),
  }),
});

export const { useGetAllEnumsQuery } = enumsApi;

/* -------------------------------- Hooks -------------------------------- */

export function useEnumByName(name: string): string[] {
  const { data: allEnums = {} } = useGetAllEnumsQuery();
  return allEnums[name] ?? [];
}

export function useEnumOptions(
  name: string,
  params: EnumOptionsParams = {}
): { value: string; label: string }[] {
  const values = useEnumByName(name);
  const { exclude = [], labelOverrides = {}, labelFormatter } = params;

  return useMemo(() => {
    const filtered = values.filter((v) => !exclude.includes(v));
    const fmt = labelFormatter ?? formatEnumLabel;

    return filtered.map((v) => ({
      value: v,
      label: labelOverrides[v] ?? fmt(v),
    }));
  }, [values, exclude, labelOverrides, labelFormatter]);
}

export function useEnumCapitalized(
  name: string,
  params: Omit<EnumOptionsParams, 'labelFormatter'> & { labelFormatter?: (v: string) => string } = {}
): { value: string; label: string }[] {
  const values = useEnumByName(name);
  const { exclude = [], labelOverrides = {}, labelFormatter } = params;

  return useMemo(() => {
    const filtered = values.filter((v) => !exclude.includes(v));
    const fmt = labelFormatter ?? ((v: string) => v);
    return filtered.map((v) => ({
      value: v,
      label: labelOverrides[v] ?? fmt(v),
    }));
  }, [values, exclude, labelOverrides, labelFormatter]);
}
