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
  const [previewImage, setPreviewImage] = useState({ isOpen: false, src: '', alt: '', filename: '' })

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

  // Handle image preview
  const handleImagePreview = useCallback((imageSrc, imageAlt, filename) => {
    setPreviewImage({
      isOpen: true,
      src: imageSrc,
      alt: imageAlt || 'Image Preview',
      filename: filename
    })
  }, [])

  const closeImagePreview = useCallback(() => {
    setPreviewImage({ isOpen: false, src: '', alt: '', filename: '' })
  }, [])

  // Get column icon
  const getColumnIcon = (header) => {
    switch (header.toLowerCase()) {
      case 'group': return <Hash className="w-3 h-3" />
      case 'sender': return <User className="w-3 h-3" />
      case 'text': return <MessageSquare className="w-3 h-3" />
      case 'date': return <Calendar className="w-3 h-3" />
      case 'has_image': return <ImageIcon className="w-3 h-3" />
      case 'image_path': return <Eye className="w-3 h-3" />
      default: return null
    }
  }

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

      {/* Enhanced Data Table */}
      <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
        <div className="max-h-[600px] overflow-auto">
          <Table>
            <TableHeader className="bg-muted/30 sticky top-0 z-10">
              <TableRow className="hover:bg-muted/50">
                {displayColumns.map((header, index) => (
                  <TableHead 
                    key={index} 
                    className="font-semibold min-w-32 cursor-pointer hover:bg-muted/70 transition-colors border-r border-muted/30 last:border-r-0"
                    onClick={() => handleSort(header)}
                  >
                    <div className="flex items-center gap-2 py-1">
                      {getColumnIcon(header)}
                      <span className="text-xs uppercase tracking-wide">
                        {header.replace('_', ' ')}
                      </span>
                      {sortConfig.key === header && (
                        <span className="text-primary font-bold">
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
                <TableRow 
                  key={index} 
                  className="hover:bg-muted/20 transition-colors border-b border-muted/20"
                >
                  {displayColumns.map((header, cellIndex) => (
                    <TableCell key={cellIndex} className="border-r border-muted/10 last:border-r-0 py-3">
                      {header === 'image_path' && row[header] ? (
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground truncate max-w-48 font-mono bg-muted/20 px-2 py-1 rounded">
                            {row[header]}
                          </div>
                          {row['has_image'] === 'TRUE' ? (
                            data.images && data.images[row[header]] ? (
                              <div className="relative group">
                                <img 
                                  src={data.images[row[header]]}
                                  alt="Job Preview" 
                                  className="w-24 h-24 object-cover rounded-lg border-2 border-muted cursor-pointer hover:border-primary hover:scale-105 transition-all duration-200 shadow-sm"
                                  onClick={() => handleImagePreview(
                                    data.images[row[header]], 
                                    `${row['group']} - ${row['sender']}`, 
                                    row[header]
                                  )}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center pointer-events-none">
                                  <Eye className="w-6 h-6 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="relative group">
                                <img 
                                  src={`/demo_data/images/IraqJobz/${row[header]}`}
                                  alt="Job Preview" 
                                  className="w-24 h-24 object-cover rounded-lg border-2 border-muted cursor-pointer hover:border-primary hover:scale-105 transition-all duration-200 shadow-sm"
                                  onClick={() => handleImagePreview(
                                    `/demo_data/images/IraqJobz/${row[header]}`, 
                                    `${row['group']} - ${row['sender']}`, 
                                    row[header]
                                  )}
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.nextSibling.style.display = 'flex'
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center pointer-events-none">
                                  <Eye className="w-6 h-6 text-white" />
                                </div>
                                <div className="w-24 h-24 bg-destructive/10 border-2 border-destructive/20 rounded-lg flex flex-col items-center justify-center text-xs text-destructive/70" style={{display: 'none'}}>
                                  <ImageIcon className="w-8 h-8 mb-1" />
                                  <span>Missing</span>
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="w-24 h-24 bg-muted/30 border-2 border-muted/40 rounded-lg flex flex-col items-center justify-center text-xs text-muted-foreground">
                              <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                              <span>No Image</span>
                            </div>
                          )}
                        </div>
                      ) : header === 'text' ? (
                        <div className="max-w-md">
                          <div className="text-sm leading-relaxed max-h-24 overflow-y-auto bg-muted/10 p-3 rounded border">
                            {/* Highlight search terms */}
                            {searchQuery && row[header]?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ? (
                              <span dangerouslySetInnerHTML={{
                                __html: row[header].replace(
                                  new RegExp(`(${searchQuery})`, 'gi'),
                                  '<mark class="bg-yellow-300 dark:bg-yellow-700 px-1 rounded">$1</mark>'
                                )
                              }} />
                            ) : (
                              row[header]
                            )}
                          </div>
                        </div>
                      ) : header === 'date' ? (
                        <div className="text-sm font-mono bg-muted/20 px-2 py-1 rounded whitespace-nowrap">
                          {new Date(row[header]).toLocaleString()}
                        </div>
                      ) : header === 'has_image' ? (
                        <Badge 
                          variant={row[header] === 'TRUE' ? 'default' : 'secondary'}
                          className="font-medium"
                        >
                          {row[header] === 'TRUE' ? (
                            <>
                              <ImageIcon className="w-3 h-3 mr-1" />
                              Has Image
                            </>
                          ) : (
                            'No Image'
                          )}
                        </Badge>
                      ) : header === 'group' ? (
                        <Badge variant="outline" className="font-medium">
                          <Hash className="w-3 h-3 mr-1" />
                          {row[header]}
                        </Badge>
                      ) : header === 'sender' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm">
                            {searchQuery && row[header]?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ? (
                              <span dangerouslySetInnerHTML={{
                                __html: row[header].replace(
                                  new RegExp(`(${searchQuery})`, 'gi'),
                                  '<mark class="bg-yellow-300 dark:bg-yellow-700 px-1 rounded">$1</mark>'
                                )
                              }} />
                            ) : (
                              row[header]
                            )}
                          </span>
                        </div>
                      ) : header === 'message_id' ? (
                        <div className="font-mono text-xs bg-muted/20 px-2 py-1 rounded border">
                          {row[header]}
                        </div>
                      ) : (
                        <div className="text-sm">
                          {/* Highlight search terms in other columns too */}
                          {searchQuery && row[header]?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ? (
                            <span dangerouslySetInnerHTML={{
                              __html: row[header].replace(
                                new RegExp(`(${searchQuery})`, 'gi'),
                                '<mark class="bg-yellow-300 dark:bg-yellow-700 px-1 rounded">$1</mark>'
                              )
                            }} />
                          ) : (
                            <span className="truncate block">{row[header]}</span>
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
      <div className="text-center text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border">
        <div className="flex items-center justify-center gap-4">
          <span>
            Showing <span className="font-bold text-foreground">{Math.min(filteredAndSearchedData.length, 100)}</span> of <span className="font-bold text-foreground">{filteredAndSearchedData.length}</span> filtered rows
          </span>
          {filteredAndSearchedData.length > 100 && (
            <Badge variant="secondary" className="text-orange-600">
              Limited to 100 rows for performance
            </Badge>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={previewImage.isOpen}
        onClose={closeImagePreview}
        imageSrc={previewImage.src}
        imageAlt={previewImage.alt}
        filename={previewImage.filename}
      />
    </div>
  )
}