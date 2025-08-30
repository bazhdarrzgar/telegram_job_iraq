# API Documentation

This document describes the REST API endpoints available in the CSV Viewer application.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, no authentication is required for API endpoints. In production, consider implementing proper authentication and authorization.

## Endpoints

### Upload Management

#### Upload CSV File with Images

**POST** `/api/uploads`

Upload a CSV file along with optional image files.

**Content-Type:** `multipart/form-data`

**Request Body:**
- `csv` (file, required): The CSV file to upload
- `images` (files, optional): Array of image files

**Request Example:**
```javascript
const formData = new FormData()
formData.append('csv', csvFile)
images.forEach(image => formData.append('images', image))

fetch('/api/uploads', {
  method: 'POST',
  body: formData
})
```

**Response (201):**
```json
{
  "success": true,
  "message": "CSV and images uploaded successfully",
  "uploadId": "507f1f77bcf86cd799439011",
  "filename": "telegram_messages.csv",
  "rowCount": 150,
  "imageCount": 25
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "No CSV file provided"
}
```

---

#### Get Upload History

**GET** `/api/uploads`

Retrieve a list of all uploaded CSV files.

**Response (200):**
```json
{
  "uploads": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "filename": "telegram_messages.csv",
      "uploadDate": "2025-08-30T10:30:00.000Z",
      "rowCount": 150,
      "imageCount": 25,
      "fileSize": 2048576
    }
  ]
}
```

---

#### Get Specific Upload Data

**GET** `/api/uploads/[id]`

Retrieve detailed data for a specific upload, including parsed CSV content and image references.

**Parameters:**
- `id` (string): Upload ID

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "filename": "telegram_messages.csv",
  "uploadDate": "2025-08-30T10:30:00.000Z",
  "headers": ["group", "sender", "text", "date", "has_image", "image_path", "message_id"],
  "data": [
    {
      "group": "IraqJobz",
      "sender": "@JobPoster1",
      "text": "Software Engineer position available...",
      "date": "2025-08-30 09:15:23",
      "has_image": "TRUE",
      "image_path": "job_post_1.jpg",
      "message_id": "12345"
    }
  ],
  "images": {
    "job_post_1.jpg": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
  },
  "rowCount": 150,
  "imageCount": 25
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Upload not found"
}
```

---

#### Download Original CSV

**GET** `/api/uploads/[id]/download`

Download the original uploaded CSV file.

**Parameters:**
- `id` (string): Upload ID

**Response (200):**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="original_filename.csv"`
- Body: Raw CSV content

**Response (404):**
```json
{
  "success": false,
  "message": "File not found"
}
```

---

#### Delete Upload

**DELETE** `/api/uploads/[id]`

Delete an uploaded CSV file and its associated images.

**Parameters:**
- `id` (string): Upload ID

**Response (200):**
```json
{
  "success": true,
  "message": "Upload deleted successfully"
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Upload not found"
}
```

## Error Handling

All API endpoints return consistent error responses:

### Client Errors (4xx)

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Invalid request data",
  "errors": ["Field 'csv' is required"]
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**413 Payload Too Large:**
```json
{
  "success": false,
  "message": "File size exceeds limit (10MB)"
}
```

### Server Errors (5xx)

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider implementing rate limiting to prevent abuse.

## File Limits

- **Maximum file size:** 10MB per file
- **Supported formats:** CSV files only
- **Image formats:** JPEG, PNG, GIF, WebP
- **Maximum images:** 100 images per upload

## Data Types

### Upload Object

```typescript
interface Upload {
  _id: string
  filename: string
  uploadDate: Date
  rowCount: number
  imageCount: number
  fileSize: number
  headers: string[]
  data: Record<string, string>[]
  images?: Record<string, string> // filename -> base64 data
}
```

### CSV Row Object

```typescript
interface CSVRow {
  group: string
  sender: string
  text: string
  date: string
  has_image: 'TRUE' | 'FALSE'
  image_path: string
  message_id: string
  [key: string]: string // Additional custom columns
}
```

## Usage Examples

### JavaScript/Fetch

```javascript
// Upload CSV with images
const uploadFile = async (csvFile, images = []) => {
  const formData = new FormData()
  formData.append('csv', csvFile)
  images.forEach(image => formData.append('images', image))

  try {
    const response = await fetch('/api/uploads', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('Upload successful:', result)
    return result
  } catch (error) {
    console.error('Upload failed:', error)
    throw error
  }
}

// Get upload data
const getUploadData = async (uploadId) => {
  try {
    const response = await fetch(`/api/uploads/${uploadId}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch upload data:', error)
    throw error
  }
}
```

### cURL Examples

```bash
# Upload CSV file
curl -X POST \
  http://localhost:3000/api/uploads \
  -F "csv=@telegram_messages.csv" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"

# Get upload history
curl -X GET http://localhost:3000/api/uploads

# Get specific upload
curl -X GET http://localhost:3000/api/uploads/507f1f77bcf86cd799439011

# Download CSV
curl -X GET \
  http://localhost:3000/api/uploads/507f1f77bcf86cd799439011/download \
  -o downloaded_file.csv

# Delete upload
curl -X DELETE http://localhost:3000/api/uploads/507f1f77bcf86cd799439011
```

## Database Schema

The application uses MongoDB with the following collection structure:

### uploads Collection

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  filename: "telegram_messages.csv",
  originalName: "telegram_messages.csv",
  uploadDate: ISODate("2025-08-30T10:30:00.000Z"),
  rowCount: 150,
  imageCount: 25,
  fileSize: 2048576,
  headers: ["group", "sender", "text", "date", "has_image", "image_path", "message_id"],
  data: [
    {
      group: "IraqJobz",
      sender: "@JobPoster1",
      text: "Software Engineer position...",
      date: "2025-08-30 09:15:23",
      has_image: "TRUE",
      image_path: "job_post_1.jpg",
      message_id: "12345"
    }
  ],
  images: {
    "job_post_1.jpg": "data:image/jpeg;base64,..."
  }
}
```

## Security Considerations

For production deployment, consider implementing:

1. **Authentication & Authorization**
2. **Input Validation & Sanitization**
3. **File Type Validation**
4. **Rate Limiting**
5. **CORS Configuration**
6. **Request Size Limits**
7. **Error Message Sanitization**

## Performance Notes

- Large CSV files (>1000 rows) may take longer to process
- Images are stored as base64 strings in MongoDB (consider file storage for production)
- Database queries are not optimized for very large datasets
- Consider implementing pagination for large result sets