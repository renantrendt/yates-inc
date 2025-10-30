# Yates Inc. Deployment Checklist

## Before Running the App

### 1. ✅ Install Dependencies
```bash
npm install
```

### 2. ✅ Set Up Supabase
- [ ] Create a Supabase account at https://supabase.com
- [ ] Create a new project
- [ ] Run the SQL from `SUPABASE_SETUP.md` in your SQL editor
- [ ] Copy your project URL and anon key
- [ ] Create `.env.local` file (use `.env.local.example` as template)
- [ ] Add your Supabase credentials to `.env.local`

### 3. ✅ Add Product Images
- [x] Glass Table image → `/public/unnamed.jpg`
- [x] Watering Can image → `/public/wateringcan.png`
- [x] Silverware image → `/public/silverware.jpg`
- [x] Rolling Pin image → `/public/rp.png`
- [x] Custom Key image → `/public/ck.png`
- [x] Fancy Flippers image → `/public/flipper.jpg`
- [x] Toilet Warmer image → `/public/taw.jpg`
- [x] Toilet Paper image → `/public/tp.jpg`
- [x] Very Safe Door image → `/public/door.png`
- [ ] CPS placeholder → `/public/cps-placeholder.png` (Replace with actual photoshop samples)

### 4. ✅ Update Homepage Description
Replace "XXX" placeholder text in `/app/page.tsx` with your actual company description.

### 5. ✅ Test the Application
```bash
npm run dev
```

#### Test Checklist:
- [ ] Homepage loads correctly
- [ ] All navigation links work
- [ ] Products page displays all items
- [ ] Product hover tooltips show pricing details
- [ ] "Add to Cart" works for all products (except CPS)
- [ ] Cart badge updates when adding items
- [ ] Cart sidebar opens and shows items
- [ ] Quantity selector works (1-5 range)
- [ ] Delete button removes items from cart
- [ ] Payment modal opens and goes through all 5 steps
- [ ] TOS link works in payment modal
- [ ] Delivery time calculation is correct
- [ ] Cart clears after successful payment
- [ ] Contact page displays correctly
- [ ] Employees page shows all 4 team members
- [ ] Clicking "Mr. MMMM" on products page goes to Michael's section
- [ ] Employee login works with all 4 credentials
- [ ] WTBD section appears after login
- [ ] Tasks display correctly
- [ ] Assigned employee can increase progress
- [ ] CEO can add new tasks
- [ ] CEO can delete tasks
- [ ] CEO can change due dates
- [ ] TOS page displays full terms

## Production Deployment

### Option 1: Vercel (Recommended for Next.js)
```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Option 2: Other Platforms
Make sure to:
1. Build the project: `npm run build`
2. Set environment variables
3. Deploy the `.next` folder

## Post-Deployment

- [ ] Test all features in production
- [ ] Verify Supabase connection works
- [ ] Check that all images load
- [ ] Test on mobile devices
- [ ] Test employee login in production
- [ ] Verify cart persistence works

## Troubleshooting

### Issue: Supabase connection error
- Check that `.env.local` exists and has correct values
- Verify Supabase project is active
- Check that tables were created successfully

### Issue: Images not loading
- Verify all images are in `/public` folder
- Check file names match exactly (case-sensitive)
- Clear browser cache

### Issue: Cart not persisting
- Check browser localStorage is enabled
- Try in incognito/private mode to rule out extensions

### Issue: Employee login not working
- Verify employees table in Supabase has correct data
- Check passwords match exactly (case-sensitive)
- Look at browser console for error messages

## Notes

- The app uses client-side state management (no server-side sessions)
- Cart data is stored in localStorage
- Employee sessions persist across refreshes
- All employee passwords are stored in plain text (this is just a demo/satirical site)
- No real payment processing - it's all UI/UX simulation

## Support

For issues or questions, refer to:
- `README.md` for project overview
- `TECHNICAL_SPEC.md` in parent directory for full specifications
- `SUPABASE_SETUP.md` for database setup

---

**Remember**: This is a satirical project. Have fun with it! 🎭




