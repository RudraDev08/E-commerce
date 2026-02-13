# 🎨 Modern Tech Startup "About Us" Design Spec (2026 Trend)

## 1️⃣ Brand & Color System

A sophisticated, high-contrast palette designed for a premium tech aesthetic. It uses a deep violet foundation with vibrant neon accents to convey innovation and energy.

| Role | Color Name | HEX Code | CSS Variable | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Primary** | **Electric Violet** | `#7C3AED` | `--primary-500` | CTAs, Primary Buttons, Active States |
| **Primary Dark** | **Deep Abyss** | `#4C1D95` | `--primary-900` | Footer Background, Hero Overlay |
| **Secondary** | **Cyber Cyan** | `#06B6D4` | `--cyan-500` | Gradients, Success States, Tech Accents |
| **Accent** | **Neon Pink** | `#F43F5E` | `--rose-500` | Notification dots, "Hot" badges, Micro-interactions |
| **Bg Light** | **Clean Slate** | `#F8FAFC` | `--slate-50` | Page Background, Section Alternates |
| **Bg Dark** | **Void** | `#0F172A` | `--slate-900` | Dark Mode Background, Cards in Dark Sections |
| **Text Primary** | **Night** | `#1E293B` | `--slate-800` | Headings, Main Copy |
| **Text Secondary** | **Steel** | `#64748B` | `--slate-500` | Subtitles, Meta text |
| **Border** | **Mist** | `#E2E8F0` | `--slate-200` | Card borders, Dividers |

---

## 2️⃣ Full Page Layout Structure

### 1. Hero Section
*   **Layout:** Split Screen (Text Left / 3D Abstract Visual Right).
*   **Background:** linear-gradient(135deg, `#F8FAFC` 0%, `#F1F5F9` 100%).
*   **Height:** `85vh` (min-height: 600px).
*   **Typography:**
    *   H1: `4.5rem`, Weight 800, Tight Tracking (`-0.03em`).
    *   Sub: `1.25rem`, Weight 400, Color `#64748B`.
*   **Interaction:** Mouse-move parallax effect on the right-side visual.

### 2. Company Story (The Timeline)
*   **Layout:** Central Line Zig-Zag (Snake layout).
*   **Background:** `#FFFFFF`.
*   **Spacing:** `padding: 120px 0`.
*   **Card Style:** Minimalist, no border, heavy shadow on hover.
*   **Typography:** H2: `3rem` centered.

### 3. Mission & Vision
*   **Layout:** 2-Card Grid (Glassmorphism).
*   **Background:** Floating blurred orbs in background.
*   **Cards:** 
    *   Bg: `rgba(255, 255, 255, 0.7)`.
    *   Blur: `backdrop-filter: blur(20px)`.
    *   Border: `1px solid rgba(255, 255, 255, 0.5)`.

### 4. Core Values
*   **Layout:** 3 or 4 Column Grid.
*   **Icons:** Animated Lottie JSON or Stroke SVGs (`#7C3AED`).
*   **Hover:** Icon scales up, background tint appears.

### 5. Meet the Team
*   **Layout:** Horizontal Scroll Snap (Mobile) / Grid (Desktop).
*   **Profile:**
    *   Image: Rounded Square (`24px` radius).
    *   Overlay: Gradient slide-up on hover with LinkedIn/Twitter icons.
    *   Name: H4 (`1.5rem`).

### 6. Achievements / Stats
*   **Layout:** Full-width strip.
*   **Background:** `#0F172A` (Dark).
*   **Content:** White Text.
*   **Counter:** Animated numbers (Start from 0 -> Final).

### 7. Call To Action
*   **Layout:** Centered Floating Card.
*   **Style:** Gradient Background (`#7C3AED` → `#06B6D4`).
*   **Button:** White Pill (`#FFFFFF`) with Gradient Text.

### 8. Footer
*   **Style:** Minimal 4-column.
*   **Background:** `#F8FAFC`.

---

## 3️⃣ Typography System

**Font Pairing:** `Inter` (UI/Body) + `Outfit` (Headings/Display).

| Type Role | Font Family | Size (Desktop) | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- |
| **Display H1** | **Outfit** | `72px` (4.5rem) | `1.1` | `-0.03em` |
| **Heading H2** | **Outfit** | `48px` (3rem) | `1.2` | `-0.02em` |
| **Heading H3** | **Outfit** | `32px` (2rem) | `1.3` | `-0.01em` |
| **Body Large** | **Inter** | `18px` (1.125rem)| `1.6` | `0` |
| **Body Base** | **Inter** | `16px` (1rem) | `1.6` | `0` |
| **Button Text**| **Inter** | `15px` | `1` | `0.02em` |

---

## 4️⃣ UI Components Design Guide

### Buttons
*   **Primary:**
    *   Bg: `#7C3AED`.
    *   Text: `#FFFFFF`.
    *   Radius: `12px` (Modern Soft Rect).
    *   Padding: `14px 28px`.
    *   Shadow: `0 4px 14px 0 rgba(124, 58, 237, 0.4)`.
    *   Hover: `translateY(-2px)`, Shadow widens.
*   **Secondary:**
    *   Bg: `Transparent`.
    *   Border: `2px solid #E2E8F0`.
    *   Text: `#1E293B`.
    *   Hover: Bg `#F8FAFC`, Border `#CBD5E1`.

### Cards (General)
*   **Bg:** `#FFFFFF`.
*   **Radius:** `24px` (Large/Premium).
*   **Shadow (Rest):** `0 2px 10px rgba(0,0,0,0.03)`.
*   **Shadow (Hover):** `0 20px 40px rgba(0,0,0,0.08)`.
*   **Transition:** `all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)`.

### Statistic Counters
*   **Font:** `Outfit`, Weight 700.
*   **Size:** `64px`.
*   **Color:** Gradient Text (`linear-gradient(to right, #7C3AED, #06B6D4)`).

---

## 5️⃣ Micro-Interactions & Animations

1.  **Scroll Reveal:** 
    *   Elements fade in + slide up (`30px`) as they enter viewport.
    *   Delay children elements (staggered animation).
2.  **Magnetic Buttons:**
    *   Buttons subtly stick to the cursor when hovering near them.
3.  **Hover Lift:**
    *   Cards lift `8px` on hover.
4.  **Parallax:**
    *   Background globs/shapes move slower than foreground text.
5.  **Smooth Scroll:**
    *   `html { scroll-behavior: smooth; }`.

---

## 6️⃣ Mobile Responsive Notes

### Layout Stacking
*   **Hero:** Visual moves **below** text. Text aligns center.
*   **Grid sections:** Convert from 4-col → 2-col (Tablet) → 1-col (Mobile).
*   **Order:** Ensure visual hierarchy (e.g., Image first for Team, Text first for Values).

### Adjustments
*   **H1:** Scale down to `40px` (2.5rem).
*   **Padding:** Reduce Section padding from `120px` to `64px`.
*   **Buttons:** `width: 100%` on mobile for easier tapping.
*   **Navigation:** Hamburger menu trigger (already implemented).

---

*Verified for Zepto-Inspired (ShopHub) Consistency while pushing for 2026 Tech Startup Trends.*
