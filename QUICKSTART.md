# 🚀 Yates Inc. - Quick Start Guide

## Get Running in 5 Minutes

### Step 1: Install Dependencies (30 seconds)
```bash
cd yates-website
npm install
```

### Step 2: Set Up Supabase (2 minutes)

1. **Create Supabase Project**
   - Go to https://supabase.com and sign up/login
   - Click "New Project"
   - Give it a name and password

2. **Run the SQL**
   - Go to SQL Editor in Supabase dashboard
   - Copy/paste the SQL from `SUPABASE_SETUP.md`
   - Click "Run"

3. **Get Your Keys**
   - Go to Project Settings → API
   - Copy the "Project URL" and "anon public" key

4. **Create Environment File**
   ```bash
   # Create .env.local in the yates-website folder
   touch .env.local
   ```
   
   Add this content (replace with your actual values):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### Step 3: Run the App (10 seconds)
```bash
npm run dev
```

Open http://localhost:3000 in your browser 🎉

## Quick Test

1. **Browse Products** → Go to Products page
2. **Add to Cart** → Click "Add to Cart" on any product
3. **View Cart** → Click "Shop" button in navbar
4. **Test Checkout** → Click "PAY" and go through the flow
5. **Employee Login** → Click "EL" and use:
   - ID: `000001`
   - Password: `CEOBOSS`
6. **See WTBD** → You'll now see the task management section on homepage

## What's Built

✅ Full shopping cart with quantity management  
✅ Complete payment flow (5 steps)  
✅ Employee login system  
✅ Task management with role-based permissions  
✅ All pages: Home, Products, Contact, Employees, Login, TOS  
✅ Responsive design with Tailwind CSS  
✅ Persistent cart and sessions (localStorage)  

## Employee Logins

| Name | ID | Password |
|------|-----|----------|
| Logan (CEO) | 000001 | CEOBOSS |
| Michael | 39187 | MMMS |
| Bernardo | 392318 | BSS*1213 |
| Dylan | 007411 | T@llahM2N |

## Common Issues

**"Supabase connection error"**
→ Check your `.env.local` file exists and has correct values

**"Images not loading"**
→ All images are already copied to `/public` folder, should work out of the box

**"Can't login"**
→ Make sure you ran the SQL to create the employees table

## Next Steps

- Replace "XXX" placeholder text on homepage with your company description
- Replace `/public/cps-placeholder.png` with actual Photoshop sample images
- Deploy to Vercel (see `DEPLOYMENT_CHECKLIST.md`)

## Need More Help?

- Full details: `README.md`
- Database setup: `SUPABASE_SETUP.md`
- Deployment: `DEPLOYMENT_CHECKLIST.md`
- Technical spec: `../TECHNICAL_SPEC.md`

---

**Have fun with this ridiculous project! 😄**














