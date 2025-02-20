import { SortType } from "rsuite/esm/Table";

export interface ListRequestFilter {
  fieldName: string;
  operator: string;
  value: string;
}

export interface ListRequest {
  filters: ListRequestFilter[];
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortType: SortType;
  timestamp:number,
  ignore: boolean,
  filterLogic: string
}
export interface ListRequestAllValues  {
  filters: ListRequestFilter[];
  sortBy: string;
  sortType: SortType;
  timestamp:number,
  ignore: boolean,
  filterLogic: string
}

export const initialListRequest: ListRequest = {
  filters: [],
  pageNumber: 1,
  pageSize: 10,
  sortBy: 'key',
  sortType: 'asc',
  timestamp: 0,
  ignore: false,
  filterLogic: 'and'
};
export const initialListRequestAllValues : ListRequestAllValues  = {
  filters: [],
  sortBy: 'key',
  sortType: 'asc',
  timestamp: 0,
  ignore: false,
  filterLogic: 'and'
};
