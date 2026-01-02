# Yates Inc. Minigame - Mining Clicker Specification

## Overview
A **Doge Miner-style clicker game** where players mine rocks to earn Yates Dollars, unlock upgrades, and earn discount coupons for the main website shop.

---

## Game Entry Flow

### Option 1: Simple Cutscene (Less Stressful)
1. Click "Game" button on main website
2. Brief animated cutscene showing:
   - Steve character entering cave
   - Walking through mineshaft
   - Meeting NPC
   - NPC teleports player to mining area
3. Fade to mining interface

### Option 2: 3D Cave Navigation (More Complex)
1. Click "Game" button
2. Enter 3D cave environment
3. Control Steve with WASD/Arrow keys
4. Walk through mineshaft to find NPC
5. Click NPC → Teleport to 2D mining interface

**Recommendation:** Use **Option 1 (Cutscene)** for less stress and faster development.

---

## Main Gameplay Interface (2D Clicker Style)

### Screen Layout:
```
┌─────────────────────────────────────────────────────┐
│  💰 Yates Dollars: $XXX        [🛒 SHOP]           │
│  🎟️ Coupons: X                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│         [PICKAXE]      [ROCK IMAGE]                │
│          (mining) →   (clickable, center)           │
│                                                     │
│                                                     │
│  Progress: ████████░░ (80/100 clicks)              │
│  Next Rock: Iron                                   │
└─────────────────────────────────────────────────────┘
```

**Visual Description:**
- **Rock** is centered and large (main focus, clickable)
- **Pickaxe** is positioned to the left/side, angled toward the rock
- When you click, pickaxe animates swinging into the rock
- Particles/sparks fly from impact point

---

## Core Mechanics

### 1. Mining System
- **Click the rock** to mine
- Each click:
  - Reduces rock HP by 1
  - Earns Yates Dollars (amount depends on pickaxe + rock type)
- When rock HP reaches 0:
  - Rock breaks
  - Counter increments
  - New rock appears (same type until threshold reached)

### 2. Pickaxe Upgrades
**Pickaxes do NOT auto-mine** - they only increase:
- 💰 **Money per click**
- (Optional: Click power to break rocks faster)

**Progression:**
- Start with **Bronze Pickaxe**
- Buy upgrades in shop with Yates Dollars
- Each pickaxe costs more than the last

### 3. Rock Progression (Linear)
Rocks unlock **automatically** after mining X total clicks:

| # | Rock Type | Previous Rock | Clicks to Break | $ Per Break | Next Rock (Unlock Requirement) |
|---|-----------|---------------|-----------------|-------------|--------------------------------|
| 1 | **Coal** | *(Start)* | 2 | $1 | Stone (50 total clicks) |

| 2 | **Stone** | Coal | 6 | $10 | Copper (120 total clicks) |

| 3 | **Copper** | Stone | 12 | $15 | Silver (250 total clicks) |

| 4 | **Silver** | Copper | 60 | $25 | Iron (420 total clicks) |

| 5 | **Iron** | Silver | 80 | $120 | Gold (800 total clicks) |

| 6 | **Gold** | Iron | 300 | $760 | Diamond (2000 total clicks) |

| 7 | **Diamond** | Gold | 600 | $1500 | Platinum (4000 total clicks) |
| | | | | | **--- 7 ROCK MARK ---** |
| 8 | **Platinum** | Diamond | 1500 | $3000 | Uranium (5000 total clicks) |
| 9 | **Uranium** | Platinum | 3000 | $6000 | Titanium (10000 total clicks) |
| 10 | **Titanium** | Uranium | 6000 | $12000 | Obsidian (17000 total clicks) |
| 11 | **Obsidian** | Titanium | 10000 | $24000 | Ruby (24000 total clicks) |
| 12 | **Ruby** | Obsidian | 17000 | $48000 | Sapphire (35000 total clicks) |
| | | | | | **--- 12 ROCK MARK ---** |
| 13 | **Sapphire** | Ruby | 25000 | $96000 | Emerald (50000 total clicks) |
| 14 | **Emerald** | Sapphire | 35000 | $192000 | Amethyst (75000 total clicks) |
| 15 | **Amethyst** | Emerald | 50000 | $384000 | *(MAX ROCK)* |

**Notes:**
- **Clicks to Break** = How many clicks needed to break ONE rock of this type
- **$ Per Break** = Money earned when you fully break one rock (not per click!)
- **$ Per click** = Half the money earned when you brek the specific rock
- **Next Rock** = What unlocks next and how many total clicks you need across the entire game



## 🎟️ Coupon System (Unlocks at Rock 7 + Pickaxe 7)

### Drop Rates (While Mining Rock 7+):
- **30% Discount Coupon** → 10% chance per click
- **50% Discount Coupon** → 6% chance per click
- **100% Discount Coupon (FREE!)** → 1% chance per click

### Coupon Mechanics:
- Coupons are **stored in player inventory**
- Displayed at top of screen: `🎟️ Coupons: 5`
- **One-time use** per coupon
- Can be used on **any product** in main website shop

