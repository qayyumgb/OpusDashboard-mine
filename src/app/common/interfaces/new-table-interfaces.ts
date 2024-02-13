export interface EmpFilter {
  name: string;
  options: string[];
  defaultValue: string;
}

export interface FilterOption {
  name: string;
  value: string;
  isdefault: boolean;
}

export interface TableHeader {
  name: string;
  nameFilterValue?: string;
  lastDirection?: 'UP' | 'DOWN';
  filtered?: boolean;
}

export interface ActivitySession {
  date: string,
  device: string;
  worker: string;
  row: string;
  trolley: string;
  pickings: string;
  model_version: string | null;
  archived?: boolean;
}

export interface Column {
  name: string;
  displayName: string;
  showHeader: boolean;
  showHeaderFilter: boolean;
  showTopFilter: boolean;
  filterValue: string;
  filterOptions: any[];
  filtered: boolean;
  showInFooter: boolean;
  footerType: 'total' | 'sum' | 'count' | null,
  footerValue: any;
}

export interface SessionMainAttributes {
  timeRange: string,
  varietyName: string;
  workerName: string;
  rowNumber: string;
  trolleyId: string;
  count: string;
  archived?: boolean;
}
