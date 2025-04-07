"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/pagination"
import { Button } from "@/components/button"
import { ExternalLink, ChevronDown, Eye, EyeOff } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/dropdown-menu"
import { Badge } from "@/components/badge"
import { parseProducers } from "@/lib/data-processor"
import type { AlgaeSpecies } from "@/lib/data-processor"
import { algaeColorMap } from "@/services/algae-data-service"
import ExpandableCell from "./expandable-cell"

interface AlgaeTableProps {
  data: AlgaeSpecies[]
}

// Define column configuration
interface ColumnConfig {
  key: keyof AlgaeSpecies | string;
  header: string;
  visible: boolean;
  width: string;
  priority: number; // Lower number = higher priority
  render?: (item: AlgaeSpecies) => React.ReactNode;
}

export default function AlgaeTable({ data }: AlgaeTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [columns, setColumns] = useState<ColumnConfig[]>([
    {
      key: "Algae species",
      header: "Species",
      visible: true,
      width: "20%",
      priority: 1,
      render: (item) => <ExpandableCell content={item["Algae species"]} maxLength={30} className="font-medium" />
    },
    {
      key: "Genus",
      header: "Genus",
      visible: true,
      width: "15%",
      priority: 2,
      render: (item) => <ExpandableCell content={item.Genus} />
    },
    {
      key: "Color",
      header: "Color",
      visible: true,
      width: "10%",
      priority: 3,
      render: (item) => (
        <Badge variant="outline" style={getColorStyle(item.Color)} className="px-2 py-1">
          {item.Color}
        </Badge>
      )
    },
    {
      key: "Common name",
      header: "Common Name",
      visible: true,
      width: "15%",
      priority: 4,
      render: (item) => <ExpandableCell content={item["Common name"] || "-"} />
    },
    {
      key: "Producers",
      header: "Producers",
      visible: true,
      width: "25%",
      priority: 5,
      render: (item) => <ExpandableCell content={item.Producers || "-"} isProducerList={true} />
    },
    {
      key: "links",
      header: "Links",
      visible: true,
      width: "15%",
      priority: 6,
      render: (item) => (
        <div className="flex flex-wrap gap-2">
          {item["Wikipedia Links"] && (
            <Button variant="outline" size="sm" asChild className="h-8">
              <a href={item["Wikipedia Links"]} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Wiki
              </a>
            </Button>
          )}
          {item["Algae Base Links"] && (
            <Button variant="outline" size="sm" asChild className="h-8">
              <a href={item["Algae Base Links"]} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                AlgaeBase
              </a>
            </Button>
          )}
        </div>
      )
    }
  ])

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentData = data.slice(startIndex, startIndex + itemsPerPage)
  const visibleColumns = columns.filter(col => col.visible)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const toggleColumnVisibility = (index: number) => {
    setColumns(prev =>
      prev.map((col, i) =>
        i === index ? { ...col, visible: !col.visible } : col
      )
    )
  }

  const renderPagination = () => {
    const pages = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={currentPage === i} onClick={() => handlePageChange(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return pages
  }

  // Get color style for a given color name
  const getColorStyle = (colorName: string) => {
    const color = algaeColorMap[colorName] || "#d1d5db"
    const textColor =
      colorName === "Brown" || colorName === "Black" || colorName === "Purple" || colorName === "Blue"
        ? "white"
        : "black"

    return {
      backgroundColor: color,
      color: textColor,
    }
  }

  return (
    <div className="rounded-md border">
      <div className="flex justify-end p-2 bg-muted/30 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Eye className="h-3.5 w-3.5 mr-1" />
              Columns
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            {columns.map((column, index) => (
              <DropdownMenuCheckboxItem
                key={index}
                checked={column.visible}
                onCheckedChange={() => toggleColumnVisibility(index)}
              >
                {column.header}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className={itemsPerPage > 25 ? "overflow-y-auto max-h-[70vh]" : ""}>
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              {visibleColumns.map((column, index) => (
                <TableHead
                  key={index}
                  className="font-semibold"
                  style={{ width: column.width }}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length > 0 ? (
              currentData.map((item, index) => (
                <TableRow key={index} className="hover:bg-muted/30">
                  {visibleColumns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {column.render ? column.render(item) : String(item[column.key as keyof AlgaeSpecies] || '-')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="text-center py-4">
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between p-4 border-t">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Showing {Math.min(data.length, startIndex + 1)}-{Math.min(data.length, startIndex + itemsPerPage)} of{" "}
            {data.length} entries
          </span>
          <select
            className="h-8 rounded-md border border-input px-3 py-1 text-sm"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  isActive={currentPage > 1}
                />
              </PaginationItem>

              {renderPagination()}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  isActive={currentPage < totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  )
}
