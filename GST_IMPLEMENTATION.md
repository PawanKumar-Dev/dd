# GST Implementation Guide

## Overview

This document describes the implementation of GST (Goods and Services Tax) breakdown in all invoices and email templates for the Excel Technologies Domain Management System.

**Implementation Date:** October 28, 2025  
**Version:** 2.7.0  
**Tax Rate:** 18% GST (as per Indian tax regulations)

---

## 🎯 Key Features

### 1. **Invoice GST Breakdown**

All PDF invoices (both user and admin) now display:

- **Subtotal:** Base amount before GST
- **GST (18%):** Tax amount calculated at 18%
- **Total (incl. GST):** Final amount including tax
- **Note:** Clear indication that GST is included

### 2. **Email GST Breakdown**

Order confirmation emails include:

- Itemized price breakdown
- GST calculation (18%)
- Total with GST clearly marked
- Professional formatting with color coding

### 3. **Invoice Modal Component**

The Invoice.tsx modal component shows:

- Real-time GST calculation
- Consistent formatting with PDF invoices
- Mobile-responsive layout

---

## 📊 GST Calculation Formula

```typescript
// Given: Total amount (with GST included)
const total = 1180; // Example: ₹1180

// Calculate base amount (Subtotal)
const baseAmount = total / 1.18; // ₹1000

// Calculate GST amount
const gstAmount = total - baseAmount; // ₹180

// GST percentage
const gstRate = 18; // 18%
```

### Why Divide by 1.18?

When the total price already includes 18% GST:

- Total = Base × 1.18
- Therefore: Base = Total / 1.18
- GST = Total - Base

---

## 🔧 Implementation Details

### 1. PDF Invoice Generation

**Files Modified:**

- `app/api/orders/[id]/invoice/route.ts`
- `app/api/admin/orders/[id]/invoice/route.ts`

**Changes:**

```typescript
// Calculate GST breakdown
const baseAmount = total / 1.18;
const gstAmount = total - baseAmount;

// Display in summary box
- Subtotal: ₹{baseAmount}
- GST (18%): ₹{gstAmount}
- Total (incl. GST): ₹{total}
```

**Visual Improvements:**

- Increased summary box height from 50mm to 70mm
- Added divider line between GST and total
- Changed total text color to primary blue
- Updated footer note to "\*GST (18%) included in total"

### 2. Email Templates

**File Modified:**

- `lib/email.ts`

**Changes:**

```typescript
// Email HTML template now includes:
<tr>
  <td>Subtotal:</td>
  <td>₹{(total / 1.18).toFixed(2)}</td>
</tr>
<tr>
  <td>GST (18%):</td>
  <td>₹{(total - (total / 1.18)).toFixed(2)}</td>
</tr>
<tr style="border-top: 2px solid #e5e7eb;">
  <td>Total (incl. GST):</td>
  <td>₹{total.toFixed(2)}</td>
</tr>
```

### 3. Invoice Modal Component

**File Modified:**

- `components/Invoice.tsx`

**Changes:**

- Added subtotal and GST rows to Order Summary
- Styled total in blue color for emphasis
- Updated note text for clarity
- Maintained responsive layout

---

## 🎨 Design Specifications

### PDF Invoice

