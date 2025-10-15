# HyperVerge API Integration Guide

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update `.env.local` with your HyperVerge credentials:
   ```env
   HYPERVERGE_APP_ID=your_actual_app_id
   HYPERVERGE_APP_KEY=your_actual_app_key
   HYPERVERGE_REGION=ind
   ```

   **Getting Your Credentials:**
   - Contact HyperVerge to obtain your `appId` and `appKey`
   - These are unique credentials provided by HyperVerge for API authentication
   - Choose your region based on your location (ind, usa, zaf, irl, sgp)

### 3. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 API Integration Details

### Overview

This application integrates three HyperVerge APIs in a sequential verification flow:

1. **Selfie Validation API** - Validates liveness of selfie
2. **Face Match API** - Matches selfie with ID photo
3. **Read ID API** - Extracts information from ID document

### API Endpoints

#### 1. Selfie Validation (`/api/validate-selfie`)

**Purpose:** Verifies if the selfie is from a live person (liveness check)

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `image`: Selfie image file (JPG, PNG, TIFF)

**Response:**
```json
{
  "status": "success",
  "statusCode": "200",
  "result": {
    "details": {
      "liveFace": {
        "value": "yes/no",
        "confidence": "high/low"
      },
      "qualityChecks": {
        "blur": { "value": "yes/no", "confidence": "high/low" },
        "eyesClosed": { "value": "yes/no", "confidence": "high/low" },
        "occlusion": { "value": "yes/no", "confidence": "high/low" },
        "multipleFaces": { "value": "yes/no", "confidence": "high/low" }
      }
    },
    "summary": {
      "action": "pass/fail/manualReview"
    }
  }
}
```

**HyperVerge API Called:**
```
POST https://{region}.idv.hyperverge.co/v1/checkLiveness
Headers:
  - appId: {your_app_id}
  - appKey: {your_app_key}
  - transactionId: {unique_transaction_id}
```

---

#### 2. Face Match (`/api/match-face`)

**Purpose:** Compares selfie with ID card photo to verify they're the same person

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `selfie`: Selfie image file
  - `id`: ID card image file

**Response:**
```json
{
  "status": "success",
  "statusCode": "200",
  "result": {
    "details": {
      "match": {
        "value": "yes/no",
        "score": 0.95,
        "confidence": "high/low"
      }
    },
    "summary": {
      "action": "pass/fail/manualReview"
    }
  }
}
```

**HyperVerge API Called:**
```
POST https://{region}.idv.hyperverge.co/v1/matchFace
Headers:
  - appId: {your_app_id}
  - appKey: {your_app_key}
  - transactionId: {unique_transaction_id}
```

---

#### 3. Read ID (`/api/read-id`)

**Purpose:** Extracts text and information from ID documents

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `image`: ID card image file
  - `countryId`: 3-letter country code (e.g., "IND", "USA")
  - `documentId`: Document type ID (e.g., "PAN", "AADHAAR", "PASSPORT")
  - `expectedDocumentSide` (optional): "front" or "back"

**Response:**
```json
{
  "status": "success",
  "statusCode": "200",
  "result": {
    "details": [{
      "idType": "Passport",
      "fieldsExtracted": {
        "fullName": { "value": "John Doe", "confidence": "high" },
        "dateOfBirth": { "value": "01-01-1990", "confidence": "high" },
        "idNumber": { "value": "AB1234567", "confidence": "high" },
        "address": { "value": "123 Main St", "confidence": "high" },
        // ... more fields
      }
    }],
    "summary": {
      "action": "pass/fail/manualReview"
    }
  }
}
```

**HyperVerge API Called:**
```
POST https://{region}.idv.hyperverge.co/v1/readId
Headers:
  - appId: {your_app_id}
  - appKey: {your_app_key}
  - transactionId: {unique_transaction_id}
```

---

## 🔧 Implementation Details

### Frontend Flow (`app/page.tsx`)

The verification flow is implemented as a multi-step process:

