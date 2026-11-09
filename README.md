# Node eBook API 📚

A production-grade, highly optimized RESTful API for managing an eBook platform. Built with a focus on type safety, clean architecture, automated cloud file orchestration, and reliable error management.

## 🚀 Key Features

- **TypeScript Native:** Strict static typing across routes, controllers, schemas, and models.
- **Robust File Pipeline:** Multi-field multi-file upload management using **Multer** for local disk caching.
- **Automated Cloud Sync:** Background synchronization with **Cloudinary** for secure asset streaming.
- **Atomic Operations:** Safe MongoDB data mutations ensuring absolute data integrity with zero dangling local cache artifacts.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB (via Mongoose ODM)
- **Cloud Storage:** Cloudinary SDK
- **File Parsing:** Multer
- **Error Handling:** Http-Errors / Custom global middleware handling

---

## 📦 Project Directory Layout

```text
├─ src
│  ├─ book/
│  ├─ config/
│  ├─ middlewares/
│  ├─ user/
│  ├─ utils/
│  └─ app.ts
├─ .env.sample (excluded)
├─ .gitignore (excluded)
├─ eslint.config.ts
├─ package-lock.json
├─ package.json
├─ README.md
├─ server.ts
└─ tsconfig.json
```

---

## ⚙️ Installation & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/sagarpatil-17/node-ebook-api.git
cd node-ebook-api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and append your infrastructure variables:
```env
PORT=5500
MONGO_CONNECTION_STRING=mongodb+srv://<user>:<password>@cluster.mongodb.net/ebooks
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_super_secure_jwt_token_secret
```

### 4. Run the application
```bash
# Start in development mode with hot-reloading
npm run dev

# Compile TypeScript to production JavaScript
npm run build

# Start the compiled production build
npm start
```
