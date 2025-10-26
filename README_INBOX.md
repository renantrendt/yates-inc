# 🚨 INBOX NOT WORKING? READ THIS! 🚨

## If messages aren't sending, you probably forgot to run the SQL setup!

### Step 1: Go to Supabase
Open your Supabase project at https://supabase.com

### Step 2: Open SQL Editor
Click "SQL Editor" in the left sidebar

### Step 3: Run the Complete SQL Script
Copy and paste the ENTIRE contents of this file:
```
INBOX_COMPLETE_SQL.sql
```

Hit **RUN** to execute it.

### Step 4: Restart Your Dev Server
```bash
# Kill the current server
# Then restart:
cd yates-website
npm run dev
```

### Step 5: Hard Refresh Your Browser
- Press **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)
- Or open DevTools (F12) and click "Empty Cache and Hard Reload"

---

## What Got Fixed in Latest Update

✅ **Modern UI** - No more ugly checkboxes! Now using pills and cards  
✅ **Black Screen Fixed** - Backdrop only shows when needed  
✅ **Better Errors** - Console logs will tell you exactly what's wrong  
✅ **Sent Filter** - Now properly shows sent messages  

---

## New Compose UI

When you click **"✉️ New"**, you'll see:
- **Card selection** - Click employee cards to select recipients
- **Pills at top** - Selected recipients show as blue pills (click X to remove)
- **Modern design** - No more 2010 checkbox bullshit 😎

---

## If It's STILL Not Working

1. Open browser console (F12)
2. Try to send a message
3. Look for red error messages
4. Send screenshot of the error to debug

The error will tell you exactly what table is missing!

