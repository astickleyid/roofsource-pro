# RoofSource Pro

A comprehensive roofing materials sourcing and RFQ management platform.

## 🏗️ Architecture

### Phase 0: Component Modularization ✅
- UI Components: `Button`, `Input`, `Card`
- Feature Components: `ScopeEditor`, `VendorManager`, `Dashboard`
- State Management: React Context (`ProjectContext`)

### Phase I: Backend Infrastructure ✅
- Firebase Authentication
- Firestore Database
- Real-time Data Synchronization
- Business Logic (Tax, Delivery, Landed Cost Calculations)

### Phase II: Business Logic ✅
- Unit conversion utilities
- Landed cost calculator (tax + delivery + pallet fees)
- Enhanced vendor data structure

## 📦 Installation

```bash
npm install
```

## 🔐 Configuration

1. Copy `.env.example` to `.env`
2. Add your Firebase credentials
3. Configure Firebase project with the following collections:

### Firestore Schema

```
users/{userId}
  - email: string
  - createdAt: timestamp

projects/{projectId}
  - name: string
  - location: string
  - userId: string
  - createdAt: timestamp
  - updatedAt: timestamp
  
  /scope (subcollection)
    /{itemId}
      - id: string (material SKU)
      - qty: number
      - createdAt: timestamp

vendors/{vendorId}
  - name: string
  - type: string
  - distance: number
  - driveTime: number
  - isManual: boolean
  - taxRate: number (decimal)
  - deliveryFee: number
  - palletFee: number
  - pricing: map<string, number>
  - userId: string
  - createdAt: timestamp
```

## 🚀 Usage

### With Firebase (Production)
```javascript
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';

// Wrap your app
<AuthProvider>
  <ProjectProvider>
    <App />
  </ProjectProvider>
</AuthProvider>
```

### Without Firebase (Development)
The current implementation uses local state as a fallback.

## 🛠️ Utilities

### Unit Conversions
```javascript
import { convertSquaresToBundles, calculateLandedCost } from './utils/conversions';

const bundles = convertSquaresToBundles(10); // 30 bundles
```

### Landed Cost Calculation
```javascript
const cost = calculateLandedCost(lineItems, taxRate, deliveryFee, palletFee, palletCount);
// Returns: { subtotal, tax, deliveryFee, palletFees, grandTotal }
```

## 📋 Next Steps

- **Analytics Dashboard**: Historical price tracking and trends
- **Mobile App**: React Native version
- **Bulk Import**: Excel/CSV import for large BOMs
- **API Integrations**: Direct vendor API connections
- **Notifications**: Email alerts for price changes

## 🧪 Testing

```bash
npm test
```

## 📄 License

ISC
