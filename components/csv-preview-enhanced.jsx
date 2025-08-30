'use client'

import { useState, useMemo, useCallback } from 'react'
import { Search, Filter, X, Download, SlidersHorizontal, Eye, Image as ImageIcon, Calendar, User, MessageSquare, Hash } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Checkbox } from '@/components/ui/checkbox'
import { ImagePreviewModal } from '@/components/image-preview-modal'
import Fuse from 'fuse.js'

export function CSVPreviewEnhanced({ data }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedColumns, setSelectedColumns] = useState([])
  const [filterValues, setFilterValues] = useState({})
  const [showFilters, setShowFilters] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    if (!data?.data || data.data.length === 0) return null
    
    const options = {
      keys: data.headers.map(header => header),
      threshold: 0.3, // Lower threshold means more strict matching
      distance: 100,
      includeScore: true,
      minMatchCharLength: 1,
      ignoreLocation: true
    }
    
    return new Fuse(data.data, options)
  }, [data])

  // Get unique values for each column for filtering
  const columnValues = useMemo(() => {
    if (!data?.data) return {}
    
    const values = {}
    data.headers.forEach(header => {
      const uniqueValues = [...new Set(
        data.data
          .map(row => row[header])
          .filter(val => val && val.toString().trim())
          .map(val => val.toString().trim())
      )].sort()
      
      values[header] = uniqueValues.slice(0, 50) // Limit to 50 unique values for performance
    })
    
    return values
  }, [data])

  // Apply filters and search
  const filteredAndSearchedData = useMemo(() => {
    if (!data?.data) return []

    let result = data.data

    // Apply column filters
    Object.entries(filterValues).forEach(([column, filterValue]) => {
      if (filterValue && filterValue !== 'all') {
        result = result.filter(row => 
          row[column]?.toString().toLowerCase().includes(filterValue.toLowerCase())
        )
      }
    })

    // Apply search query using Fuse.js
    if (searchQuery.trim() && fuse) {
      const searchResults = fuse.search(searchQuery)
      result = searchResults.map(result => result.item)
    }

    // Apply sorting
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.key]?.toString() || ''
        const bVal = b[sortConfig.key]?.toString() || ''
        
        if (sortConfig.direction === 'asc') {
          return aVal.localeCompare(bVal, undefined, { numeric: true })
        } else {
          return bVal.localeCompare(aVal, undefined, { numeric: true })
        }
      })
    }

    return result
  }, [data, searchQuery, filterValues, sortConfig, fuse])

  // Handle column selection for display
  const displayColumns = useMemo(() => {
    if (!data?.headers) return []
    if (selectedColumns.length === 0) return data.headers
    return selectedColumns
  }, [data?.headers, selectedColumns])

  // Handle sorting
  const handleSort = useCallback((column) => {
    setSortConfig(prevConfig => ({
      key: column,
      direction: prevConfig.key === column && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery('')
    setFilterValues({})
    setSortConfig({ key: null, direction: 'asc' })
  }, [])

  // Export filtered data as CSV
  const exportFilteredData = useCallback(() => {
    if (!filteredAndSearchedData.length) return
    
    const headers = displayColumns
    const csvContent = [
      headers.join(','),
      ...filteredAndSearchedData.map(row => 
        headers.map(header => {
          const value = row[header] || ''
          // Escape quotes and wrap in quotes if contains comma or newline
          if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `filtered_${data.filename || 'data'}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, [filteredAndSearchedData, displayColumns, data?.filename])

  if (!data?.data || data.data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No data available to preview</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search across all columns (fuzzy search enabled)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Filter Toggle and Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Collapsible open={showFilters} onOpenChange={setShowFilters}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                  {Object.keys(filterValues).filter(k => filterValues[k] && filterValues[k] !== 'all').length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {Object.keys(filterValues).filter(k => filterValues[k] && filterValues[k] !== 'all').length}
                    </Badge>
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-2">
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Column Filters</h4>
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      <X className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.headers.map(header => (
                      <div key={header} className="space-y-2">
                        <label className="text-sm font-medium">{header}</label>
                        <Select
                          value={filterValues[header] || 'all'}
                          onValueChange={(value) => setFilterValues(prev => ({
                            ...prev,
                            [header]: value === 'all' ? undefined : value
                          }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All values" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All values</SelectItem>
                            {columnValues[header]?.slice(0, 20).map(value => (
                              <SelectItem key={value} value={value}>
                                {value.length > 30 ? `${value.substring(0, 30)}...` : value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Column Selector */}
            <Select
              value={selectedColumns.length === 0 ? 'all' : 'custom'}
              onValueChange={(value) => {
                if (value === 'all') {
                  setSelectedColumns([])
                }
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Show columns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All columns</SelectItem>
                <div className="p-2 space-y-2">
                  {data.headers.map(header => (
                    <div key={header} className="flex items-center space-x-2">
                      <Checkbox
                        id={header}
                        checked={selectedColumns.length === 0 || selectedColumns.includes(header)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedColumns(prev => prev.length === 0 ? data.headers.filter(h => h !== header) : [...prev, header])
                          } else {
                            setSelectedColumns(prev => prev.filter(col => col !== header))
                          }
                        }}
                      />
                      <label htmlFor={header} className="text-sm font-medium">
                        {header}
                      </label>
                    </div>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {filteredAndSearchedData.length} / {data.totalRows} rows
            </Badge>
            
            <Button variant="outline" size="sm" onClick={exportFilteredData}>
              <Download className="w-4 h-4 mr-1" />
              Export Filtered
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {displayColumns.map((header, index) => (
                  <TableHead 
                    key={index} 
                    className="font-medium min-w-32 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort(header)}
                  >
                    <div className="flex items-center gap-1">
                      {header}
                      {sortConfig.key === header && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSearchedData.slice(0, 100).map((row, index) => (
                <TableRow key={index}>
                  {displayColumns.map((header, cellIndex) => (
                    <TableCell key={cellIndex} className="max-w-xs">
                      {header === 'image_path' && row[header] ? (
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground truncate max-w-48">
                            {row[header]}
                          </div>
                          {row['has_image'] === 'TRUE' ? (
                            data.images && data.images[row[header]] ? (
                              <img 
                                src={data.images[row[header]]}
                                alt="Preview" 
                                className="w-20 h-20 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => {
                                  const newWindow = window.open('', '_blank')
                                  newWindow.document.write(`
                                    <html>
                                      <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#000;">
                                        <img src="${data.images[row[header]]}" style="max-width:100%; max-height:100%; object-fit:contain;">
                                      </body>
                                    </html>
                                  `)
                                }}
                              />
                            ) : (
                              <img 
                                src={`/demo_data/images/IraqJobz/${row[header]}`}
                                alt="Preview" 
                                className="w-20 h-20 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => {
                                  const newWindow = window.open('', '_blank')
                                  newWindow.document.write(`
                                    <html>
                                      <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#000;">
                                        <img src="/demo_data/images/IraqJobz/${row[header]}" style="max-width:100%; max-height:100%; object-fit:contain;">
                                      </body>
                                    </html>
                                  `)
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                            )
                          ) : (
                            <div className="w-20 h-20 bg-gray-50 border rounded flex items-center justify-center text-xs text-gray-400">
                              No Image
                            </div>
                          )}
                          <div className="w-20 h-20 bg-gray-100 border rounded flex items-center justify-center text-xs text-red-500" style={{display: 'none'}}>
                            Image Missing
                          </div>
                        </div>
                      ) : header === 'text' ? (
                        <div className="max-w-md">
                          <div className="text-sm whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto">
                            {/* Highlight search terms */}
                            {searchQuery && row[header]?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ? (
                              <span dangerouslySetInnerHTML={{
                                __html: row[header].replace(
                                  new RegExp(`(${searchQuery})`, 'gi'),
                                  '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
                                )
                              }} />
                            ) : (
                              row[header]
                            )}
                          </div>
                        </div>
                      ) : header === 'date' ? (
                        <div className="text-sm whitespace-nowrap">
                          {row[header]}
                        </div>
                      ) : header === 'has_image' ? (
                        <Badge variant={row[header] === 'TRUE' ? 'default' : 'secondary'}>
                          {row[header] === 'TRUE' ? 'Has Image' : 'No Image'}
                        </Badge>
                      ) : header === 'group' ? (
                        <Badge variant="outline">
                          {row[header]}
                        </Badge>
                      ) : (
                        <div className="truncate">
                          {/* Highlight search terms in other columns too */}
                          {searchQuery && row[header]?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ? (
                            <span dangerouslySetInnerHTML={{
                              __html: row[header].replace(
                                new RegExp(`(${searchQuery})`, 'gi'),
                                '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
                              )
                            }} />
                          ) : (
                            row[header]
                          )}
                        </div>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {Math.min(filteredAndSearchedData.length, 100)} of {filteredAndSearchedData.length} filtered rows
        {filteredAndSearchedData.length > 100 && (
          <span className="text-orange-600 ml-2">
            (Limited to 100 rows for performance)
          </span>
        )}
      </div>
    </div>
  )
}