"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/components/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/components/pagination"
import { Button } from "./ui/components/button"
import { ExternalLink } from "lucide-react"

interface AlgaeSpecies {
  "Algae species": string
  "Wikipedia Links": string
  "Algae Base Links": string
  "Number of co's": string
  Producers: string
  Genus: string
  Color: string
  "Common name": string
}

interface AlgaeTableProps {
  data: AlgaeSpecies[]
}

export default function AlgaeTable({ data }: AlgaeTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentData = data.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
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

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Species</TableHead>
              <TableHead>Genus</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Common Name</TableHead>
              <TableHead>Producers</TableHead>
              <TableHead>Links</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length > 0 ? (
              currentData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item["Algae species"]}</TableCell>
                  <TableCell>{item.Genus}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            item.Color === "Green"
                              ? "#4ade80"
                              : item.Color === "Red"
                                ? "#f87171"
                                : item.Color === "Brown"
                                  ? "#92400e"
                                  : item.Color === "Blue"
                                    ? "#60a5fa"
                                    : item.Color === "Yellow"
                                      ? "#facc15"
                                      : "#d1d5db",
                        }}
                      />
                      {item.Color}
                    </div>
                  </TableCell>
                  <TableCell>{item["Common name"] || "-"}</TableCell>
                  <TableCell>{item.Producers || "-"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {item["Wikipedia Links"] && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={item["Wikipedia Links"]} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Wiki
                          </a>
                        </Button>
                      )}
                      {item["Algae Base Links"] && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={item["Algae Base Links"]} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            AlgaeBase
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              />
            </PaginationItem>

            {renderPagination()}

            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