### Main Website Integration:
Once player has coupons:
1. **"Use Coupon" button** appears on all product cards
2. Click button → Opens coupon selector modal
3. Choose which coupon to apply (30%, 50%, or 100%)
4. Discount applied to cart price
5. Coupon is consumed after checkout

---

## 🛒 Shop System

### Shop Opens: Click "SHOP" button (top-right)

### Shop Tabs:
1. **Pickaxes** (Always available)
2. **Products** (Unlocks at Rock 5)

---

### Tab 1: Pickaxes

Order:
Pickaxe name----Price----Extra click power----Special ability----

wood--free--1---none
stone--120--4--none
bronze--500--40--none
cooper--1000--67--none
iron--2000--200--none
steel--5000--500--none
silver--7000--1000--none
gold--10000--50--click 2x faster, but its weaker
platnum--18000--700--none
dimond--27000--1000--none
obsidian--41000--1500--none
alexendatrie--70000--3600--gives 40% more money
opal--100k--5102--13% more cuppons luck
--Special ones---
Plasma--300k--instant melt
Doge--600k--6767--3x money



---

### Tab 2: Products (Unlocks at Rock 12 + Pickaxe 12)

**Requirement:** Must have unlocked **12th Pickaxe AND 12th Rock**

Once unlocked, **all main website products** appear in the minigame shop:
- Glass Table
- Watering Can
- Silverware
- Rolling Pin
- Custom Key
- Fancy Flippers
- Toilet Warmer
- Toilet Paper
- Very Safe Door

**Purchase with Yates Dollars:**
- Products cost **Yates Dollars** (not real money)
- Prices TBD (e.g., Glass Table = $5000 Yates Dollars)
- Purchased items are added to **main website cart**
- Can checkout normally (but already "paid" with game currency)

---

## Progression Summary

### Early Game (Rocks 1-2):
- Learn clicking mechanics
- Buy first few pickaxes
- Grind Yates Dollars

### Mid Game (Rock 3-4):
- **Coupons start dropping!**
- Strategic decision: Save coupons for expensive products
- Faster money generation

### Late Game (Rock 5+):
- **Products unlock in minigame shop**
- Buy products directly with Yates Dollars
- Max out pickaxe upgrades

---

## Assets Needed

### Pickaxes:
- `woodp.png` - Wooden Pickaxe done
- `stonep.png` - Stone Pickaxe done
- `bronzep.png` - Bronze Pickaxe done
- `copperp.png` - Copper Pickaxe done
- `ironp.png` - Iron Pickaxe done
- `steelp.png` - Steel Pickaxe
- `silverp.png` - Silver Pickaxe done
- `goldp.png` - Gold Pickaxe done
- `platinump.png` - Platinum Pickaxe done
- `diamondp.png` - Diamond Pickaxe done
- `obsidianp.png` - Obsidian Pickaxe done
- `alexandritep.png` - Alexandrite Pickaxe done
- `opalp.png` - Opal Pickaxe done
- `plasmap.png` - Plasma Pickaxe (Special) done
- `dogep.png` - Doge Pickaxe (Special) done 

### Rocks:
- `coal.png` - Coal Rock done 
- `stone.png` - Stone Rock done
- `copper.png` - Copper Rock done
- `silver.png` - Silver Rock done 
- `iron.png` - Iron Rock done
- `gold.png` - Gold Rock done
- `diamond.png` - Diamond Rock done
- `platinum.png` - Platinum Rock done
- `uranium.png` - Uranium Rock done 
- `titanium.png` - Titanium Rock done
- `obsidian.png` - Obsidian Rock done 
- `ruby.png` - Ruby Rock done 
- `sapphire.png` - Sapphire Rock done 
- `emerald.png` - Emerald Rock done 
- `amethyst.png` - Amethyst Rock done 




### Characters:
- `steve_character.png` (player sprite)
- `npc_miner.png` (teleport NPC)

### Backgrounds (AI-Generated):
- `cave_entrance.png` (AI-generated cave entrance)
- `mineshaft_tunnel.png` (AI-generated mineshaft)
- `mining_area_bg.png` (2D clicker background)

### UI Elements:
- Coupon icons (30%, 50%, 100%)
- Shop button
- Progress bar

---

## Technical Notes

- **Save Progress:** Use localStorage to save:
  - Yates Dollars
  - Current pickaxe
  - Current rock level
  - Total clicks
  - Coupon inventory
- **Integration:** Minigame and main website share cart/coupon state
- **Animation:** Click feedback (rock shake, particles, +$ popup)

---

## Future Ideas (Optional)
- Auto-clicker upgrades (passive income)
- Prestige system (reset for permanent bonuses)
- Daily login rewards
- Rare "shiny" rocks with bonus drops
- Leaderboard (most Yates Dollars earned)

---

**Status:** Awaiting rock and pickaxe images to begin implementation.
