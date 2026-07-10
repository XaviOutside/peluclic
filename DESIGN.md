---
name: Canine Concierge
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf1'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fa'
  on-surface: '#111c2c'
  on-surface-variant: '#3f484a'
  inverse-surface: '#263142'
  inverse-on-surface: '#ebf1ff'
  outline: '#6f797b'
  outline-variant: '#bfc8cb'
  surface-tint: '#1a6774'
  primary: '#005460'
  on-primary: '#ffffff'
  primary-container: '#226d7a'
  on-primary-container: '#a8ecfb'
  inverse-primary: '#8dd1e0'
  secondary: '#36656d'
  on-secondary: '#ffffff'
  secondary-container: '#b8e8f1'
  on-secondary-container: '#3b6a71'
  tertiary: '#6e4212'
  on-tertiary: '#ffffff'
  tertiary-container: '#8a5928'
  on-tertiary-container: '#ffdbbd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a9edfc'
  primary-fixed-dim: '#8dd1e0'
  on-primary-fixed: '#001f25'
  on-primary-fixed-variant: '#004e5a'
  secondary-fixed: '#bbebf4'
  secondary-fixed-dim: '#9fcfd7'
  on-secondary-fixed: '#001f24'
  on-secondary-fixed-variant: '#1c4d55'
  tertiary-fixed: '#ffdcc0'
  tertiary-fixed-dim: '#f9ba80'
  on-tertiary-fixed: '#2d1600'
  on-tertiary-fixed-variant: '#683c0d'
  background: '#f9f9ff'
  on-background: '#111c2c'
  surface-variant: '#d8e3fa'
  surface-cream: '#F9FCFD'
  status-success: '#4CAF50'
  status-warning: '#FFB300'
  status-error: '#E53935'
typography:
  headline-xl:
    fontFamily: Open Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Open Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Open Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Open Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Open Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Open Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system is built for a professional dog grooming management platform that balances operational efficiency with a warm, welcoming atmosphere. The brand personality is "The Trusted Expert"—someone who is highly organized and technically proficient but deeply cares about animal welfare.

The aesthetic follows a **Modern Corporate** style with a **Tactile** twist. It utilizes the spaciousness and clarity of a SaaS platform but incorporates soft, rounded elements and warm tones from the reference site to avoid feeling clinical. The target audience includes busy salon owners and groomers who require a tool that feels like an extension of their caring environment rather than just a cold database.

## Colors
The color palette is anchored by a deep teal-cyan (`#226D7A`), which provides the necessary professional weight and legibility for a management tool. This is complemented by a soft sky blue (`#B0E0E9`) used for secondary actions and high-surface area backgrounds to maintain a "friendly" and "clean" feel.

White is the primary canvas, but a "surface-cream" (`#F9FCFD`) is introduced for card backgrounds to reduce eye strain during long working hours. Functional colors for booking statuses (Confirmed, Pending, Cancelled) should remain vibrant but secondary to the brand teal.

## Typography
The typography leverages **Open Sans** for its humanist qualities—it feels approachable yet remains highly legible in data-heavy management interfaces. Headings are bold and weighted to provide a clear hierarchy in scheduling views. 

**Inter** is introduced for labels, navigation items, and data tables. Its systematic, utilitarian nature ensures that dense information (like client lists or inventory counts) remains easy to scan. All labels should be crisp, with small labels utilizing slightly increased letter spacing for maximum clarity.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a maximum container width of 1440px. The design utilizes an 8px base unit for all spacing increments to ensure a consistent rhythm.

- **Desktop:** 12-column grid. Left-hand sidebar navigation (fixed) for quick access to Calendar, Clients, and Settings.
- **Mobile:** Single-column layout. Bottom navigation bar for core tasks (Home, New Appointment, Search).
- **White Space:** Generous padding is applied to card containers (minimum 24px) to emphasize the "clean" and "modern" aesthetic, preventing the software from feeling cluttered like traditional legacy systems.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Ambient Shadows**. 

The main application background uses a very light tint of the primary color. Interactive elements like "Appointment Cards" sit on a white surface with a soft, diffused shadow (12% opacity of the brand teal) to indicate they can be clicked or dragged. 

Modals and overlays utilize a stronger shadow and a subtle backdrop blur (glassmorphism) to keep the user focused on the task at hand while maintaining context of the dashboard behind it.

## Shapes
A "Rounded" shape language is used throughout the design system to evoke friendliness and safety—key emotional drivers for pet owners and groomers.

Primary buttons and input fields feature a 0.5rem (8px) corner radius. Elements that feel more "organic" or "human," such as pet profiles or status badges, may use even higher roundedness (up to pill-shaped) to distinguish them from structural layout containers.

## Components
- **Buttons:** The primary button uses the brand teal (`#226D7A`) with white text. Secondary buttons use the sky blue (`#B0E0E9`) with teal text. Buttons should have a subtle hover transition that deepens the saturation.
- **Cards:** Appointment cards feature a colored left-border strip that indicates the groomer or the service type.
- **Input Fields:** Use a light grey border (`#E2E8F0`) that turns to the brand teal on focus. Labels sit above the field in **Inter** for readability.
- **Chips/Badges:** Used for pet breeds and service tags. These should have a background color that is 10% opacity of the service category color.
- **Calendar:** The central component of the software. It should use a clean, white background with subtle grey lines, allowing the teal appointment blocks to "pop" visually.
- **Lists:** Client lists should feature small circular avatars (pet photos) to reinforce the friendly, pet-centric nature of the product.