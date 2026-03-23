"use client";

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import {
  Check,
  ChevronRight,
  ChevronsUpDown,
  ListFilter,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { FilterConfig } from "@/lib/table/types";

interface DataTableFiltersProps<TData> {
  table: Table<TData>;
  filterConfigs: FilterConfig[];
  filtersMenuLabel?: string;
  clearFiltersLabel?: string;
  desktopVariant?: "dropdown" | "inline";
  displayMode?: "auto" | "dropdown" | "inline";
}

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

function getSelectedValues<TData>(table: Table<TData>, columnId: string) {
  return (table.getColumn(columnId)?.getFilterValue() as string[]) ?? [];
}

function useDataTableFilterState<TData>(
  table: Table<TData>,
  filterConfigs: FilterConfig[],
) {
  const hasActiveFilters = React.useMemo(() => {
    return filterConfigs.some((config) => {
      return getSelectedValues(table, config.id).length > 0;
    });
  }, [filterConfigs, table, table.getState().columnFilters]);

  const clearAllFilters = React.useCallback(() => {
    filterConfigs.forEach((config) => {
      table.getColumn(config.id)?.setFilterValue(undefined);
    });
  }, [filterConfigs, table]);

  const toggleFilterValue = React.useCallback(
    (columnId: string, value: string) => {
      const column = table.getColumn(columnId);
      if (!column) {
        return;
      }

      const currentFilter = getSelectedValues(table, columnId);
      const isSelected = currentFilter.includes(value);
      const nextFilter = isSelected
        ? currentFilter.filter((currentValue) => currentValue !== value)
        : [...currentFilter, value];

      column.setFilterValue(nextFilter.length > 0 ? nextFilter : undefined);
    },
    [table],
  );

  const isValueSelected = React.useCallback(
    (columnId: string, value: string) => {
      return getSelectedValues(table, columnId).includes(value);
    },
    [table],
  );

  return {
    hasActiveFilters,
    clearAllFilters,
    toggleFilterValue,
    isValueSelected,
  };
}

function DataTableInlineFilter<TData>({
  table,
  config,
  emptyLabel,
}: {
  table: Table<TData>;
  config: FilterConfig;
  emptyLabel: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selectedValues = getSelectedValues(table, config.id);
  const { toggleFilterValue } = useDataTableFilterState(table, [config]);
  const selectedLabels = config.options
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label);

  const buttonLabel =
    selectedLabels.length === 0
      ? config.label
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${config.label} (${selectedLabels.length})`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "hidden min-w-[180px] justify-between md:inline-flex",
            selectedValues.length > 0 && "border-primary",
          )}
        >
          <span className="truncate">{buttonLabel}</span>
          <div className="ml-2 flex items-center gap-1">
            {selectedValues.length > 0 ? (
              <Badge color="zinc" className="h-5 px-1.5">
                {selectedValues.length}
              </Badge>
            ) : null}
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="hidden w-[220px] p-0 md:block">
        <Command>
          <CommandInput placeholder={config.label} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {config.options.map((option) => {
                const isSelected = selectedValues.includes(option.value);

                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggleFilterValue(config.id, option.value)}
                  >
                    <span>{option.label}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function DataTableDropdownFilters<TData>({
  table,
  filterConfigs,
  filtersMenuLabel,
  clearFiltersLabel,
  isMobile,
}: {
  table: Table<TData>;
  filterConfigs: FilterConfig[];
  filtersMenuLabel?: string;
  clearFiltersLabel?: string;
  isMobile: boolean;
}) {
  const [openSubMenus, setOpenSubMenus] = React.useState<
    Record<string, boolean>
  >({});
  const {
    hasActiveFilters,
    clearAllFilters,
    toggleFilterValue,
    isValueSelected,
  } = useDataTableFilterState(table, filterConfigs);

  const toggleSubMenu = (configId: string) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [configId]: !prev[configId],
    }));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "cursor-pointer relative",
            hasActiveFilters && "border-2 border-primary",
          )}
        >
          <ListFilter className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>{filtersMenuLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {filterConfigs.map((config) => {
          const column = table.getColumn(config.id);
          if (!column) {
            return null;
          }

          const filterValue = getSelectedValues(table, config.id);
          const hasColumnFilters = filterValue.length > 0;
          const isOpen = openSubMenus[config.id];

          if (isMobile) {
            return (
              <div key={config.id} className="border-b last:border-b-0">
                <Button
                  variant="ghost"
                  className="h-auto w-full justify-between px-2 py-1.5 font-normal hover:bg-accent"
                  onClick={() => toggleSubMenu(config.id)}
                >
                  <span className="flex items-center gap-2">
                    {config.label}
                    {hasColumnFilters ? (
                      <Badge color="zinc" className="h-5 px-1.5">
                        {filterValue.length}
                      </Badge>
                    ) : null}
                  </span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isOpen && "rotate-90",
                    )}
                  />
                </Button>
                {isOpen ? (
                  <div className="pl-4 pb-2">
                    {config.options.map((option) => (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={isValueSelected(config.id, option.value)}
                        onCheckedChange={() =>
                          toggleFilterValue(config.id, option.value)
                        }
                      >
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <DropdownMenuSub key={config.id}>
              <DropdownMenuSubTrigger className="flex items-center justify-between">
                <span>{config.label}</span>
                {hasColumnFilters ? (
                  <Badge color="zinc" className="ml-2 h-5 px-1.5">
                    {filterValue.length}
                  </Badge>
                ) : null}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-[200px]">
                {config.options.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={isValueSelected(config.id, option.value)}
                    onCheckedChange={() =>
                      toggleFilterValue(config.id, option.value)
                    }
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        })}

        {hasActiveFilters ? (
          <>
            <DropdownMenuSeparator />
            <Button
              variant="ghost"
              className="w-full justify-start text-sm font-normal"
              onClick={clearAllFilters}
            >
              <X className="mr-2 h-4 w-4" />
              {clearFiltersLabel ?? "Clear all filters"}
            </Button>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DataTableFilters<TData>({
  table,
  filterConfigs,
  filtersMenuLabel,
  clearFiltersLabel,
  desktopVariant = "dropdown",
  displayMode = "auto",
}: DataTableFiltersProps<TData>) {
  const t = useTranslations("Common");
  const isMobile = useIsMobileViewport();
  const { hasActiveFilters, clearAllFilters } = useDataTableFilterState(
    table,
    filterConfigs,
  );

  const shouldRenderInline =
    displayMode === "inline" ||
    (displayMode === "auto" && !isMobile && desktopVariant === "inline");

  if (shouldRenderInline) {
    return (
      <div className="flex items-center gap-2">
        {filterConfigs.map((config) => (
          <DataTableInlineFilter
            key={config.id}
            table={table}
            config={config}
            emptyLabel={t("table.noResults")}
          />
        ))}
        {hasActiveFilters ? (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={clearAllFilters}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <DataTableDropdownFilters
      table={table}
      filterConfigs={filterConfigs}
      filtersMenuLabel={filtersMenuLabel ?? t("table.filters")}
      clearFiltersLabel={clearFiltersLabel ?? t("table.clearFilters")}
      isMobile={displayMode === "dropdown" ? true : isMobile}
    />
  );
}
