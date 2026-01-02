
# Console Commands (F12 Developer Tools)

Open your browser's developer console (F12) and type these commands:

---

## 🎮 Game Commands

```javascript
// Show all game commands
yatesHelp()

// Reset all game progress
yatesReset()

// Give yourself money
yatesGiveMoney(1000000)  // Add 1 million Yates Dollars

// Give a specific pickaxe (ID 1-15)
yatesGivePcx(10)

// Unlock ALL pickaxes
yatesGiveAllPcx()
```

---

## 📈 Stock Commands

```javascript
// Add stocks to your inventory
yatesGiveStocks(100)  // Add 100 stocks

// Remove stocks from your inventory
yatesRemoveStocks(50)  // Remove 50 stocks

// Set stocks to exact amount
yatesSetStocks(1000)  // Set to exactly 1000 stocks

// Set the current stock price (min: 500K, max: 10M)
yatesSetStockPrice(5000000)  // Set price to $5M
```

---

## 💰 Paycheck Popup Test

```javascript
// Test the paycheck popup (default: 500 Yates dollars)
testPaycheckPopup()

// Test with custom amount and currency
testPaycheckPopup(780, 'yates')   // 780 Yates dollars
testPaycheckPopup(67, 'walters')  // 67 Walters dollars
```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `yatesHelp()` | Show game cheat commands |
| `yatesReset()` | Reset all game progress |
| `yatesGiveMoney(amount)` | Add Yates Dollars |
| `yatesGivePcx(id)` | Give pickaxe by ID (1-15) |
| `yatesGiveAllPcx()` | Unlock all pickaxes |
| `yatesGiveStocks(amount)` | Add stocks |
| `yatesRemoveStocks(amount)` | Remove stocks |
| `yatesSetStocks(amount)` | Set exact stock count |
| `yatesSetStockPrice(price)` | Set stock price (500K-10M) |
| `testPaycheckPopup(amount, currency)` | Test paycheck popup |

