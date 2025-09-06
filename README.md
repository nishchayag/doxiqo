# Doxiqo - AI Documentation Generator

Doxiqo is a powerful AI-driven tool that automatically generates comprehensive documentation for your projects. Simply upload your codebase as a ZIP file, and let our advanced AI analyze your code structure, functions, and logic to create professional documentation in minutes.

## Features

- 🚀 **AI-Powered Generation**: Upload your code files and our advanced AI analyzes your project structure
- ⚡ **Lightning Fast**: Generate professional-grade documentation in under 5 minutes
- 📄 **Multiple Formats**: Support for Markdown, PDF, HTML, and other formats
- 🔒 **Secure & Private**: Your code is processed securely and never stored permanently
- 🔐 **Authentication**: Secure login with GitHub OAuth or email/password
- 📊 **Real-time Status**: Live updates during the documentation generation process

## Technology Stack

- **Frontend**: Next.js 15.4.5 with React 19.1.0, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with GitHub and Credentials providers
- **File Upload**: UploadThing for secure file handling
- **AI Processing**: Google Gemini AI integration
- **Database**: MongoDB with Mongoose ODM
- **Storage**: Secure file processing with ZIP extraction

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database
- Google Gemini AI API key
- UploadThing account (for file uploads)
- GitHub OAuth app (optional, for GitHub login)

### Environment Setup

1. Copy the environment example file:

```bash
cp .env.example .env.local
```

2. Fill in your environment variables in `.env.local`:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/doxiqo

# NextAuth
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth (optional)
GITHUB_ID=your-github-app-id
GITHUB_SECRET=your-github-app-secret

# UploadThing
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here
```

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd doxiqo
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Application Flow

### Pages Structure

- **`/`** - Root page that redirects to `/landing` (unauthenticated) or `/dashboard` (authenticated)
- **`/landing`** - Marketing landing page with features and sign-up prompts
- **`/signup`** - User registration page with email/password and GitHub OAuth
- **`/login`** - User login page with email/password and GitHub OAuth
- **`/dashboard`** - Main application interface for authenticated users

### User Journey

1. **Landing Page**: Users arrive at an attractive landing page showcasing Doxiqo's features
2. **Sign Up/Login**: Users can register with email/password or use GitHub OAuth
3. **Dashboard**: Authenticated users access the main application
4. **Upload**: Users upload ZIP files of their codebase
5. **Processing**: AI analyzes the code structure and prepares files
6. **Preview**: Users review selected files before generation
7. **Generation**: AI creates comprehensive documentation
8. **Download**: Users download the generated documentation

### API Endpoints

- **`POST /api/register`** - User registration
- **`/api/auth/[...nextauth]`** - NextAuth authentication handlers
- **`POST /api/uploads`** - Handle ZIP file uploads and project creation
- **`POST /api/process/prepare`** - Prepare and analyze uploaded files
- **`POST /api/process/generate`** - Start AI documentation generation
- **`GET /api/projects/[projectId]/status`** - Check generation status
- **`GET /api/docs/[outputId]/download`** - Download generated documentation

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## Configuration Notes

- **NextAuth**: Requires `NEXTAUTH_SECRET` for JWT encryption
- **MongoDB**: Ensure your MongoDB instance is running and accessible
- **Google Gemini AI**: Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- **UploadThing**: Sign up at [UploadThing](https://uploadthing.com/) for file upload service
- **GitHub OAuth**: Create an app at [GitHub Developer Settings](https://github.com/settings/applications/new)

## Development

This project uses:

- **ESLint** for code linting
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **NextAuth.js** for authentication

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License.
