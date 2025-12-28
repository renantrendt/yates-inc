# YATES INC - TECHNICAL SPECIFICATION & AI UNDERSTANDING

## PROJECT OVERVIEW
Building a satirical e-commerce website for Yates Inc. - a fake company selling absurd products with ridiculous pricing models. The site has employee login functionality with task management via Supabase.

---

## 🏗️ SITE STRUCTURE

### **MAIN PAGE (Homepage) - URL: `/`**
**Purpose:** Company landing page with navigation

**Components:**
- Hero section with company description (placeholder text "XXX" - user will replace later)
- Top-right navigation bar with buttons:
  - Products
  - Contact
  - Employees
  - EL (Employee Login)
  - Shop

**Dynamic Behavior:**
- IF user is logged in as employee → Show additional "WTBD" (What To Be Done) section on homepage
- ELSE → Standard homepage only

---

## 📦 PRODUCTS PAGE - URL: `/products`

### **Product #1: Customizable Photoshops (CPS)**
- **Special Tag:** "NEW" badge/label
- **Price:** Custom (user negotiates with Michael)
- **Description:** Made by professional editor Mr. MMMM
- **Special Feature:** "Mr. MMMM" text is BLUE and CLICKABLE → links to `/employees#MMMM` (anchor to Michael's section)
- **NO "Add to Cart" button** (only product without it)
- **Images:** User will provide Photoshop sample images later

### **Products #2-9: Physical Products**
All have identical structure:

```
Product Card Layout:
- Product Image
- Product Name
- Price (main display)
- "Add to Cart" button
- Hover tooltip on price (small letters, appears briefly on hover)
```

#### Product List:
1. **Glass Table**
   - Price: `$50.13`
   - Hover text: "requires assembly"
   - Image: unnamed.jpg

2. **Watering Can**
   - Price: `$15.10`
   - Hover text: "per pound you weigh"
   - Image: wateringcan.png

3. **Silverware**
   - Price: `$30.23`
   - Hover text: "per meal you ever eaten"
   - Image: silverware.jpg

4. **Rolling Pin**
   - Price: `$43.76`
   - Hover text: "per time you have baked something"
   - Image: rp.png

5. **Custom Key**
   - Price: `$27.97`
   - Hover text: "per time you use a key"
   - Image: ck.png

6. **Fancy Flippers**
   - Price: `$41.99`
   - Hover text: "per time you touch or drink water"
   - Image: flipper.jpg

7. **Toilet アトマティックシートウォーマー**
   - Price: `$399.99`
   - Hover text: "per time you go to the bathroom"
   - Image: taw.jpg

8. **Touilotu Papu**
   - Price: `$12.89`
   - Hover text: "per inch of paper you use from the time you buyed this"
   - Image: tp.jpg

9. **Very Safe Door**
   - Price: `$89.99`
   - Hover text: "per time you use a door"
   - Image: door.png

---

## 🛒 SHOPPING CART SYSTEM

### **Cart Badge Counter**
- Location: On top of Shop icon in navbar
- Shows: Number of items in cart (e.g., "3")
- Updates: Immediately when "Add to Cart" is clicked

### **Cart Sidebar - Triggered by clicking Shop button**
**Layout:**
- Position: Absolute right side of screen
- Height: Covers 1/4 inch vertically (quarter of screen height)
- Slides in from right

**Cart Item Display:**
```
Each cart item shows:
- Product name
- Unit price
- Quantity selector (1-5)
- Delete button (trash icon)
```

**Quantity Selector Logic:**
- Starts at 1
- Range: 1-5 units max
- Click on quantity number → Opens dropdown/input to change amount

**Delete Button:**
- Removes item from cart entirely
- Updates cart counter badge

**Subtotal Display:**
- Shows: "Total: $XXX.XX"
- Dynamically updates when quantities change

**Checkout Button:**
- Text: "PAY"
- Action: Opens payment modal closes side bar, and goes to Payment flow

---

## 💳 PAYMENT FLOW

### **Step 1: Initial Cart View (Screenshot 1)**
Shows shop items list with:
- Item quantities
- Item names
- Individual prices
- Total at bottom
- "Pay:" prompt

### **Step 2: Payment Method Selection (Screenshot 2)**
**Payment methods listed (left side):**
- Pix
- PayPal
- Apple pay
- Google pay
- Venmo
- Wells Fargo
- Chase

**Important UI Element (Screenshot 2 shows this):**
```
BOLD + RED TEXT BOX:
"IMPORTANT TEXT:
DO NOT PUT AN ACTUAL NUMBER FROM AN
EXISTING CARD!!!!"
```

**Card Information Form (appears when payment method clicked):**
```

Input Fields:
1. Card number (16 digits on the front)
2. Expiration date (month/year)
3. CVV/CVC (3 or 4-digit security code on back)
4. Name on the card
```

### **Step 3: Terms of Service Checkbox**
**MUST appear before allowing payment:**
```
☐ Please click in the check box, to agree to our Terms of Service
```
- "Terms of Service" is BLUE and CLICKABLE
- Links to: `/tos` (TOS file content)
- Payment button disabled until checked

### **Step 4: Payment Processing (Screenshot 3)**
**Action:** User enters all card details and clicks PAY

**Visual Effect:**
- Navigate to: `/shop` (or stay on same page)
- ALL form fields and cart items DISAPPEAR
- Screen clears

### **Step 5: Success Message (Screenshot 3)**
**Display in center of screen:**
```
Thanks you order will be delivered in XX
```

**"Go back home" button** appears

**Delivery Time Calculation (XX value):**
```javascript
// Formula:
let numProducts = totalProductsInCart;
let days = 1 + (numProducts - 1) * 2;

// Examples:
// 1 product = 1 day
// 2 products = 1 + (2-1)*2 = 3 days
// 3 products = 1 + (3-1)*2 = 5 days
// 5 products = 1 + (5-1)*2 = 9 days

if (days > 30) {
  return "1 Month";
} else {
  return `${days} days`;
}
```

---

## 📞 CONTACT PAGE - URL: `/contact`

**Content:**
```
You are able to contact us by either:
- Being at our HQ at MMS
- OR by some way shape or form, getting our contact

If you do, we'll have a pleasure on getting your money back 
or simply talking to ya.
```

Simple text page, no forms needed.

---

## 👥 EMPLOYEES PAGE - URL: `/employees`

### **Employee #1: Logan Wall Fencer**
- **Role:** CEO
- **Bio:** "Logan, is the CEO and founder of Yates Inc. He has spend a lot of time and effort, making this the greatest company he could every think of."
- **ID:** 000001

### **Employee #2: Mr. Michael Mackenzy McKale Mackelayne**
- **Role:** CPS/HR (Custom Photoshop / Human Resources)
- **Bio:** "Michael, is who does everything of our designs, and how things will work, he also is our Human Rights manager. Michael also is one of our 2 first hires, together with Bernardo. Michael is very hard working and is able to accomplish multiple Ps, a day, he one made 60% of our daily revenue, doing 21 Ps, and 2 30minute long videos to 5M+ subs channels."
- **ID:** 39187
- **Anchor ID:** `#MMMM` (for linking from CPS product)

### **Employee #3: Bernardo**
- **Role:** CTO/CFO/LW (Chief Technology Officer, Chief Financial Officer, Lawyer)
- **Bio:** "Bernardo works in three areas, the first thing is he is our Chief Technology Officer and makes everything computer related. His second area, is Chief Financial Officer and he works with all the money that comes in-n-out. and the last thing, is he's our company's Lawyer. He handles partnerships and calls with other companies to get resources or make deals"
- **ID:** 392318

### **Employee #4: Dylan Mad Hawk**
- **Role:** PSM (Product/Supply Manager)
- **Bio:** "Dylan is our latest hire, but he is very hard working, he handles everything of managing the resources and putting them into our products, with the requirements made from the other companies/MMM's design."
- **ID:** 007411

### **Employee #5: Herris**
- **Role:** SCM (Supply Chain Manager)
- **Bio:** "Herris is our newest hire and Supply Chain Manager. While he has some basic coding skills, his real strength is managing the supply chain and logistics. He handles all our partnerships, vendor relationships, and ensures resources flow smoothly to keep operations running."
- **ID:** 674121

---

## 🔐 EMPLOYEE LOGIN (EL) - URL: `/el`

### **Login Form:**
```
Log-in:

[Employee ID input]
  Placeholder: "Employee ID" (gray text, disappears on click/focus)

[Password input]
  Placeholder: "Password" (gray text, disappears on click/focus)

[Login Button]
```

### **Valid Credentials (ONLY these work):**
```
ID: 39187       | Password: MMMS           | Employee: Michael
ID: 392318      | Password: BSS*1213       | Employee: Bernardo
ID: 000001      | Password: CEOBOSS        | Employee: Logan (CEO)
ID: 007411      | Password: T@llahM2N      | Employee: Dylan
ID: 674121      | Password: TUFboss        | Employee: Herris
```

### **Error Handling:**
If incorrect credentials:
```
Error message:
"I'm sorry you typed (id or password) wrong, please try again, 
or check if you are in the wrong space."

// Note: Should identify if ID or password was wrong
```

### **On Successful Login:**
1. Store employee session
2. Redirect to homepage
3. Homepage now displays "WTBD" section

---

## ✅ WTBD (What To Be Done) - Employee Dashboard

**Location:** Appears on homepage ONLY when logged in as employee

**Purpose:** Task management system for employees

### **Task Card Display:**
Each task shows:
- Task name/description
- Assigned employee name
- Progress bar (0% - 100%)
- Due date

### **Task Interaction Rules:**

#### **As Assigned Employee:**
- Can INCREASE progress % (click to edit)
- CANNOT decrease % (one-way only, progress only goes up)
- Cannot change due date
- Cannot delete task
- Cannot reassign task

#### **As CEO (Logan - ID: 000001):**
- Can DELETE any task
- Can CHANGE due date on any task
- Can do everything regular employees can do

#### **As Bernardo (ID: 392318):**
- Can ADD new tasks via Supabase directly (not through UI)
- Can do everything regular employees can do

#### **As CEO:**
- Can ADD new tasks directly through WTBD interface
- Has "Add Task" button visible

---

## 🗄️ SUPABASE DATABASE STRUCTURE

### **Employees Table:**
```javascript
Table: employees
Columns:
- id (primary key, matches employee ID)
- name (text)
- password (text) // In production should be hashed
- role (text)
```

Data:
```
| id      | name                                     | password      | role        |
|---------|------------------------------------------|---------------|-------------|
| 000001  | Logan Wall Fencer                        | CEOBOSS       | CEO         |
| 39187   | Mr. Michael Mackenzy McKale Mackelayne  | MMMS          | CPS/HR      |
| 392318  | Bernardo                                 | BSS*1213      | CTO/CFO/LW  |
| 007411  | Dylan Mad Hawk                           | T@llahM2N     | PSM         |
| 674121  | Herris                                   | TUFboss       | SCM         |
```

### **Tasks Table:**
```javascript
Table: tasks
Columns:
- id (primary key, uuid)
- task_name (text)
- description (text, optional)
- assigned_to_id (foreign key → employees.id)
- assigned_to_name (text, for display)
- progress_percentage (integer, 0-100)
- due_date (date)
- created_by_id (foreign key → employees.id)
- created_at (timestamp)
```

### **Database Rules:**
- ALL employees can READ all tasks
- ONLY assigned employee can UPDATE progress_percentage (and only increase it)
- ONLY CEO can DELETE tasks
- ONLY CEO can UPDATE due_date
- ONLY CEO and Bernardo can CREATE tasks (Bernardo via Supabase console)

---

## 📄 TERMS OF SERVICE (TOS) - URL: `/tos`

Display the full TOS file content (already provided in TOS file).

**Key sections:**
1. Fee Calculation & Quasi-Quantum Accounting
2. Microprint Acknowledgment
3. Absurdity Clause
4. Telemetry & Meta-Analytics
5. Enforcement & Cosmic Recourse
6. Final Acknowledgment

Full satirical legal document about the absurd pricing models.

---

## 🎨 UI/UX NOTES

### **General Styling:**
- Modern, clean design
- Professional but with subtle satirical elements
- Responsive (mobile-friendly)

### **Key Interactive Elements:**
1. Hover tooltips on product prices (brief appearance)
2. Cart counter badge (dynamic updates)
3. Sliding cart sidebar
4. Clickable employee links
5. Progress bars (interactive for assigned employees)

### **Color Coding:**
- Blue links: "Mr. MMMM" text, "Terms of Service" link
- Red + Bold: Important warning text in payment form
- NEW tag: Highlight color on CPS product

---

## 🔧 TECHNICAL IMPLEMENTATION CHECKLIST

### **Frontend:**
- [ ] React/Next.js app structure
- [ ] Navigation component (Products, Contact, Employees, EL, Shop buttons)
- [ ] Product cards with hover tooltips
- [ ] Shopping cart state management
- [ ] Cart sidebar with quantity selectors
- [ ] Payment modal with form validation
- [ ] TOS checkbox requirement
- [ ] Employee login form
- [ ] WTBD task management interface
- [ ] Role-based UI rendering (CEO sees extra buttons)
- [ ] Delivery time calculator

### **Backend/Database:**
- [ ] Supabase project setup
- [ ] Employees table with auth data
- [ ] Tasks table with relationships
- [ ] Row Level Security (RLS) policies:
  - Everyone can read tasks
  - Only assigned employee can update their task progress
  - Only CEO can delete tasks
  - Only CEO can update due dates
  - Only CEO can create tasks via UI
- [ ] Session management for logged-in employees

### **Routes:**
- [ ] `/` - Homepage (+ WTBD if logged in)
- [ ] `/products` - Products listing
- [ ] `/contact` - Contact info
- [ ] `/employees` - Employee bios (with #MMMM anchor)
- [ ] `/el` - Employee login
- [ ] `/tos` - Terms of Service
- [ ] `/shop` - Payment success page (or modal)

---

## ❓ CLARIFICATIONS & ASSUMPTIONS

### **Assumptions Made:**
1. Cart sidebar position "1/4 inch vertically" → Interpreted as 25% of screen height
2. Payment flow stays on `/shop` or current page (not redirecting elsewhere)
3. Product images will be provided later (placeholders for now)
4. "Mr. MMMM" anchors to Michael's employee card (ID: #MMMM)
5. Progress % can only increase (not decrease) for task management
6. Bernardo adds tasks via Supabase console (no UI for him, only CEO gets UI)

### **Clarifications - ANSWERED:**
1. ✅ Cart sidebar CLOSES when payment modal opens
2. ✅ Employees stay logged in across sessions (use localStorage/cookies)
3. ✅ NO logout button needed
4. ✅ Delivery message shows simple result: "Your order will be delivered in 9 days" (not the formula)
5. ✅ UI/UX flow only for now (Stripe integration later)

---

## 🎯 PROJECT SUMMARY FOR AI

**What this is:**
A satirical e-commerce website for a fake company (Yates Inc.) that sells ridiculous products with absurd pricing models (like "$15.10 per pound you weigh"). The site has a working shopping cart, fake payment flow, and a real employee management system with task tracking via Supabase.

**Key Features:**
1. **Public Site:** Product browsing, shopping cart, checkout flow
2. **Employee Portal:** Login system with role-based permissions
3. **Task Management:** Progress tracking with CEO having special permissions
4. **Satirical Elements:** Absurd product descriptions, fake TOS, ridiculous pricing tooltips

**Tech Stack:**
- Frontend: React/Next.js (assumed)
- Database: Supabase (PostgreSQL)
- Auth: Custom auth with Supabase (not Supabase Auth, just table lookup)
- State Management: React Context/Redux for cart and user session

**Core Logic:**
- 4 employees with hardcoded credentials
- Only 4 valid login combinations
- CEO can delete tasks and change due dates
- Assigned employees can only increase their task progress %
- Shopping cart with 1-5 quantity limit per item
- Delivery time = 1 + (numProducts - 1) * 2 days (capped at "1 Month" if > 30)

---

## 🚀 READY TO BUILD?

This spec covers everything in your Yates.inc file + screenshots + TOS. 

Let me know if I got anything wrong or if you want to change/add anything before I start building!

