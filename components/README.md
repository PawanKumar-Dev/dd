# Component System - Excel Technologies Domain Management

This directory contains all reusable React components for the Excel Technologies domain management system. The components are designed to be modular, reusable, and maintainable with comprehensive TypeScript support.

## Component Structure

### Layout Components

- **Header**: Site header with navigation and user menu
- **Navigation**: Complete navigation bar with mobile menu support
- **Footer**: Site footer with links and company information
- **PageTransition**: Smooth page transition animations

### UI Components

- **Button**: Comprehensive button with multiple variants (primary, secondary, outline, ghost, danger)
- **Input**: Form input with label, error handling, and icon support
- **Textarea**: Textarea input with validation and character counting
- **Card**: Card container with hover effects and variants
- **Modal**: Modal dialog with backdrop and close functionality
- **LoadingSpinner**: Loading spinner with customizable size and color
- **EmptyState**: Empty state component for no-data scenarios

### Form Components

- **LoginForm**: Complete login functionality with validation
- **RegisterForm**: User registration form with multi-step support
- **MultiStageRegisterForm**: Multi-step registration with progress tracking
- **ForgotPasswordForm**: Password reset form with email validation
- **ContactForm**: Contact form with submission handling and validation

### Domain Components

- **DomainSearch**: Domain search interface with real-time pricing
- **DomainBookingProgress**: Domain booking progress tracking
- **DomainRenewalModal**: Domain renewal modal with pricing
- **DomainRequirementsModal**: Domain requirements and validation
- **NameServerManagement**: RDAP nameserver lookup and management
- **DNSManagement**: Complete DNS record management with CRUD operations
- **DNSRecordEditor**: Inline DNS record editing component
- **DNSRecordTable**: DNS records display with edit/delete functionality

### Payment Components

- **Invoice**: PDF invoice generation and display
- **LivePricingIndicator**: Real-time pricing indicator with updates

### Admin Components

- **AdminCard**: Admin-specific card component
- **AdminTable**: Data table for admin interfaces
- **AdminTabs**: Tab navigation for admin sections
- **AdminPasswordReset**: Admin password reset functionality

### Content Components

- **Logo**: Reusable logo component with size and variant options
- **FAQItem**: Accordion-style FAQ item component
- **ContactInfo**: Contact information display component
- **FeatureCard**: Feature display card with icons and descriptions
- **StatsCard**: Statistics display card with trend indicators
- **HeroSection**: Hero section component with customizable backgrounds
- **Section**: Generic section wrapper with background and padding options
- **LoadingPage**: Full-page loading component

### Utility Components

- **ClientOnly**: Client-side only rendering component
- **OutboundIPBadge**: Outbound IP address display badge

## Usage Examples

### Basic Component Usage

```tsx
import { Button, Card, Input } from "@/components";

function MyComponent() {
  return (
    <Card>
      <Input label="Name" placeholder="Enter your name" />
      <Button variant="primary">Submit</Button>
    </Card>
  );
}
```

### Section with Hero

```tsx
import { HeroSection, Section, FeatureCard } from "@/components";

function HomePage() {
  return (
    <div>
      <HeroSection>
        <h1>Welcome to Excel Technologies</h1>
      </HeroSection>

      <Section background="white">
        <FeatureCard
          icon={<Globe className="h-8 w-8" />}
          title="Domain Management"
          description="Manage your domains with ease"
        />
      </Section>
    </div>
  );
}
```

### Form Components

```tsx
import { LoginForm, RegisterForm, ContactForm } from "@/components";

function AuthPage() {
  return <LoginForm />;
}

function ContactPage() {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <ContactInfo />
      <ContactForm />
    </div>
  );
}
```

## Component Props

### Button Props

- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `fullWidth`: boolean
- `loading`: boolean
- `disabled`: boolean
- `icon`: ReactNode
- `onClick`: () => void

### Card Props

- `hover`: boolean
- `padding`: 'sm' | 'md' | 'lg'
- `variant`: 'default' | 'elevated' | 'outlined'
- `className`: string

### Input Props

