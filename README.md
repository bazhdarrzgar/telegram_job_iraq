# 📊 CSV Viewer with Image Preview

> A powerful, modern web application for viewing and analyzing CSV data with integrated image preview capabilities. Perfect for managing telegram job postings, messages, and any CSV data with image references.

[![Next.js](https://img.shields.io/badge/Next.js-14.2.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.6.0-green?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

## ✨ Features

### 🔍 **Advanced Search & Filtering**
- **Fuzzy Search** - Intelligent search with typo tolerance using Fuse.js
- **Real-time Filtering** - Filter by any column with instant results
- **Multi-column Filters** - Combine multiple filters for precise data discovery
- **Search Highlighting** - Visual highlighting of matching terms in results
- **Export Filtered Data** - Download filtered results as CSV

### 🖼️ **Professional Image Preview**
- **Inline Modal Preview** - View images without leaving the page
- **Zoom Controls** - Zoom in/out (50% to 300%) with smooth transitions
- **Image Rotation** - Rotate images with one click
- **Download Images** - Direct download functionality from preview modal
- **Smart Fallbacks** - Graceful handling of missing images

### 📊 **Enhanced Table Interface**
- **Professional Design** - Clean, modern table with proper spacing and typography
- **Sortable Columns** - Click any header to sort data ascending/descending
- **Sticky Headers** - Headers remain visible while scrolling
- **Column Selection** - Choose which columns to display
- **Responsive Design** - Optimized for desktop and mobile viewing
- **Performance Optimized** - Handles large datasets efficiently

### 📱 **Modern UI/UX**
- **Dark/Light Theme** - Toggle between themes with system preference detection
- **Intuitive Navigation** - Tab-based interface for easy access to features
- **Visual Feedback** - Smooth animations and hover effects
- **Accessibility** - Keyboard navigation and screen reader support
- **Mobile Responsive** - Works seamlessly across all device sizes

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **Yarn** package manager
- **MongoDB** (local or cloud instance)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bazhdarrzgar/telegram_job_iraq.git
   cd telegram_job_iraq
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   # The .env file should contain:
   MONGO_URL=mongodb://localhost:27017/csv_viewer_db
   ```

4. **Start the development server**
   ```bash
   yarn dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📖 Usage Guide

### 1. **Upload CSV Files**
- Navigate to the "Upload CSV" tab
- Select your CSV file (should contain columns like: group, sender, text, date, has_image, image_path, message_id)
- Optionally upload related images
- Click "Upload CSV & Images"

### 2. **Preview and Analyze Data**
- Switch to the "CSV Preview" tab
- Load demo data or select from uploaded files
- Use the search bar for fuzzy searching across all columns
- Open filters panel to apply column-specific filters
- Click column headers to sort data

### 3. **Image Management**
- Click any image in the table to open the preview modal
- Use zoom controls to examine images closely
- Rotate images if needed
- Download images directly from the modal

### 4. **Export Results**
- Apply desired filters and search criteria
- Click "Export Filtered" to download results as CSV
- The export includes only the filtered data

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 14.2.3** - React framework with server-side rendering
- **React 18** - Component-based UI library
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library

### **Backend & Database**
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB 6.6.0** - NoSQL database for data storage
- **Multer** - File upload handling middleware

### **Search & Analysis**
- **Fuse.js 7.1.0** - Fuzzy search library
- **Papa Parse** - CSV parsing and generation

### **Development Tools**
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 📁 Project Structure

```
telegram_job_iraq/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   └── uploads/             # File upload endpoints
│   ├── globals.css              # Global styles
│   ├── layout.js                # Root layout component
│   └── page.js                  # Main application page
├── components/                   # React components
│   ├── ui/                      # Base UI components (Radix UI)
│   ├── csv-preview-enhanced.jsx # Enhanced CSV viewer
│   ├── image-preview-modal.jsx  # Image preview modal
│   └── theme-toggle.jsx         # Theme switcher
├── hooks/                       # Custom React hooks
├── lib/                         # Utility functions
├── public/                      # Static assets
│   └── demo_data/              # Demo CSV and images
├── components.json              # shadcn/ui configuration
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── package.json                # Dependencies and scripts
```

## 🔧 API Endpoints

### File Upload
- **POST** `/api/uploads` - Upload CSV file with images
- **GET** `/api/uploads` - Retrieve upload history
- **GET** `/api/uploads/[id]` - Get specific upload data
- **DELETE** `/api/uploads/[id]` - Delete upload
- **GET** `/api/uploads/[id]/download` - Download original CSV

## 📊 CSV Data Format

The application expects CSV files with the following structure:

```csv
group,sender,text,date,has_image,image_path,message_id
IraqJobz,@JobPoster1,"Software Engineer position...",2025-08-30 09:15:23,TRUE,image1.jpg,12345
RemoteJobs,@HRManager2,"Remote Developer needed...",2025-08-30 10:22:15,FALSE,,12346
```

### Required Columns
- **group** - Channel or group name
- **sender** - Message sender username
- **text** - Job description or message content
- **date** - Message timestamp
- **has_image** - Boolean (TRUE/FALSE) indicating image presence
- **image_path** - Filename of associated image
- **message_id** - Unique message identifier

## 🎨 Customization

### Theme Configuration
The application supports light/dark themes. Modify `app/globals.css` to customize:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* Add your custom CSS variables */
}
```

### Search Configuration
Adjust fuzzy search settings in `components/csv-preview-enhanced.jsx`:

```javascript
const fuseOptions = {
  threshold: 0.3,        // Adjust search sensitivity
  distance: 100,         // Maximum search distance
  minMatchCharLength: 1, // Minimum character match length
}
```

## 📱 Screenshots

### Main Interface
![CSV Viewer Interface](docs/screenshots/main-interface.png)

### Search and Filtering
![Search and Filter](docs/screenshots/search-filter.png)

### Image Preview Modal
![Image Preview](docs/screenshots/image-preview.png)

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with automatic CI/CD

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build
EXPOSE 3000
CMD ["yarn", "start"]
```

### Environment Variables
```bash
# Production environment
MONGO_URL=mongodb://your-mongodb-connection-string
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📋 Scripts

```bash
# Development
yarn dev              # Start development server
yarn build            # Build for production
yarn start            # Start production server
yarn lint             # Run ESLint

# Database
yarn db:seed          # Seed database with sample data
yarn db:reset         # Reset database
```

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check MongoDB is running
mongosh
# or
brew services start mongodb-community
```

**Image Upload Issues**
- Ensure `/public/uploads` directory exists and is writable
- Check file size limits in `next.config.js`

**Search Not Working**
- Verify Fuse.js is properly installed: `yarn list fuse.js`
- Check browser console for JavaScript errors

### Performance Optimization
- Large datasets (>1000 rows) are limited to 100 display rows for performance
- Use filters to narrow down results before searching
- Optimize images to reduce loading times

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Bazhdar Rzgar**
- GitHub: [@bazhdarrzgar](https://github.com/bazhdarrzgar)
- LinkedIn: [Bazhdar Rzgar](https://linkedin.com/in/bazhdarrzgar)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Fuse.js](https://fusejs.io/) for powerful fuzzy search
- [Lucide](https://lucide.dev/) for beautiful icons

## 📈 Roadmap

- [ ] **Real-time Collaboration** - Multiple users editing simultaneously
- [ ] **Advanced Analytics** - Charts and data visualization
- [ ] **API Integration** - Connect with external job boards
- [ ] **Bulk Operations** - Mass edit/delete functionality
- [ ] **Custom Fields** - User-defined column types
- [ ] **Export Options** - PDF, Excel, and JSON formats
- [ ] **Mobile App** - React Native mobile application

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

[Report Bug](https://github.com/bazhdarrzgar/telegram_job_iraq/issues) • [Request Feature](https://github.com/bazhdarrzgar/telegram_job_iraq/issues) • [Contribute](https://github.com/bazhdarrzgar/telegram_job_iraq/pulls)

</div>