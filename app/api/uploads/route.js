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

// Handle GET requests - get all uploads
export async function GET(request) {
  try {
    const db = await connectToDatabase()
    const uploads = await db.collection('uploads').find({}).sort({ uploadDate: -1 }).toArray()
    return NextResponse.json({ uploads })
  } catch (error) {
    console.error('GET /api/uploads Error:', error)
    return NextResponse.json({ error: 'Failed to fetch uploads: ' + error.message }, { status: 500 })
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
    console.error('POST /api/uploads Error:', error)
    return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 })
  }
}