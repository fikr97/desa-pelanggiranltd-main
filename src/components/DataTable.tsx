import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onView?: (item: any) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  itemsPerPage?: number;
}

type SortOrder = 'asc' | 'desc' | null;

const DataTable = ({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  canEdit = true,
  canDelete = true,
  itemsPerPage = 20,
}: DataTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(itemsPerPage);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  // Reset to page 1 when data size changes drastically (e.g., filter)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else if (sortOrder === 'desc') { setSortKey(null); setSortOrder(null); }
      else setSortOrder('asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortOrder) return data;
    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortOrder === 'asc' ? 1 : -1;
      if (bValue == null) return sortOrder === 'asc' ? -1 : 1;
      if (
        typeof aValue === 'string' &&
        typeof bValue === 'string' &&
        /^\d{4}-\d{2}-\d{2}/.test(aValue) &&
        /^\d{4}-\d{2}-\d{2}/.test(bValue)
      ) {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        if (aDate < bDate) return sortOrder === 'asc' ? -1 : 1;
        if (aDate > bDate) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
    return sorted;
  }, [data, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, safePage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={safePage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={safePage === i}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={safePage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  // Pagination bar (reusable for top & bottom)
  const PaginationBar = () => {
    if (data.length === 0) return null;
    return (
      <div className="flex flex-col lg:flex-row justify-between items-center gap-3 bg-muted/30 border border-border rounded-xl px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 order-2 lg:order-1">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Menampilkan{' '}
            <span className="font-semibold text-foreground">
              {sortedData.length === 0 ? 0 : startIndex + 1}
            </span>{' '}
            – <span className="font-semibold text-foreground">{Math.min(endIndex, sortedData.length)}</span>{' '}
            dari <span className="font-semibold text-foreground">{sortedData.length.toLocaleString('id-ID')}</span> data
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Baris/halaman:</span>
            <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
              <SelectTrigger className="w-[90px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
                <SelectItem value="500">500</SelectItem>
                <SelectItem value="1000">1000</SelectItem>
                <SelectItem value={data.length.toString()}>Semua ({data.length})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {totalPages > 1 && (
          <Pagination className="order-1 lg:order-2 mx-0 w-auto">
            <PaginationContent className="flex gap-1">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(safePage - 1)}
                  className={`cursor-pointer text-xs h-8 ${safePage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(safePage + 1)}
                  className={`cursor-pointer text-xs h-8 ${safePage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    );
  };

  const showActionColumn = Boolean(onView) || (Boolean(onEdit) && canEdit) || (Boolean(onDelete) && canDelete);

  return (
    <div className="w-full max-w-full overflow-hidden space-y-3">
      {/* Pagination bar — ATAS table */}
      <PaginationBar />

      {/* Table */}
      <div className="card-elegant rounded-lg border border-border shadow-sm w-full relative">
        <div className="w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className="whitespace-nowrap px-2 md:px-4 text-xs md:text-sm min-w-[80px] select-none cursor-pointer group"
                    onClick={() => handleSort(column.key)}
                  >
                    <span className="flex items-center gap-0.5">
                      {column.label}
                      {sortKey === column.key && sortOrder === 'asc' && (
                        <ArrowUp size={14} className="text-primary" />
                      )}
                      {sortKey === column.key && sortOrder === 'desc' && (
                        <ArrowDown size={14} className="text-primary" />
                      )}
                      {sortKey !== column.key && (
                        <span className="opacity-40">
                          <ArrowUp size={11} className="inline-block" />
                          <ArrowDown size={11} className="-mt-1 inline-block" />
                        </span>
                      )}
                    </span>
                  </TableHead>
                ))}
                {showActionColumn && (
                  <TableHead className="whitespace-nowrap px-2 md:px-4 text-xs md:text-sm min-w-[100px] sticky right-0 bg-background z-10 border-l border-border">
                    Aksi
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((item, index) => (
                <TableRow key={item.id || index}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className="px-2 md:px-4 text-xs md:text-sm">
                      <div className="max-w-[100px] md:max-w-[150px] truncate" title={item[column.key]}>
                        {column.render ? column.render(item[column.key], item) : (item[column.key] || '-')}
                      </div>
                    </TableCell>
                  ))}
                  {showActionColumn && (
                    <TableCell className="px-2 md:px-4 sticky right-0 bg-background z-10 border-l border-border">
                      <div className="flex flex-row gap-1">
                        {onView && (
                          <Button variant="ghost" size="sm" onClick={() => onView(item)} className="h-7 w-7 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        {onEdit && canEdit && (
                          <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="h-7 w-7 p-0">
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {onDelete && canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(item)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {currentData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (showActionColumn ? 1 : 0)}
                    className="text-center py-8 text-muted-foreground text-xs md:text-sm"
                  >
                    Tidak ada data yang ditemukan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
