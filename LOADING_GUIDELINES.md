# Loading States Guidelines

## Consistent Loading UI/UX Standards

This document defines the standard approach for loading states across the entire application to ensure consistent user experience and perfect centering on all screen sizes.

---

## 🎯 Core Principles

### 1. **Perfect Centering**

All loading indicators must be perfectly centered both horizontally and vertically on all screen sizes and devices.

### 2. **Consistent Sizing**

- **Small (sm)**: `h-6 w-6` - For inline/button loading
- **Medium (md)**: `h-10 w-10` - For card/section loading
- **Large (lg)**: `h-14 w-14` - For page section loading
- **Extra Large (xl)**: `h-20 w-20` - For full-page loading

### 3. **Minimum Height**

Always use minimum height to ensure proper vertical centering:

- **Full Screen**: `min-h-screen` or `fixed inset-0`
- **Content Section**: `min-h-[300px]` to `min-h-[60vh]`
- **Card/Component**: `min-h-[200px]`

---

## 📦 Components

### CenteredLoading (Primary Component)

```typescript
import CenteredLoading from '@/components/CenteredLoading';

// Full screen loading
<CenteredLoading
  message="Loading..."
  size="lg"
  fullScreen={true}
/>

// Section loading
<CenteredLoading
  message="Loading data..."
  size="md"
  fullScreen={false}
/>
```

### InlineLoader (For Buttons/Inline Use)

```typescript
import { InlineLoader } from "@/components/CenteredLoading";

<button disabled={loading}>
  {loading ? <InlineLoader size="sm" /> : "Submit"}
</button>;
```

---

## 🎨 Pattern Examples

### ✅ CORRECT: Full Page Loading

```tsx
if (isLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}
```

### ✅ CORRECT: Content Section Loading

```tsx
{loading ? (
  <div className="flex items-center justify-center min-h-[300px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
      <p className="text-gray-600">Loading data...</p>
    </div>
  </div>
) : (
  // Content
)}
```

### ✅ CORRECT: Card/Table Loading

```tsx
{loading ? (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
  </div>
) : (
  // Table content
)}
```

### ❌ INCORRECT: Poor Centering

```tsx
// ❌ BAD: No minimum height, not properly centered
{
  loading && (
    <div className="p-8 text-center">
      <div className="animate-spin h-8 w-8"></div>
    </div>
  );
}

// ❌ BAD: Inconsistent sizing and spacing
{
  loading && (
    <div className="flex justify-center py-4">
      <div className="animate-spin h-6 w-6"></div>
    </div>
  );
}
```

---

## 🔧 Implementation Checklist

### For Full-Page Loading States

- [ ] Use `min-h-screen` or `fixed inset-0`
- [ ] Use `flex items-center justify-center`
- [ ] Use size `lg` or `xl` (12-20px)
- [ ] Include descriptive message
- [ ] Add fade-in animation

### For Section/Component Loading

- [ ] Use `min-h-[300px]` or appropriate minimum height
- [ ] Use `flex items-center justify-center`
- [ ] Use size `md` (10px)
- [ ] Center horizontally with `mx-auto`
- [ ] Add appropriate padding (`py-8` or `py-12`)

### For Inline/Button Loading

- [ ] Use `InlineLoader` component
- [ ] Size `sm` (4-6px)
- [ ] Disable button when loading
- [ ] Replace button text with loader

---

## 🎯 Color Standards

### Loading Spinner Colors

- **Primary**: `text-blue-600` / `border-blue-600` - Default
- **Success**: `text-green-600` / `border-green-600` - Success states
- **Warning**: `text-yellow-600` / `border-yellow-600` - Warning states
- **Neutral**: `text-gray-600` / `border-gray-600` - Neutral/secondary

### Text Colors

- **Primary Message**: `text-gray-600` - Main loading message
- **Secondary Message**: `text-gray-500` - Supporting text

---

## 📱 Responsive Considerations

### Mobile Optimization

