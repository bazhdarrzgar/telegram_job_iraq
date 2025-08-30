import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import Papa from 'papaparse'
import { readFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// MongoDB connection
let client
let db

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
  }
  if (!db) {
    db = client.db('csv_viewer_db')
  }
  return db
}

// Handle GET requests - get specific upload with data
export async function GET(request, { params }) {
  try {
    const db = await connectToDatabase()
    const uploadId = params.id
    const upload = await db.collection('uploads').findOne({ _id: uploadId })
    
    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }
    
    // Read CSV data
    const csvPath = path.join(process.cwd(), 'uploads', upload.csvPath)
    const csvContent = await readFile(csvPath, 'utf-8')
    const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true })
    
    // Process the data to show only filename in image_path column
    const processedData = parsed.data.map(row => {
      if (row.image_path && typeof row.image_path === 'string') {
        // Extract just the filename from paths like "messages/images/IraqJobz/IraqJobz_9840_20250823_151913.jpg"
        const filename = row.image_path.split('/').pop().split('\\').pop()
        return {
          ...row,
          image_path: filename
        }
      }
      return row
    })
    
    // Prepare image URLs if images exist
    let imageUrls = {}
    if (upload.imagePaths && upload.imagePaths.length > 0) {
      // Create a map of uploaded image filenames
      const uploadedImageMap = new Map()
      
      for (const imagePath of upload.imagePaths) {
        const fullImagePath = path.join(process.cwd(), 'uploads', imagePath)
        if (existsSync(fullImagePath)) {
          const imageBuffer = await readFile(fullImagePath)
          const base64 = imageBuffer.toString('base64')
          const mimeType = imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg') ? 'jpeg' : 
                        imagePath.endsWith('.png') ? 'png' : 
                        imagePath.endsWith('.gif') ? 'gif' : 'jpeg'
          
          const dataUrl = `data:image/${mimeType};base64,${base64}`
          
          // Store by original filename (from upload)
          const originalFileName = path.basename(imagePath).replace(/^[^_]*_\d+_/, '') // Remove upload prefix
          uploadedImageMap.set(originalFileName, dataUrl)
          
          // Also store by the full uploaded path
          imageUrls[imagePath] = dataUrl
          imageUrls[path.basename(imagePath)] = dataUrl
        }
      }
      
      // Now match CSV image_path values to uploaded images
      for (const row of processedData) {
        if (row.image_path && row.has_image === 'TRUE') {
          const csvImagePath = row.image_path.trim()
          
          // Direct filename match
          if (uploadedImageMap.has(csvImagePath)) {
            imageUrls[csvImagePath] = uploadedImageMap.get(csvImagePath)
          } else {
            // Try to find matching image by comparing filenames
            for (const [uploadedName, dataUrl] of uploadedImageMap) {
              // Check if the CSV filename matches any uploaded image
              if (uploadedName === csvImagePath || 
                  uploadedName.includes(csvImagePath) || 
                  csvImagePath.includes(uploadedName)) {
                imageUrls[csvImagePath] = dataUrl
                break
              }
            }
          }
        }
      }
    }
    
    return NextResponse.json({
      ...upload,
      headers: parsed.meta.fields || [],
      data: processedData,
      images: imageUrls
    })
    
  } catch (error) {
    console.error('GET /api/uploads/[id] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch upload: ' + error.message }, { status: 500 })
  }
}

// Handle DELETE requests
export async function DELETE(request, { params }) {
  try {
    const db = await connectToDatabase()
    const uploadId = params.id
    const upload = await db.collection('uploads').findOne({ _id: uploadId })
    
    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }
    
    // Delete CSV file
    const csvPath = path.join(process.cwd(), 'uploads', upload.csvPath)
    if (existsSync(csvPath)) {
      await unlink(csvPath)
    }
    
    // Delete image files
    if (upload.imagePaths) {
      for (const imagePath of upload.imagePaths) {
        const fullImagePath = path.join(process.cwd(), 'uploads', imagePath)
        if (existsSync(fullImagePath)) {
          await unlink(fullImagePath)
        }
      }
    }
    
    // Delete database record
    await db.collection('uploads').deleteOne({ _id: uploadId })
    
    return NextResponse.json({ message: 'Upload deleted successfully' })
    
  } catch (error) {
    console.error('DELETE /api/uploads/[id] Error:', error)
    return NextResponse.json({ error: 'Delete failed: ' + error.message }, { status: 500 })
  }
}