- `label`: string
- `error`: string
- `helperText`: string
- `icon`: ReactNode
- `fullWidth`: boolean
- `required`: boolean
- `type`: 'text' | 'email' | 'password' | 'number'
- `placeholder`: string
- `value`: string
- `onChange`: (e: ChangeEvent<HTMLInputElement>) => void

### DomainSearch Props

- `className`: string
- `onDomainSelect`: (domain: DomainResult) => void
- `showPricing`: boolean
- `autoSearch`: boolean

### Modal Props

- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `children`: ReactNode

### HeroSection Props

- `background`: 'gradient' | 'solid' | 'image'
- `variant`: 'primary' | 'secondary' | 'dark'
- `className`: string
- `children`: ReactNode

### Section Props

- `background`: 'white' | 'gray' | 'primary' | 'dark'
- `padding`: 'sm' | 'md' | 'lg' | 'xl'
- `className`: string
- `children`: ReactNode

## Styling

All components use Tailwind CSS classes and follow the design system:

- Primary colors: `primary-600`, `primary-700`, etc.
- Gray scale: `gray-50` to `gray-900`
- Consistent spacing and typography
- Responsive design patterns

## Best Practices

1. **Import from index**: Use `import { ComponentName } from '@/components'` for cleaner imports
2. **Composition over inheritance**: Build complex UIs by combining simple components
3. **Props validation**: All components have TypeScript interfaces for props
4. **Accessibility**: Components include proper ARIA attributes and keyboard navigation
5. **Responsive design**: All components are mobile-first and responsive

## Adding New Components

When adding new components:

1. Create the component file in this directory
2. Export it from `index.ts`
3. Add TypeScript interfaces for props
4. Include proper accessibility attributes
5. Use consistent Tailwind CSS classes
6. Add JSDoc comments for complex props
7. Test on multiple screen sizes

## Component Dependencies

- **React 18+** - Core React library
- **Next.js 14+** - React framework with App Router
- **TypeScript 5.3.3** - Type safety and development experience
- **Tailwind CSS 3.3.6** - Utility-first CSS framework
- **Framer Motion 12.23.22** - Animation library
- **Lucide React 0.294.0** - Icon library (1000+ icons)
- **React Hot Toast 2.4.1** - Toast notification system
- **React Hook Form 7.48.2** - Form handling
- **Zustand 4.4.7** - State management
- **Next.js Link and Image** - Next.js components
- **Class Variance Authority** - Component variant management
- **Tailwind Merge** - Tailwind class merging utility

## Component Features

### TypeScript Support

- Full TypeScript interfaces for all props
- Strict type checking enabled
- IntelliSense support for all components
- Type-safe event handlers

### Accessibility

- ARIA attributes for screen readers
- Keyboard navigation support
- Focus management
- Semantic HTML structure

### Responsive Design

- Mobile-first approach
- Breakpoint-specific styling
- Touch-friendly interfaces
- Optimized for all screen sizes

### Performance

- Lazy loading support
- Memoization where appropriate
- Optimized re-renders
- Bundle size optimization

## Development Guidelines

### Creating New Components

1. **File Structure**: Create component file in appropriate subdirectory
2. **TypeScript**: Define interfaces for all props
3. **Exports**: Add to `index.ts` for clean imports
4. **Documentation**: Add JSDoc comments for complex props
5. **Testing**: Test on multiple screen sizes and devices
6. **Accessibility**: Include proper ARIA attributes
7. **Styling**: Use consistent Tailwind CSS classes

### Component Naming

- Use PascalCase for component names
- Use descriptive names that indicate purpose
- Follow the pattern: `[Category][Purpose]Component`
- Examples: `DomainSearch`, `AdminTable`, `PaymentModal`

### Props Design

- Use optional props with sensible defaults
- Provide clear prop types and descriptions
- Use union types for variants
- Include className prop for custom styling
- Use callback props for event handling

---

**Last Updated**: October 13, 2025  
**Version**: 2.2.0  
**Author**: Excel Technologies  
**Status**: Production-ready with comprehensive component library and DNS management features
