import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import Papa from 'papaparse'
import { writeFile, mkdir, readFile, unlink, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

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

// Ensure upload directories exist
async function ensureUploadDirs() {
  const uploadsDir = path.join(process.cwd(), 'uploads')
  const imagesDir = path.join(uploadsDir, 'images')
  
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true })
  }
  if (!existsSync(imagesDir)) {
    await mkdir(imagesDir, { recursive: true })
  }
  
  return { uploadsDir, imagesDir }
}

// Handle GET requests
export async function GET(request, { params }) {
  try {
    const db = await connectToDatabase()
    const url = new URL(request.url)
    const pathSegments = params?.path || []
    
    // Get all uploads
    if (pathSegments.length === 0) {
      const uploads = await db.collection('uploads').find({}).sort({ uploadDate: -1 }).toArray()
      return NextResponse.json({ uploads })
    }
    
    // Get specific upload with data
    if (pathSegments.length === 1) {
      const uploadId = pathSegments[0]
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
    }
    
    // Download CSV file
    if (pathSegments.length === 2 && pathSegments[1] === 'download') {
      const uploadId = pathSegments[0]
      const upload = await db.collection('uploads').findOne({ _id: uploadId })
      
      if (!upload) {
        return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
      }
      
      const csvPath = path.join(process.cwd(), 'uploads', upload.csvPath)
      const csvContent = await readFile(csvPath)
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${upload.filename}"`
        }
      })
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle POST requests (file upload)
export async function POST(request) {
  try {
    const db = await connectToDatabase()
    const { uploadsDir, imagesDir } = await ensureUploadDirs()
    
    const formData = await request.formData()
    const csvFile = formData.get('csv')
    const imageFiles = formData.getAll('images')
    
    if (!csvFile) {
      return NextResponse.json({ error: 'CSV file is required' }, { status: 400 })
    }
    
    // Generate unique ID and paths
    const uploadId = uuidv4()
    const csvFileName = `${uploadId}_${csvFile.name}`
    const csvPath = path.join(uploadsDir, csvFileName)
    
    // Save CSV file
    const csvBuffer = Buffer.from(await csvFile.arrayBuffer())
    await writeFile(csvPath, csvBuffer)
    
    // Parse CSV to get row count
    const csvContent = csvBuffer.toString('utf-8')
    const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true })
    const rowCount = parsed.data.length
    
    // Save image files
    const imagePaths = []
    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i]
      if (imageFile && imageFile.size > 0) {
        const imageFileName = `${uploadId}_${i}_${imageFile.name}`
        const imagePath = path.join(imagesDir, imageFileName)
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
        await writeFile(imagePath, imageBuffer)
        imagePaths.push(`images/${imageFileName}`)
      }
    }
    
    // Save upload record to database
    const uploadRecord = {
      _id: uploadId,
      filename: csvFile.name,
      csvPath: csvFileName,
      imagePaths,
      uploadDate: new Date(),
      rowCount,
      imageCount: imagePaths.length,
      headers: parsed.meta.fields || []
    }
    
    await db.collection('uploads').insertOne(uploadRecord)
    
    return NextResponse.json({ 
      message: 'Upload successful', 
      uploadId,
      rowCount,
      imageCount: imagePaths.length
    })
    
  } catch (error) {
    console.error('POST Error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// Handle DELETE requests
export async function DELETE(request, { params }) {
  try {
    const db = await connectToDatabase()
    const pathSegments = params?.path || []
    
    if (pathSegments.length !== 1) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    
    const uploadId = pathSegments[0]
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
    console.error('DELETE Error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}