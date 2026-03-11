# Data Strategy & Architecture: Code vs. Database

This document explains where EventVista stores its information and the technical reasoning behind choosing the codebase (static) or the database (dynamic) for specific data types.

---

## 1. Data Stored in the Database (MongoDB)
*Dynamic, persistent, and user-specific data.*

### **A. Project Records (`Project.ts`)**
- **Metadata**: Project Name, Client Name, Location, Date, and Status.
- **Scene State**: The `data` field stores a JSON blob of all placed furniture items.
  - *Fields*: `yaw`, `pitch`, `scale`, `facing` (rotation), `flipped`, and the linked `furnitureId`.
- **Reasoning**: Projects must be editable, deletable, and private to the owner. This data changes frequently as the design evolves.

### **B. User & Custom Assets (`User.ts`)**
- **Authentication**: Email (encrypted) and password hashes.
- **Custom Furniture**: Metadata for images uploaded by the user.
  - *Fields*: `id`, `label`, `price`, and `imagePaths` (Front, Back, Left, Right).
- **Reasoning**: Custom uploads must persist across sessions and belong strictly to the user who uploaded them.

### **C. Image Files (Local Storage)**
- **Uploads**: Actual image files are stored in `/public/uploads/furniture/[user-id]/`.
- **Reasoning**: Storing large binary files (images) in MongoDB can slow down queries. We store the *paths* in the DB and the *files* on the server filesystem for high-speed serving.

---

## 2. Data Stored in the Code (Static)
*Universal, high-performance, and structural data.*

### **A. Standard Furniture Library (`src/lib/furniture.ts`)**
- **Base Assets**: The standard library of items (Chair, Sofa, Table, etc.).
- **Professional Estimations**: Default "Professional Library" prices used as fallbacks for budget calculations.
- **Dimensions**: Default width/height for initial placement.
- **Reasoning**: These are "Read-Only" assets available to all users. Storing them in code ensures **zero-latency** access and eliminates database requests when loading the editor sidebar.

### **B. Venue & Technical Specs (Static Constants)**
- **Scene Metadata**: 360° image sources, Venue Dimensions (e.g., 25m x 40m), and Setup Timelines.
- **Rental Pricing**: Daily rent prices for the default 360° environments.
- **Reasoning**: The 360° scenes are fixed environments. Unless the app allows users to upload their own 360° panoramas (future feature), these specs remain constant parts of the application's core logic.

### **C. Financial Logic & Pricing Rules**
- **Global Fees**: Fixed Agency Fee ($2,500) and Logistics Estimation (15%).
- **PDF Sections**: The order and logic of the 8-section proposal report.
- **Reasoning**: These rules define the "EventVista Standard" for professional proposals. Hardcoding them ensures consistency across all generated PDFs.

---

## 3. The "Hybrid Pricing" Flow
One of the most complex parts of the system is how it reconciles prices for the PDF export:

1. **Check DB**: Does the specific placement in the project have a price? (User Override)
2. **Check User Profile**: If it's a custom asset, fetch the price from the User's `customFurniture` array in the DB.
3. **Check Code Library**: If it's a standard asset and the price is missing/0 in the project, fetch the estimation from `src/lib/furniture.ts` (Static Fallback).
4. **Final Result**: The system ensures a budget total is always calculated, prioritizing user data but never failing if it's missing.

---

## 4. Summary Table

| Data Type | Storage | Reason |
| :--- | :--- | :--- |
| **Project Design** | Database | Must be saved/updated by user. |
| **User Uploads** | Files + DB | Multi-session persistence. |
| **Standard Items** | Code | Performance & Asset Consistency. |
| **Venue Dimensions**| Code | Fixed structural data. |
| **Agency Fees** | Code | Business logic standard. |
| **Client Info** | Database | Variable per project. |

---
*Last Updated: 2026-02-28*
