'use client'

import { useState, useEffect } from 'react'
import { Upload, History, FileText, Image, Download, Trash2, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ThemeToggle } from '@/components/theme-toggle'

export default function App() {
  const [csvFile, setCsvFile] = useState(null)
  const [images, setImages] = useState([])
  const [csvData, setCsvData] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadHistory, setUploadHistory] = useState([])
  const [selectedHistory, setSelectedHistory] = useState(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [demoPreviewData, setDemoPreviewData] = useState(null)
  const [loadingDemo, setLoadingDemo] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")

  // Load upload history on component mount
  useEffect(() => {
    fetchUploadHistory()
  }, [])

  const loadDemoPreview = async () => {
    setLoadingDemo(true)
    try {
      // Load the demo CSV file
      const response = await fetch('/demo_data/telegram_messages_lastweek_2025-08-30.csv')
      if (response.ok) {
        const csvText = await response.text()
        
        // Proper CSV parser that handles multiline fields and quotes
        const parseCSV = (text) => {
          const result = []
          const lines = text.split('\n')
          let currentRow = []
          let currentField = ''
          let inQuotes = false
          let isFirstRow = true
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            
            for (let j = 0; j < line.length; j++) {
              const char = line[j]
              const nextChar = line[j + 1]
              
              if (char === '"') {
                if (inQuotes && nextChar === '"') {
                  // Escaped quote
                  currentField += '"'
                  j++ // Skip next quote
                } else {
                  // Toggle quote state
                  inQuotes = !inQuotes
                }
              } else if (char === ',' && !inQuotes) {
                // End of field
                currentRow.push(currentField.trim())
                currentField = ''
              } else {
                currentField += char
              }
            }
            
            // End of line
            if (!inQuotes) {
              // Complete row
              currentRow.push(currentField.trim())
              if (currentRow.length > 1 && currentRow.some(field => field)) {
                result.push([...currentRow])
              }
              currentRow = []
              currentField = ''
            } else {
              // Multi-line field continues
              currentField += '\n'
            }
          }
          
          return result
        }
        
        const parsedData = parseCSV(csvText)
        if (parsedData.length === 0) {
          throw new Error('No data found in CSV')
        }
        
        const headers = parsedData[0]
        const rows = parsedData.slice(1) // All data rows
        
        // Convert to objects
        const dataObjects = rows.map(row => {
          const obj = {}
          headers.forEach((header, index) => {
            obj[header] = row[index] || ''
          })
          return obj
        }).filter(obj => Object.values(obj).some(val => val && val.trim()))
        
        setDemoPreviewData({
          headers,
          data: dataObjects,
          filename: 'telegram_messages_lastweek_2025-08-30.csv',
          totalRows: parsedData.length - 1
        })
      }
    } catch (error) {
      console.error('Error loading demo preview:', error)
    } finally {
      setLoadingDemo(false)
    }
  }

  const fetchUploadHistory = async () => {
    try {
      const response = await fetch('/api/uploads')
      if (response.ok) {
        const data = await response.json()
        setUploadHistory(data.uploads || [])
      }
    } catch (error) {
      console.error('Error fetching upload history:', error)
    }
  }

  const handleCsvChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
      // Parse CSV preview
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target.result
        
        // Simple CSV parser that handles quoted fields
        function parseCSV(text) {
          const lines = []
          const rows = text.split('\n')
          
          for (let row of rows) {
            if (row.trim()) {
              const fields = []
              let field = ''
              let inQuotes = false
              
              for (let i = 0; i < row.length; i++) {
                const char = row[i]
                
                if (char === '"' && (i === 0 || row[i-1] === ',')) {
                  inQuotes = true
                } else if (char === '"' && inQuotes && (i === row.length - 1 || row[i+1] === ',')) {
                  inQuotes = false
                } else if (char === ',' && !inQuotes) {
                  fields.push(field.trim())
                  field = ''
                } else {
                  field += char
                }
              }
              fields.push(field.trim())
              lines.push(fields)
            }
          }
          return lines
        }
        
        const parsedLines = parseCSV(text)
        if (parsedLines.length > 0) {
          const headers = parsedLines[0].map(h => h.replace(/"/g, ''))
          const dataRows = parsedLines.slice(1, 6).map(row => {
            const obj = {}
            headers.forEach((header, index) => {
              obj[header] = row[index] ? row[index].replace(/"/g, '') : ''
            })
            return obj
          }).filter(row => Object.values(row).some(val => val && val.trim()))
          
          setCsvData({ 
            headers, 
            rows: dataRows, 
            totalRows: parsedLines.length - 1 
          })
        }
      }
      reader.readAsText(file)
    } else {
      toast.error('Please select a valid CSV file')
    }
  }

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    setImages(imageFiles)
    if (imageFiles.length !== files.length) {
      toast.warning('Some files were filtered out. Only image files are allowed.')
    }
  }

  const handleUpload = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file')
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('csv', csvFile)
    
    // Add all images to form data
    images.forEach((image, index) => {
      formData.append(`images`, image)
    })

    try {
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('CSV and images uploaded successfully!')
        // Reset form
        setCsvFile(null)
        setImages([])
        setCsvData(null)
        document.getElementById('csv-input').value = ''
        document.getElementById('images-input').value = ''
        
        // Refresh history and auto-redirect to preview
        await fetchUploadHistory()
        
        // Wait a moment for state to update, then auto-redirect to preview tab and load the uploaded CSV
        setTimeout(async () => {
          try {
            // Fetch the most recently uploaded file
            const updatedResponse = await fetch('/api/uploads')
            const updatedHistory = await updatedResponse.json()
            
            if (updatedHistory.uploads && updatedHistory.uploads.length > 0) {
              const mostRecent = updatedHistory.uploads[0]
              // Load the uploaded CSV data in preview tab
              await handlePreviewInTab(mostRecent)
              // Switch to preview tab
              setActiveTab("preview")
            }
          } catch (error) {
            console.error('Error auto-loading preview:', error)
          }
        }, 1000)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handlePreview = async (upload) => {
    try {
      const response = await fetch(`/api/uploads/${upload._id}`)
      if (response.ok) {
        const data = await response.json()
        setPreviewData(data)
        setShowPreviewDialog(true)
      } else {
        toast.error('Failed to load preview')
      }
    } catch (error) {
      console.error('Preview error:', error)
      toast.error('Failed to load preview')
    }
  }

  const handlePreviewInTab = async (upload) => {
    try {
      const response = await fetch(`/api/uploads/${upload._id}`)
      if (response.ok) {
        const data = await response.json()
        
        // Process the data to format image_path as filename only
        const processedData = {
          ...data,
          data: data.data.map(row => ({
            ...row,
            image_path: row.image_path ? row.image_path.split('/').pop().split('\\').pop() : row.image_path
          }))
        }
        
        setDemoPreviewData({
          headers: processedData.headers,
          data: processedData.data,
          filename: processedData.filename,
          totalRows: processedData.data.length,
          images: processedData.images
        })
      } else {
        toast.error('Failed to load preview')
      }
    } catch (error) {
      console.error('Preview error:', error)
      toast.error('Failed to load preview')
    }
  }

  const handleDelete = async (uploadId) => {
    try {
      const response = await fetch(`/api/uploads/${uploadId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Upload deleted successfully')
        fetchUploadHistory()
      } else {
        toast.error('Failed to delete upload')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete upload')
    }
  }

  const handleDownload = async (uploadId, filename) => {
    try {
      const response = await fetch(`/api/uploads/${uploadId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        toast.error('Failed to download file')
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download file')
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4 relative">
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter">CSV Viewer with Image Preview</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload CSV files with images and preview them with full image support. 
          Perfect for viewing job postings, messages, or any CSV data with image references.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload CSV
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            CSV Preview
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Upload CSV & Images
              </CardTitle>
              <CardDescription>
                Upload a CSV file along with related images. The CSV should contain columns like: group, sender, text, date, has_image, image_path, message_id
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-input">CSV File *</Label>
                  <Input
                    id="csv-input"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvChange}
                    className="cursor-pointer"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="images-input">Images (Optional)</Label>
                  <Input
                    id="images-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesChange}
                    className="cursor-pointer"
                  />
                  {images.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {images.length} image(s) selected
                    </div>
                  )}
                </div>
              </div>

              {csvData && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span className="font-medium">CSV Preview</span>
                    <Badge variant="outline">{csvData.totalRows} rows total</Badge>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {csvData.headers.map((header, index) => (
                            <TableHead key={index} className="font-medium">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.rows.map((row, index) => (
                          <TableRow key={index}>
                            {csvData.headers.map((header, cellIndex) => (
                              <TableCell key={cellIndex} className="max-w-xs">
                                {header === 'image_path' && row[header] ? (
                                  <div className="space-y-2">
                                    <div className="text-xs text-muted-foreground truncate max-w-48">
                                      {row[header]}
                                    </div>
                                    <div className="w-20 h-20 bg-gray-100 border rounded flex items-center justify-center text-xs">
                                      {row['has_image'] === 'TRUE' ? '📸 Image' : 'No Image'}
                                    </div>
                                  </div>
                                ) : header === 'text' ? (
                                  <div className="max-w-md">
                                    <div className="line-clamp-3 text-sm whitespace-pre-wrap">
                                      {row[header]}
                                    </div>
                                  </div>
                                ) : header === 'date' ? (
                                  <div className="text-sm whitespace-nowrap">
                                    {row[header]}
                                  </div>
                                ) : (
                                  <div className="truncate">
                                    {row[header]}
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
              )}

              <Button 
                onClick={handleUpload} 
                disabled={!csvFile || isUploading}
                className="w-full"
                size="lg"
              >
                {isUploading ? 'Uploading...' : 'Upload CSV & Images'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                CSV Preview
              </CardTitle>
              <CardDescription>
                Preview your uploaded CSV data or load demo data to see how the viewer works.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadHistory.length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Uploaded CSV to Preview:</Label>
                      <select 
                        className="w-full p-2 border rounded-md bg-background"
                        onChange={(e) => {
                          const selectedUpload = uploadHistory.find(u => u._id === e.target.value)
                          if (selectedUpload) {
                            handlePreviewInTab(selectedUpload)
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>Choose a CSV file...</option>
                        {uploadHistory.map((upload) => (
                          <option key={upload._id} value={upload._id}>
                            {upload.filename} ({upload.rowCount} rows, {new Date(upload.uploadDate).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="border-b"></div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No uploaded CSV files found. Upload a CSV file first to preview it here.</p>
                    <div className="border-b mt-4"></div>
                  </div>
                )}
                
                <Button 
                  onClick={loadDemoPreview}
                  disabled={loadingDemo}
                  variant="outline"
                  className="w-full"
                >
                  {loadingDemo ? 'Loading Demo Data...' : 'Load Demo CSV Preview'}
                </Button>
                
                {demoPreviewData && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">{demoPreviewData.filename}</span>
                      </div>
                      <Badge variant="outline">{demoPreviewData.totalRows} total rows</Badge>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {demoPreviewData.headers.map((header, index) => (
                              <TableHead key={index} className="font-medium min-w-32">
                                {header}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {demoPreviewData.data.map((row, index) => (
                            <TableRow key={index}>
                              {demoPreviewData.headers.map((header, cellIndex) => (
                                <TableCell key={cellIndex} className="max-w-xs">
                                  {header === 'image_path' && row[header] ? (
                                    <div className="space-y-2">
                                      <div className="text-xs text-muted-foreground truncate max-w-48">
                                        {row[header]}
                                      </div>
                                      {row['has_image'] === 'TRUE' ? (
                                        demoPreviewData.images && demoPreviewData.images[row[header]] ? (
                                          <img 
                                            src={demoPreviewData.images[row[header]]}
                                            alt="Job Preview" 
                                            className="w-20 h-20 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => {
                                              const newWindow = window.open('', '_blank')
                                              newWindow.document.write(`
                                                <html>
                                                  <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#000;">
                                                    <img src="${demoPreviewData.images[row[header]]}" style="max-width:100%; max-height:100%; object-fit:contain;">
                                                  </body>
                                                </html>
                                              `)
                                            }}
                                          />
                                        ) : (
                                          <img 
                                            src={`/demo_data/images/IraqJobz/${row[header]}`}
                                            alt="Job Preview" 
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
                                        {row[header]}
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
                                      {row[header]}
                                    </div>
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="text-center text-sm text-muted-foreground">
                      Showing first {demoPreviewData.data.length} rows of {demoPreviewData.totalRows} total rows
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Upload History
              </CardTitle>
              <CardDescription>
                View and manage your previously uploaded CSV files
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No uploads yet. Upload your first CSV file to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {uploadHistory.map((upload) => (
                    <Card key={upload._id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{upload.filename}</div>
                          <div className="text-sm text-muted-foreground">
                            Uploaded on {new Date(upload.uploadDate).toLocaleDateString()} • {upload.rowCount} rows
                            {upload.imageCount > 0 && ` • ${upload.imageCount} images`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(upload)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(upload._id, upload.filename)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Upload</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{upload.filename}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(upload._id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>CSV Preview with Images</DialogTitle>
            <DialogDescription>
              {previewData?.filename} - {previewData?.data?.length || 0} rows
            </DialogDescription>
          </DialogHeader>
          
          {previewData && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewData.headers.map((header, index) => (
                        <TableHead key={index} className="font-medium">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.data.slice(0, 20).map((row, index) => (
                      <TableRow key={index}>
                        {previewData.headers.map((header, cellIndex) => (
                          <TableCell key={cellIndex} className="max-w-xs">
                            {header === 'image_path' && row[header] ? (
                              <div className="space-y-2">
                                <div className="text-xs text-muted-foreground truncate max-w-48">
                                  {row[header]}
                                </div>
                                {row['has_image'] === 'TRUE' && previewData.images && previewData.images[row[header]] ? (
                                  <img 
                                    src={previewData.images[row[header]]} 
                                    alt="CSV Image Preview" 
                                    className="w-20 h-20 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => {
                                      const img = new Image()
                                      img.src = previewData.images[row[header]]
                                      const newWindow = window.open('')
                                      newWindow.document.write(`<img src="${img.src}" style="max-width:100%;height:auto;">`)
                                    }}
                                  />
                                ) : row['has_image'] === 'TRUE' ? (
                                  <div className="w-20 h-20 bg-gray-100 border rounded flex items-center justify-center text-xs">
                                    📸 Image Missing
                                  </div>
                                ) : (
                                  <div className="w-20 h-20 bg-gray-50 border rounded flex items-center justify-center text-xs text-gray-400">
                                    No Image
                                  </div>
                                )}
                              </div>
                            ) : header === 'text' ? (
                              <div className="max-w-md">
                                <div className="text-sm whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto">
                                  {row[header]}
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
                                {row[header]}
                              </div>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {previewData.data.length > 20 && (
                <div className="text-center text-sm text-muted-foreground">
                  Showing first 20 rows of {previewData.data.length} total rows
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}