```tsx
// Use responsive sizing
<div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14">
  {/* Spinner */}
</div>

// Responsive padding
<div className="py-8 sm:py-10 lg:py-12">
  {/* Content */}
</div>
```

### Touch Considerations

- Minimum loading indicator size on mobile: `h-8 w-8`
- Add appropriate padding for tap targets
- Ensure text is readable on all devices

---

## 🚀 Performance

### Animation Performance

```tsx
// ✅ GOOD: CSS transform (GPU accelerated)
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
>
  <Loader2 />
</motion.div>

// ✅ GOOD: Tailwind animate-spin
<div className="animate-spin rounded-full border-b-2">
</div>
```

### Loading State Optimization

- Use `React.lazy()` for code splitting
- Implement skeleton screens for perceived performance
- Show loading immediately (no delay)
- Provide meaningful messages
- Add timeout warnings for long loads

---

## 📝 Common Patterns by Page Type

### Admin Pages

```tsx
if (isLoading) {
  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {pageName}...</p>
        </div>
      </div>
    </AdminLayout>
  );
}
```

### User Dashboard Pages

```tsx
if (isLoading) {
  return (
    <UserLayout user={user} onLogout={performLogout}>
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[50vh]">
          <CenteredLoading
            message="Loading your data..."
            size="lg"
            fullScreen={false}
          />
        </div>
      </div>
    </UserLayout>
  );
}
```

### Table Loading

```tsx
{
  loading ? (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Loading records...</p>
      </div>
    </div>
  ) : (
    <table>...</table>
  );
}
```

### Modal/Popup Loading

```tsx
<Modal>
  {loading ? (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ) : (
    // Modal content
  )}
</Modal>
```

---

## 🎨 Animation Guidelines

### Standard Spinner

```tsx
// Always use these exact properties for consistency
animate={{ rotate: 360 }}
transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
```

### Pulsing Effect (Optional Enhancement)

```tsx
<motion.div
  animate={{
    scale: [1, 1.2, 1],
    opacity: [0.5, 0, 0.5],
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut",
  }}
  className="absolute inset-0 border-2 border-blue-200 rounded-full"
/>
```

---

## ✅ Migration Checklist

When updating existing loading states:

1. **Find all loading states**

   ```bash
   grep -r "animate-spin" app/
   grep -r "Loading\.\.\." app/
   grep -r "isLoading" app/
   ```

2. **Update centering**

   - Add `min-h-*` for vertical centering
   - Use `flex items-center justify-center`
   - Ensure `mx-auto` for horizontal centering

3. **Standardize sizing**

   - Full page: `h-12 w-12` or larger
   - Section: `h-10 w-10`
   - Inline: `h-4 w-4` to `h-6 w-6`

4. **Add consistent messaging**

   - Clear, descriptive text
   - Appropriate font weight
   - Consistent color scheme

5. **Test responsiveness**
   - Check on mobile (320px-640px)
   - Check on tablet (640px-1024px)
   - Check on desktop (1024px+)

---

## 🐛 Troubleshooting

### Loading Not Centered Vertically

**Problem**: Spinner appears at top of container

**Solution**:

```tsx
// Add min-h-* and flex centering
<div className="flex items-center justify-center min-h-[300px]">
  {/* Loading spinner */}
</div>
```

### Spinner Too Small on Mobile

**Problem**: Spinner hard to see on small screens

**Solution**:

```tsx
// Use responsive sizing
<div className="h-8 w-8 sm:h-10 sm:w-10">{/* Spinner */}</div>
```

### Loading State Jumps/Shifts Layout

**Problem**: Page jumps when loading state changes

**Solution**:

```tsx
// Reserve space with min-height
<div className="min-h-[400px]">{loading ? <Spinner /> : <Content />}</div>
```

---

## 📚 Additional Resources

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Tailwind Flexbox Guide](https://tailwindcss.com/docs/flex)
- [React Loading Best Practices](https://react.dev/learn/conditional-rendering)

---

**Last Updated**: October 28, 2025  
**Version**: 1.0.0

---

_Maintained by Excel Technologies Development Team_
