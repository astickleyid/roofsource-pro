# 🚀 Quick Reference Guide - RoofSource Pro

## 📁 File Structure

```
roofsource-pro/
├── src/
│   ├── components/
│   │   ├── ui/                    # Reusable UI components
│   │   └── features/              # Feature-specific components
│   ├── contexts/                  # React Context providers
│   ├── hooks/                     # Custom React hooks
│   ├── services/                  # External service integrations
│   ├── utils/                     # Utility functions
│   └── config/                    # Configuration files
├── index.html                     # HTML entry point
├── vite.config.js                 # Vite build config
└── package.json                   # Dependencies
```

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start dev server on :3000

# Production
npm run build           # Build for production
npm run preview         # Preview production build

# Dependencies
npm install             # Install all dependencies
npm install [package]   # Add new dependency
```

## 🎨 Component Usage

### Button
```jsx
import { Button } from './components/ui/Button';

<Button variant="primary" icon={Plus} onClick={handleClick}>
  Click Me
</Button>

// Variants: primary, secondary, outline, danger, ghost, dark
// Sizes: sm, md
```

### Input
```jsx
import { Input } from './components/ui/Input';

<Input 
  label="Email" 
  type="email" 
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### Dashboard
```jsx
<Dashboard 
  quotes={quotes}
  vendors={vendors}
  scope={scope}
  projectInfo={projectInfo}
  onEditScope={() => setView('scope')}
  onInspectVendor={setInspectingId}
  onSelectVendor={setSelectedId}
/>
```

## 🔥 Firebase Setup

### 1. Create Project
- Go to [Firebase Console](https://console.firebase.google.com)
- Create new project
- Enable Authentication (Email/Password)
- Create Firestore database

### 2. Get Credentials
- Project Settings → General → Your apps
- Copy Firebase config object

### 3. Configure Environment
```bash
cp .env.example .env
# Paste your Firebase credentials
```

### 4. Security Rules (Firestore)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /projects/{projectId} {
      allow read, write: if request.auth != null;
      
      match /scope/{itemId} {
        allow read, write: if request.auth != null;
      }
    }
    
    match /vendors/{vendorId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📊 Data Models

### Project
```javascript
{
  id: "1024",
  name: "Toledo Residential Complex",
  loc: "Toledo, OH",
  userId: "user-uuid",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Scope Item
```javascript
{
  id: "OC-DUR-DRIFT",  // Material SKU
  qty: 45,
  createdAt: Timestamp
}
```

### Vendor
```javascript
{
  id: "abc",
  name: "ABC Supply",
  type: "Network API",
  distance: 5,
  driveTime: 12,
  isManual: false,
  taxRate: 0.065,
  deliveryFee: 75.00,
  palletFee: 15.00,
  pricing: {
    "OC-DUR-DRIFT": 115.50,
    "IWS-ROLL": 65.00
  },
  userId: "user-uuid",
  createdAt: Timestamp
}
```

## 🧮 Utility Functions

### Unit Conversions
```javascript
import { convertSquaresToBundles, convertLinearFeetToRolls } from './utils/conversions';

const bundles = convertSquaresToBundles(10);  // 30
const rolls = convertLinearFeetToRolls(250);   // 3
```

### Landed Cost
```javascript
import { calculateLandedCost } from './utils/conversions';

const cost = calculateLandedCost(
  lineItems,     // Array of {unitPrice, qty}
  0.065,         // Tax rate (6.5%)
  75.00,         // Delivery fee
  15.00,         // Pallet fee per unit
  3              // Pallet count
);

// Returns: { subtotal, tax, deliveryFee, palletFees, grandTotal }
```

## 🤖 AI Parsing

### Mock Parsing (No API Key)
```javascript
import { parseQuoteEmail } from './services/openaiService';

const result = await parseQuoteEmail(emailText, false);
// Returns: { success, items: [...], error }
```

### OpenAI Parsing (Requires API Key)
```javascript
const result = await parseQuoteEmail(emailText, true);
// Uses GPT-4o-mini for intelligent extraction
```

## 📄 PDF Generation

```javascript
import { downloadPurchaseOrder } from './services/pdfService';

downloadPurchaseOrder(vendor, scope, projectInfo, quote);
// Automatically downloads formatted PDF
```

## 🔐 Authentication

### Login
```javascript
import { useAuth } from './contexts/AuthContext';

const { login } = useAuth();
const result = await login(email, password);

if (result.success) {
  // Redirect to dashboard
}
```

### Signup
```javascript
const { signup } = useAuth();
const result = await signup(email, password);
```

### Logout
```javascript
const { logout } = useAuth();
await logout();
```

### Protected Routes
```javascript
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

## 🎯 Context Usage

### Project Context
```javascript
import { useProject } from './contexts/ProjectContext';

const {
  scope,
  vendors,
  quotes,
  updateScopeQty,
  addScopeItem,
  addVendor,
  updateVendorPrice
} = useProject();
```

### Auth Context
```javascript
import { useAuth } from './contexts/AuthContext';

const { user, loading, login, logout } = useAuth();
```

## 🛣️ Routing

```javascript
// Navigate to project
navigate(`/project/${projectId}`);

// Get current project ID
const { id } = useParams();

// Navigate back to list
navigate('/');
```

## 🎨 Tailwind Classes Reference

### Colors
- `bg-blue-600` - Primary brand
- `bg-slate-900` - Dark backgrounds
- `text-gray-600` - Secondary text

### Spacing
- `p-6` - Padding (1.5rem)
- `mb-4` - Margin bottom (1rem)
- `gap-3` - Grid/flex gap (0.75rem)

### Layout
- `flex items-center justify-between`
- `grid grid-cols-3 gap-6`
- `max-w-5xl mx-auto`

## 🐛 Common Issues & Fixes

### Firebase Connection Error
```bash
# Check .env file exists and has valid credentials
# Ensure Firebase project is created in console
```

### Module Not Found
```bash
npm install  # Reinstall dependencies
```

### PDF Not Downloading
```javascript
// Check quote object has required fields:
// vendor, scope, projectInfo, lineItems, total
```

### AI Parsing Not Working
```bash
# Set REACT_APP_OPENAI_API_KEY in .env
# OR use mock parsing (useAI = false)
```

## 📱 Responsive Breakpoints

- `md:` - ≥768px (tablets)
- `lg:` - ≥1024px (laptops)
- `xl:` - ≥1280px (desktops)

## 🔗 Useful Links

- [Firebase Docs](https://firebase.google.com/docs)
- [React Router](https://reactrouter.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite](https://vitejs.dev)
- [OpenAI API](https://platform.openai.com/docs)
- [jsPDF](https://github.com/parallax/jsPDF)

## 📞 Need Help?

1. Check `IMPLEMENTATION.md` for detailed implementation notes
2. Review `FINAL_REPORT.md` for comprehensive overview
3. Read component source code (heavily commented)
4. Check browser console for errors

---

**Version**: 2.4.0 Pro  
**Last Updated**: December 2024
