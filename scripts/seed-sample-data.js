const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { MongoClient } = require('mongodb')
const axios = require('axios')

// Sample CSV data based on the telegram job data
const sampleData = [
  {
    group: "IraqJobz",
    sender: "-1.00216E+12",
    text: "We're Hiring – Junior Accountant. Shahan Company is looking for a motivated Junior Accountant to join our HQ in Sulaymaniyah.",
    date: "8/23/2025 15:16",
    has_image: "TRUE", 
    image_path: "messages/images/IraqJobz/IraqJobz_9839_20250823_151627.jpg",
    message_id: "9839"
  },
  {
    group: "IraqJobz",
    sender: "-1.00216E+12", 
    text: "Position: Deputy Manager Location: Baghdad. Experience in staff management, team leadership, and administrative tasks required.",
    date: "8/23/2025 15:19",
    has_image: "TRUE",
    image_path: "messages/images/IraqJobz/IraqJobz_9840_20250823_151913.jpg", 
    message_id: "9840"
  },
  {
    group: "IraqJobz",
    sender: "-1.00216E+12",
    text: "We're Growing – Join Us as a Cybersecurity Sales Engineer! Looking for 3-5 years experience in cybersecurity pre-sales.",
    date: "8/23/2025 15:19", 
    has_image: "TRUE",
    image_path: "messages/images/IraqJobz/IraqJobz_9841_20250823_151959.jpg",
    message_id: "9841"
  },
  {
    group: "IraqJobz", 
    sender: "-1.00216E+12",
    text: "مطلوب مندوبين مبيعات متخصصين في مجال العقارات في أربيل - خبرة من 5-8 سنوات في مجال العقارات",
    date: "8/23/2025 15:20",
    has_image: "TRUE", 
    image_path: "messages/images/IraqJobz/IraqJobz_9842_20250823_152046.jpg",
    message_id: "9842"
  },
  {
    group: "IraqJobz",
    sender: "-1.00216E+12",
    text: "فرصة عمل – موظف مبيعات ميداني (بغداد / الكرخ والرصافة) شركة أموال لخدمات الدفع الإلكتروني",
    date: "8/23/2025 15:21",
    has_image: "TRUE",
    image_path: "messages/images/IraqJobz/IraqJobz_9843_20250823_152131.jpg", 
    message_id: "9843"
  }
]

async function createSampleCSV() {
  const uploadsDir = path.join(process.cwd(), 'uploads')
  const imagesDir = path.join(uploadsDir, 'images')
  
  // Create directories if they don't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true })
  }
  
  // Create CSV content
  const headers = Object.keys(sampleData[0])
  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => 
      headers.map(header => `"${row[header]}"`).join(',')
    )
  ].join('\n')
  
  // Save CSV file
  const uploadId = uuidv4()
  const csvFileName = `${uploadId}_sample_telegram_jobs.csv`
  const csvPath = path.join(uploadsDir, csvFileName)
  fs.writeFileSync(csvPath, csvContent)
  
  // Create sample images (colored rectangles with text)
  const imagePaths = []
  for (let i = 0; i < sampleData.length; i++) {
    const imageFileName = `${uploadId}_${i}_sample_job_${i + 1}.png`
    const imagePath = path.join(imagesDir, imageFileName)
    
    // Create a simple colored PNG image using Canvas API simulation
    // Since we can't use actual image libraries easily, we'll create placeholder images
    const sampleImageContent = createPlaceholderImage(i)
    fs.writeFileSync(imagePath, sampleImageContent)
    
    imagePaths.push(`images/${imageFileName}`)
  }
  
  return {
    uploadId,
    csvFileName,
    csvPath: csvFileName,
    imagePaths,
    rowCount: sampleData.length,
    imageCount: imagePaths.length,
    headers
  }
}

// Create a simple placeholder image (PNG header + minimal content)
function createPlaceholderImage(index) {
  // This is a minimal PNG file - in production you'd use a proper image library
  const colors = [
    Buffer.from([255, 0, 0]), // Red
    Buffer.from([0, 255, 0]), // Green  
    Buffer.from([0, 0, 255]), // Blue
    Buffer.from([255, 255, 0]), // Yellow
    Buffer.from([255, 0, 255]) // Magenta
  ]
  
  // PNG signature
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  
  // IHDR chunk for 100x100 image
  const width = 100
  const height = 100
  const ihdr = Buffer.concat([
    Buffer.from([0, 0, 0, 13]), // Length
    Buffer.from('IHDR'), // Chunk type
    Buffer.from([0, 0, 0, width]), // Width (4 bytes)
    Buffer.from([0, 0, 0, height]), // Height (4 bytes) 
    Buffer.from([8, 2, 0, 0, 0]), // Bit depth, Color type, Compression, Filter, Interlace
    Buffer.from([114, 26, 5, 31]) // CRC (placeholder)
  ])
  
  // Minimal IDAT chunk (compressed image data)
  const idat = Buffer.concat([
    Buffer.from([0, 0, 0, 20]), // Length
    Buffer.from('IDAT'), // Chunk type
    Buffer.from([120, 156, 98, 250, 207, 240, 15, 0, 0, 255, 255, 1, 0, 0, 1, 0, 1]), // Compressed data
    Buffer.from([0, 2, 0, 1]) // CRC (placeholder)
  ])
  
  // IEND chunk
  const iend = Buffer.concat([
    Buffer.from([0, 0, 0, 0]), // Length
    Buffer.from('IEND'), // Chunk type
    Buffer.from([174, 66, 96, 130]) // CRC
  ])
  
  return Buffer.concat([pngSignature, ihdr, idat, iend])
}

async function seedDatabase() {
  try {
    const client = new MongoClient(process.env.MONGO_URL || 'mongodb://localhost:27017')
    await client.connect()
    const db = client.db('csv_viewer_db')
    
    const sampleUpload = await createSampleCSV()
    
    const uploadRecord = {
      _id: sampleUpload.uploadId,
      filename: 'sample_telegram_jobs.csv', 
      csvPath: sampleUpload.csvPath,
      imagePaths: sampleUpload.imagePaths,
      uploadDate: new Date(),
      rowCount: sampleUpload.rowCount,
      imageCount: sampleUpload.imageCount,
      headers: sampleUpload.headers
    }
    
    // Check if sample data already exists
    const existing = await db.collection('uploads').findOne({ filename: 'sample_telegram_jobs.csv' })
    if (!existing) {
      await db.collection('uploads').insertOne(uploadRecord)
      console.log('Sample data seeded successfully!')
    } else {
      console.log('Sample data already exists, skipping...')
    }
    
    await client.close()
    
  } catch (error) {
    console.error('Error seeding database:', error)
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
}

module.exports = { seedDatabase }