| Element            | Style                                        |
| ------------------ | -------------------------------------------- |
| **Summary Box**    | Light gray background (#f8fafc), blue border |
| **Subtotal & GST** | Gray text, 10pt normal font                  |
| **Divider Line**   | Light gray, 0.3mm width                      |
| **Total**          | Blue text (#3b82f6), 12pt bold font          |
| **Note**           | Light gray, 8pt, centered                    |

### Email Template

| Element            | Style                              |
| ------------------ | ---------------------------------- |
| **Background**     | Light gray (#f8fafc)               |
| **Subtotal & GST** | Gray text (#6b7280), medium weight |
| **Total**          | Blue text (#3b82f6), 18px bold     |
| **Divider**        | 2px solid border (#e5e7eb)         |

### Invoice Modal

| Element         | Style                            |
| --------------- | -------------------------------- |
| **Container**   | Gray background, rounded corners |
| **Row Spacing** | 0.5rem (space-y-2)               |
| **Total Color** | Blue-600 (Tailwind)              |
| **Border**      | Gray-300 border-t                |

---

## ✅ Testing Checklist

### Invoice Generation

- [x] User invoice API generates PDF with GST breakdown
- [x] Admin invoice API generates PDF with GST breakdown
- [x] GST calculations are accurate (base + 18% = total)
- [x] PDF layout is not broken with increased summary box height
- [x] All text is readable and properly aligned

### Email Templates

- [x] Order confirmation emails show GST breakdown
- [x] Email layout is mobile-responsive
- [x] GST calculation matches invoice PDFs
- [x] All email styles render correctly in major email clients

### Invoice Modal

- [x] Modal component displays GST breakdown
- [x] Calculations match PDF invoices
- [x] Responsive design works on mobile devices
- [x] No linter errors or TypeScript issues

### Calculation Accuracy

```
Example Test Cases:
1. Total: ₹1180 → Subtotal: ₹1000, GST: ₹180 ✓
2. Total: ₹590 → Subtotal: ₹500, GST: ₹90 ✓
3. Total: ₹2360 → Subtotal: ₹2000, GST: ₹360 ✓
```

---

## 📝 Tax Compliance Notes

### Indian GST Regulations

1. **GST Rate:** 18% is the standard GST rate for digital services in India
2. **Display Requirement:** GST must be clearly indicated on all invoices
3. **Breakdown:** Showing subtotal and GST separately improves transparency
4. **Total Inclusive:** The total amount should clearly state it includes GST

### Invoice Requirements

All invoices now include:

- ✅ Clear GST breakdown
- ✅ GST percentage (18%) displayed
- ✅ Subtotal before tax
- ✅ Total with tax included
- ✅ Note indicating GST inclusion

---

## 🚀 Future Enhancements

### Potential Improvements

1. **Variable GST Rates**

   - Support different GST rates based on service type
   - Make GST rate configurable via environment variable

2. **International Tax Support**

   - Add support for VAT (EU)
   - Support other regional tax systems
   - Currency-specific tax rates

3. **Detailed Tax Breakdown**

   - Split GST into CGST + SGST for Indian invoices
   - Show IGST for interstate transactions
   - Add GST registration number display

4. **Tax Reports**
   - Generate monthly GST reports for filing
   - Export tax data for accounting software
   - Dashboard view of total GST collected

---

## 🔍 Code Examples

### Complete GST Calculation Function

```typescript
interface GSTCalculation {
  subtotal: number;
  gstAmount: number;
  gstRate: number;
  total: number;
}

function calculateGST(
  totalWithGST: number,
  gstRate: number = 18
): GSTCalculation {
  const divisor = 1 + gstRate / 100;
  const subtotal = totalWithGST / divisor;
  const gstAmount = totalWithGST - subtotal;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    gstAmount: parseFloat(gstAmount.toFixed(2)),
    gstRate,
    total: totalWithGST,
  };
}

// Usage
const result = calculateGST(1180, 18);
console.log(result);
// Output: { subtotal: 1000, gstAmount: 180, gstRate: 18, total: 1180 }
```

### React Component Example

```tsx
interface OrderSummaryProps {
  total: number;
  currency: string;
}

function OrderSummaryWithGST({ total, currency }: OrderSummaryProps) {
  const baseAmount = total / 1.18;
  const gstAmount = total - baseAmount;

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₹{baseAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>GST (18%):</span>
          <span>₹{gstAmount.toFixed(2)}</span>
        </div>
        <div className="border-t pt-2">
          <div className="flex justify-between font-semibold">
            <span>Total (incl. GST):</span>
            <span className="text-blue-600">
              ₹{total.toFixed(2)} {currency}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 📞 Support

For questions about GST implementation:

- **Technical Lead:** Excel Technologies Development Team
- **Email:** dev@exceltechnologies.com
- **Documentation:** This file + CHANGELOG.md

---

## 📚 Related Documentation

- `CHANGELOG.md` - Version history and changes
- `RELEASE_NOTES_v2.7.0.md` - Complete release notes
- `lib/email.ts` - Email template implementation
- `components/Invoice.tsx` - Invoice modal component

---

**Last Updated:** October 28, 2025  
**Implemented By:** Excel Technologies Development Team  
**Version:** 2.7.0