1. **Idle State:** User sees overview and clicks "Start Verification"
2. **Selfie Step:** User uploads selfie → Calls `/api/validate-selfie`
3. **Face Match Step:** User uploads ID → Calls `/api/match-face`
4. **Read ID Step:** System reads ID data → Calls `/api/read-id`
5. **Complete:** Shows all results and extracted data

### Backend API Routes

Each API route (`app/api/*/route.ts`) follows this pattern:

1. **Extract form data** from request
2. **Validate inputs** (images, required fields)
3. **Load credentials** from environment variables
4. **Generate unique transaction ID** for tracking
5. **Forward request** to HyperVerge API with proper headers
6. **Return response** to frontend

### Error Handling

The application handles various error scenarios:

- **400**: Missing or invalid input data
- **422**: Document/face not detected
- **423**: Document not supported
- **429**: Rate limit exceeded
- **5xx**: Server errors

---

## 📝 Important Notes

### Image Requirements

- **Supported formats:** JPG, JPEG, PNG, TIFF, PDF
- **Maximum size:** 6MB per image
- **Quality:** Keep JPEG quality factor above 80%
- **ID images:** Minimum width of 800 pixels recommended
- **Aspect ratio:** Maintain original document aspect ratio

### Country & Document IDs

**Common Country IDs (3-letter codes):**
- `IND` - India
- `USA` - United States
- `GBR` - United Kingdom
- `AUS` - Australia
- Refer to HyperVerge documentation for complete list

**Common Document IDs (India):**
- `PAN` - PAN Card
- `AADHAAR` - Aadhaar Card
- `PASSPORT` - Passport
- `DL` - Driving License
- `VOTERID` - Voter ID
- Refer to HyperVerge documentation for complete list per country

### Transaction IDs

- Must be **unique** for each verification session
- Used for tracking and debugging
- Format: `txn_{timestamp}_{random_string}`
- Store these for your records and support requests

---

## 🔐 Security Best Practices

1. **Never expose credentials** in frontend code
2. **Always use environment variables** for sensitive data
3. **Keep `.env.local`** in `.gitignore` (already configured)
4. **Validate all inputs** on the backend
5. **Implement rate limiting** in production
6. **Log transactions** for audit trails
7. **Use HTTPS** in production

---

## 🐛 Common Issues & Solutions

### Issue: "HyperVerge credentials not configured"
**Solution:** Ensure `.env.local` file exists with valid `HYPERVERGE_APP_ID` and `HYPERVERGE_APP_KEY`

### Issue: "Face not detected"
**Solution:** 
- Ensure image has good lighting
- Face should be clearly visible
- Image should not be blurred
- Remove masks/sunglasses

### Issue: "Document not detected"
**Solution:**
- Ensure document is fully visible in frame
- Good lighting and focus
- No glare on document
- Correct orientation

### Issue: "Rate limit exceeded"
**Solution:** Contact HyperVerge to increase your rate limits

### Issue: TypeScript errors during development
**Solution:** Run `npm install` to ensure all dependencies are installed

---

## 📚 Additional Resources

- [HyperVerge Selfie Validation API Docs](https://docs.hyperverge.co/)
- [HyperVerge Face Match API Docs](https://docs.hyperverge.co/)
- [HyperVerge Read ID API Docs](https://docs.hyperverge.co/)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

---

## 🚀 Next Steps

1. **Update API calls in frontend:** Replace mock responses with actual API calls
2. **Add proper error handling:** Display specific error messages to users
3. **Implement file validation:** Check file size, type before upload
4. **Add loading states:** Better UX during API calls
5. **Store results:** Save verification results to database
6. **Add authentication:** Protect routes with user authentication
7. **Deploy to production:** Use Vercel, AWS, or your preferred platform

---

## 📞 Support

For HyperVerge API issues or questions:
- Contact HyperVerge support team
- Provide transaction IDs for faster debugging
- Check API status page for outages

For application issues:
- Check the console for error messages
- Verify environment variables are set correctly
- Ensure all dependencies are installed
