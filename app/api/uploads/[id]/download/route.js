import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { readFile } from 'fs/promises'
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

// Handle GET requests - download CSV file
export async function GET(request, { params }) {
  try {
    const db = await connectToDatabase()
    const uploadId = params.id
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
    
  } catch (error) {
    console.error('GET /api/uploads/[id]/download Error:', error)
    return NextResponse.json({ error: 'Download failed: ' + error.message }, { status: 500 })
  }
}