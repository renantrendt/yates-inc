# Yates Inc. - Satirical E-Commerce Website

A Next.js website for Yates Inc., a fictional company selling absurd products with ridiculous pricing models.

## Features

- 🛍️ **Product Catalog**: Browse 9 unique products with "innovative" pricing
- 🛒 **Shopping Cart**: Full cart functionality with quantity management (1-5 per item)
- 💳 **Payment Flow**: Complete checkout experience (UI/UX only, no real payments)
- 👥 **Employee Portal**: Role-based task management system
- 📊 **Task Management**: Progress tracking with CEO having special permissions
- 🎭 **Satirical Elements**: Absurd product descriptions and Terms of Service

## Tech Stack

- **Frontend**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Context API
- **Authentication**: Custom auth with Supabase table lookup

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account

### Installation

1. Clone the repository:
```bash
cd yates-website
npm install
```

2. Set up Supabase:
   - Follow instructions in `SUPABASE_SETUP.md`
   - Create `.env.local` with your Supabase credentials

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
yates-website/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Homepage (+ WTBD for logged-in employees)
│   ├── products/          # Products page
│   ├── contact/           # Contact page
│   ├── employees/         # Employee bios page
│   ├── el/                # Employee login
│   └── tos/               # Terms of Service
├── components/            # React components
│   ├── Navbar.tsx
│   ├── CartSidebar.tsx
│   └── ProductCard.tsx
├── contexts/              # React Context providers
│   ├── CartContext.tsx
│   └── AuthContext.tsx
├── lib/                   # Libraries
│   └── supabase.ts
├── types/                 # TypeScript types
│   └── index.ts
├── utils/                 # Utility functions
│   └── products.ts
└── public/                # Static assets (product images)
```

## Employee Credentials

| Name | ID | Password | Role |
|------|-----|----------|------|
| Logan Wall Fencer | 000001 | CEOBOSS | CEO |
| Michael | 39187 | MMMS | CPS/HR |
| Bernardo | 392318 | BSS*1213 | CTO/CFO/LW/SCM |
| Dylan | 007411 | T@llahM2N | PSM |

## Features Breakdown

### Public Pages
- **Homepage**: Hero section with company info
- **Products**: Grid of 9 products with hover tooltips
- **Contact**: Company contact information
- **Employees**: Team member bios with anchor linking
- **TOS**: Full satirical Terms of Service

### Shopping Experience
- Add products to cart (except CPS which requires custom pricing)
- Adjust quantities (1-5 per item)
- Cart badge counter
- Sliding cart sidebar
- Complete payment flow with fake card form

### Employee Portal
- Login system with validation
- WTBD (What To Be Done) task dashboard
- Progress tracking with role-based permissions:
  - **All Employees**: Can increase their assigned task progress
  - **CEO**: Can add/delete tasks and change due dates
  - **Bernardo**: Can add tasks via Supabase console

## Delivery Time Calculation

```javascript
days = 1 + (numProducts - 1) * 2
// If days > 30, show "1 Month"
```

## Notes

- Cart persists in localStorage
- Employee sessions persist across page refreshes
- No logout functionality (by design)
- Product images are stored in `/public` folder
- All pricing is satirical and not meant to be taken seriously

## Contributing

This is a satirical project. Have fun with it! 🎭

## License

MIT - Do whatever you want with this absurdity.
