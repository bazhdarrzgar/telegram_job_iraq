'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react'

export function ImagePreviewModal({ isOpen, onClose, imageSrc, imageAlt, filename }) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)
  const handleReset = () => {
    setZoom(1)
    setRotation(0)
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(imageSrc)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'image.jpg'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header with controls */}
        <DialogHeader className="px-6 py-4 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold truncate">
              {imageAlt || 'Image Preview'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
              >
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                Reset
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Image container */}
        <div className="flex-1 overflow-auto bg-black/5 dark:bg-black/20">
          <div 
            className="min-h-[60vh] flex items-center justify-center p-4"
            style={{ minHeight: '400px' }}
          >
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={imageAlt || 'Preview'}
                className="max-w-full max-h-full object-contain transition-transform duration-200 ease-in-out shadow-lg"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center',
                }}
                onError={(e) => {
                  e.target.src = '/api/placeholder/400/300?text=Image+Not+Found'
                }}
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <div className="text-6xl mb-4">🖼️</div>
                <p>No image available</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with image info */}
        {filename && (
          <div className="px-6 py-3 bg-muted/30 border-t text-sm text-muted-foreground">
            <p className="truncate">
              <span className="font-medium">File:</span> {filename}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}