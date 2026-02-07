# Responsive Components

Reusable components for consistent responsive design across all user-facing pages.

## Quick Start

```tsx
import { PageContainer, ResponsiveCard, ResponsiveGrid, ResponsiveText } from '@/components/responsive';

export default function MyPage() {
  return (
    <PageContainer maxWidth="7xl" background="gradient">
      <ResponsiveText variant="h1" color="primary" weight="bold">
        Welcome
      </ResponsiveText>
      <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }}>
        <ResponsiveCard padding="lg" shadow="xl" hover>
          Card Content
        </ResponsiveCard>
      </ResponsiveGrid>
    </PageContainer>
  );
}
```

## Components

### PageContainer

Main wrapper for all user-facing pages. Provides consistent layout and spacing.

**Props:**
- `maxWidth`: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full' (default: '7xl')
- `background`: 'default' | 'gradient' | 'white' | 'gray' (default: 'default')
- `padding`: 'none' | 'sm' | 'md' | 'lg' (default: 'md')
- `className`: Additional CSS classes

**Example:**
```tsx
<PageContainer maxWidth="7xl" background="gradient" padding="md">
  {/* Page content */}
</PageContainer>
```

### ResponsiveCard

Card component with responsive padding, shadows, and hover effects.

**Props:**
- `padding`: 'sm' | 'md' | 'lg' (default: 'md')
- `shadow`: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' (default: 'lg')
- `rounded`: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' (default: '2xl')
- `border`: boolean (default: true)
- `hover`: boolean - enables hover effects (default: false)
- `onClick`: function - makes card clickable
- `className`: Additional CSS classes

**Example:**
```tsx
<ResponsiveCard padding="lg" shadow="xl" hover onClick={handleClick}>
  <h3>Card Title</h3>
  <p>Card content</p>
</ResponsiveCard>
```

### ResponsiveGrid

Responsive grid layout that adapts columns based on screen size.

**Props:**
- `cols`: Object with `mobile`, `tablet`, `desktop` numbers (default: { mobile: 1, tablet: 2, desktop: 3 })
- `gap`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `className`: Additional CSS classes

**Example:**
```tsx
<ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap="lg">
  {items.map(item => (
    <ResponsiveCard key={item.id}>
      {item.content}
    </ResponsiveCard>
  ))}
</ResponsiveGrid>
```

### ResponsiveText

Responsive text component with automatic scaling.

**Props:**
- `variant`: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'caption' (default: 'body')
- `color`: 'default' | 'primary' | 'secondary' | 'muted' | 'white' (default: 'default')
- `weight`: 'normal' | 'medium' | 'semibold' | 'bold' (default: 'normal')
- `align`: 'left' | 'center' | 'right' (default: 'left')
- `breakWords`: boolean (default: true)
- `className`: Additional CSS classes

**Example:**
```tsx
<ResponsiveText variant="h1" color="primary" weight="bold" align="center">
  Page Title
</ResponsiveText>
```

## Best Practices

1. **Always use PageContainer** as the root wrapper for new pages
2. **Use ResponsiveText** for all text elements to ensure proper scaling
3. **Use ResponsiveGrid** for any grid layouts
4. **Use ResponsiveCard** for card-based layouts
5. **Test on mobile, tablet, and desktop** before submitting

## See Also

- `/docs/RESPONSIVE_DESIGN_GUIDELINES.md` - Complete design guidelines
- `/docs/CREATING_NEW_PAGES.md` - Step-by-step guide for new pages
- `/templates/user-page-template.tsx` - Complete page template

