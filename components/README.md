# Component System

This directory contains all reusable React components for the Excel Technologies domain management system. The components are designed to be modular, reusable, and maintainable.

## Component Structure

### Layout Components

- **Header**: Basic header wrapper with fixed positioning
- **Navigation**: Complete navigation bar with mobile menu support
- **Footer**: Site footer with links and company information

### Section Components

- **HeroSection**: Hero sections with customizable backgrounds and variants
- **Section**: Generic section wrapper with background and padding options

### Card Components

- **Card**: Basic card container with hover effects and variants
- **FeatureCard**: Specialized card for displaying features with icons
- **StatsCard**: Card for displaying statistics with trend indicators

### Form Components

- **Button**: Comprehensive button component with multiple variants and states
- **Input**: Form input with label, error handling, and icon support
- **Textarea**: Textarea input with label and error handling
- **LoginForm**: Complete login form with validation
- **RegisterForm**: Complete registration form with validation
- **ForgotPasswordForm**: Password reset form
- **ContactForm**: Contact form with submission handling

### Content Components

- **Logo**: Reusable logo component with size and variant options
- **FAQItem**: Accordion-style FAQ item component
- **ContactInfo**: Contact information display component

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
- `icon`: ReactNode

### Card Props

- `hover`: boolean
- `padding`: 'sm' | 'md' | 'lg'
- `variant`: 'default' | 'elevated' | 'outlined'

### Input Props

- `label`: string
- `error`: string
- `helperText`: string
- `icon`: ReactNode
- `fullWidth`: boolean

### HeroSection Props

- `background`: 'gradient' | 'solid' | 'image'
- `variant`: 'primary' | 'secondary' | 'dark'

### Section Props

- `background`: 'white' | 'gray' | 'primary' | 'dark'
- `padding`: 'sm' | 'md' | 'lg' | 'xl'

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

- React 18+
- Next.js 14+
- Tailwind CSS
- Lucide React (for icons)
- React Hot Toast (for notifications)
- Next.js Link and Image components
