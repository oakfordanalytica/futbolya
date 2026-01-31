import type { ColumnDef, SortingState } from "@tanstack/react-table";

export interface FilterOption {
    value: string;
    label: string;
}

export interface FilterConfig {
    id: string;
    label: string;
    options: FilterOption[];
}

export interface DataTableProps<TData> {
    data: TData[];
    columns: ColumnDef<TData, unknown>[];
    filterColumn?: string;
    filterPlaceholder?: string;
    emptyMessage?: string;
    columnsMenuLabel?: string;
    exportButtonLabel?: string;
    filterConfigs?: FilterConfig[];
    filtersMenuLabel?: string;
    previousLabel?: string;
    nextLabel?: string;
    selectedRowsLabel?: (selected: number, total: number) => string;
    initialSorting?: SortingState;
    onCreate?: () => void;
    onExport?: (rows: TData[]) => void;
    onRowClick?: (row: TData) => void;
}

export type Translator = (key: string) => string;
