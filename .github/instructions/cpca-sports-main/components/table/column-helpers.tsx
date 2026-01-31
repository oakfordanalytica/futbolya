import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export const createSearchColumn = <T,>(
    fields: Array<keyof T>
): ColumnDef<T> => ({
    id: "search",
    accessorFn: (row) => {
        return fields
            .map((field) => String(row[field] ?? ""))
            .join(" ")
            .toLowerCase();
    },
    enableHiding: false,
    enableSorting: false,
    enableColumnFilter: true,
    meta: {
        filterOnly: true,
    },
});

export const createSortableHeader = (label: string) => {
    return ({ column }: { column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | "asc" | "desc" } }) => (
        <Button
            variant="ghost"
            className="p-0 hover:bg-transparent text-inherit"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
            {label}
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    );
};

export const createTextColumn = <T extends Record<string, unknown>>(
    accessorKey: keyof T & string,
    header: string,
    options?: { sortable?: boolean }
): ColumnDef<T> => ({
    accessorKey,
    header: options?.sortable ? createSortableHeader(header) : header,
    cell: ({ row }) => row.getValue(accessorKey) ?? "-",
});

export const createNumericColumn = <T extends Record<string, unknown>>(
    accessorKey: keyof T & string,
    header: string,
    emptyValue = "-"
): ColumnDef<T> => ({
    accessorKey,
    header: () => <div className="text-right">{header}</div>,
    cell: ({ row }) => {
        const value = row.getValue(accessorKey) as number | undefined;
        return <div className="text-right font-medium">{value ?? emptyValue}</div>;
    },
});

export const createMappedColumn = <T extends Record<string, unknown>>(
    accessorKey: keyof T & string,
    header: string,
    labels: Record<string, string>,
    emptyValue = "-"
): ColumnDef<T> => ({
    accessorKey,
    header,
    cell: ({ row }) => {
        const value = row.getValue(accessorKey) as string | undefined;
        return value ? (labels[value] ?? emptyValue) : emptyValue;
    },
});

export interface StatusConfig {
    label: string;
    className: string;
}

export const createStatusColumn = <T extends Record<string, unknown>>(
    accessorKey: keyof T & string,
    header: string,
    statusLabels: Record<string, StatusConfig>
): ColumnDef<T> => ({
    accessorKey,
    header,
    cell: ({ row }) => {
        const status = row.getValue(accessorKey) as string;
        const config = statusLabels[status] ?? { label: status, className: "" };
        return (
            <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${config.className}`}
            >
                {config.label}
            </span>
        );
    },
    filterFn: (row, id, value: string[]) => {
        return value.includes(row.getValue(id));
    },
});
