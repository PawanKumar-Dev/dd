# Excel Technologies - Domain Management System

## Project Structure

This document outlines the comprehensive component-based architecture of the Excel Technologies domain management system.

## 📁 Directory Structure

```
dd/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── admin/                # Admin-only endpoints
│   │   ├── domains/              # Domain management
│   │   ├── payments/             # Payment processing
│   │   └── contact/              # Contact form
│   ├── dashboard/                # User dashboard
│   ├── admin/                    # Admin panel
│   ├── dns/                      # DNS management
│   ├── checkout/                 # Checkout process
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   ├── forgot-password/          # Password reset
│   ├── about/                    # About Us page
│   ├── contact/                  # Contact Us page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
├── components/                    # Reusable Components
│   ├── Layout/                   # Layout components
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   └── Footer.tsx
│   ├── Forms/                    # Form components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Textarea.tsx
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   └── ContactForm.tsx
│   ├── Cards/                    # Card components
│   │   ├── Card.tsx
│   │   ├── FeatureCard.tsx
│   │   └── StatsCard.tsx
│   ├── Sections/                 # Section components
│   │   ├── HeroSection.tsx
│   │   └── Section.tsx
│   ├── Content/                  # Content components
│   │   ├── Logo.tsx
│   │   ├── FAQItem.tsx
│   │   └── ContactInfo.tsx
│   ├── index.ts                  # Component exports
│   └── README.md                 # Component documentation
├── lib/                          # Utility Libraries
│   ├── auth.ts                   # JWT authentication
│   ├── admin-auth.ts             # Admin authentication
│   ├── mongodb.ts                # Database connection
│   ├── resellerclub.ts           # ResellerClub API
│   ├── razorpay.ts               # Razorpay integration
│   ├── email.ts                  # Email service
│   ├── validation.ts             # Input validation
│   ├── security.ts               # Security utilities
│   ├── security-middleware.ts    # Security middleware
│   ├── rate-limit.ts             # Rate limiting
│   ├── utils.ts                  # General utilities
│   └── types.ts                  # TypeScript types
├── models/                       # Database Models
│   ├── User.ts
│   ├── Domain.ts
│   ├── Payment.ts
│   └── DNSRecord.ts
├── store/                        # State Management
│   └── cartStore.ts              # Zustand cart store
├── public/                       # Static Assets
│   ├── logo-black.png
│   ├── logo-white.png
│   └── favicon.png
├── scripts/                      # Setup Scripts
│   ├── setup.js
│   └── init-db.js
├── middleware.ts                 # Next.js middleware
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── README.md                     # Project documentation
├── API.md                        # API documentation
└── PROJECT_STRUCTURE.md          # This file
```

## 🧩 Component Architecture

### 1. Layout Components

- **Header**: Basic header wrapper
- **Navigation**: Complete navigation with mobile menu
- **Footer**: Site footer with links

### 2. Form Components

- **Button**: Comprehensive button with variants
- **Input**: Form input with validation
- **Textarea**: Textarea with validation
- **LoginForm**: Complete login functionality
- **RegisterForm**: Complete registration
- **ForgotPasswordForm**: Password reset
- **ContactForm**: Contact form with submission

### 3. Card Components

- **Card**: Basic card container
- **FeatureCard**: Feature display card
- **StatsCard**: Statistics display card

### 4. Section Components

- **HeroSection**: Hero sections with variants
- **Section**: Generic section wrapper

### 5. Content Components

- **Logo**: Reusable logo component
- **FAQItem**: Accordion FAQ item
- **ContactInfo**: Contact information display

## 🔧 Key Features

### Security

- JWT authentication with proper expiration
- Input validation and sanitization
- Rate limiting on API endpoints
- Admin-only route protection
- XSS and injection protection

### User Experience

- Responsive design (mobile-first)
- Fixed navigation with backdrop blur
- Smooth animations and transitions
- Loading states and error handling
- Toast notifications

### Developer Experience

- TypeScript throughout
- Component-based architecture
- Reusable components
- Comprehensive documentation
- Consistent code style

## 📱 Page Structure

### Public Pages

- **Homepage**: Hero, features, stats, FAQ
- **About Us**: Company information and mission
- **Contact Us**: Contact form and information
- **Login**: User authentication
- **Register**: User registration
- **Forgot Password**: Password reset

### Protected Pages

- **Dashboard**: User domain management
- **Admin Panel**: Admin user management
- **DNS Management**: DNS record management
- **Checkout**: Payment processing

## 🎨 Design System

### Colors

- Primary: Blue (#3B82F6)
- Secondary: Gray (#6B7280)
- Success: Green (#10B981)
- Error: Red (#EF4444)
- Warning: Yellow (#F59E0B)

### Typography

- Headings: Font-bold, various sizes
- Body: Font-medium, responsive sizes
- Captions: Font-normal, smaller sizes

### Spacing

- Consistent padding and margins
- Responsive spacing (sm, md, lg, xl)
- Grid-based layouts

## 🚀 Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Setup**

   ```bash
   cp .env.example .env
   # Configure your environment variables
   ```

3. **Database Setup**

   ```bash
   npm run init-db
   ```

4. **Development Server**
   ```bash
   npm run dev
   ```

## 📚 Component Usage

### Import Components

```tsx
import { Button, Card, Input, HeroSection } from "@/components";
```

### Use in Pages

```tsx
function MyPage() {
  return (
    <div>
      <HeroSection>
        <h1>My Page</h1>
      </HeroSection>

      <Section background="white">
        <Card>
          <Input label="Name" />
          <Button variant="primary">Submit</Button>
        </Card>
      </Section>
    </div>
  );
}
```

## 🔒 Security Features

- **Authentication**: JWT with proper expiration
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive validation and sanitization
- **Rate Limiting**: API endpoint protection
- **XSS Protection**: Input sanitization
- **Injection Protection**: SQL/NoSQL injection prevention

## 📈 Performance

- **Component-based**: Reusable and maintainable
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component
- **Caching**: MongoDB connection caching
- **Responsive**: Mobile-first design

## 🧪 Testing

- **Type Safety**: TypeScript throughout
- **Component Testing**: Isolated component testing
- **API Testing**: Endpoint testing
- **Security Testing**: Input validation testing

## 📖 Documentation

- **Component README**: Detailed component documentation
- **API Documentation**: Complete API reference
- **Project README**: Setup and usage instructions
- **TLD Pricing Guide**: Comprehensive TLD mapping and pricing system documentation
- **Code Comments**: Inline documentation

### Documentation Files

- `README.md` - Main project documentation
- `API.md` - Complete API reference with TLD pricing endpoints
- `PROJECT_STRUCTURE.md` - This file, project architecture overview
- `SETUP.md` - Setup and installation instructions
- `TESTING_MODE.md` - Testing and development guidelines

This component-based architecture makes the project highly maintainable, scalable, and developer-friendly while providing a consistent user experience across all pages.
