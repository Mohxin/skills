# ClearBudget iOS

Native iPhone app for YNAB-style envelope budgeting. Built with **SwiftUI** and **SwiftData**, synced with **Supabase**.

## Features

- 🏠 **Dashboard** — Overview with stats, recent transactions
- 💰 **Budget** — Category groups with collapsible sections, inline editing
- 💳 **Transactions** — Full list with search, add new transactions
- 🏦 **Accounts** — Net worth, account cards with color-coded icons
- 🎯 **Goals** — Savings goals with progress tracking
- 🌙 **Dark Mode** — System-aware with manual toggle
- 💱 **Multi-Currency** — 10 currencies including SEK, NOK, DKK

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | SwiftUI (iOS 17+) |
| Data | SwiftData (local) + Supabase (cloud sync) |
| Architecture | MVVM with @Observable |
| Networking | URLSession (no external dependencies) |
| Navigation | NavigationStack + TabView |

## Project Structure

```
clearbudget-ios/
├── ClearBudget/
│   ├── ClearBudgetApp.swift       # @main entry point
│   ├── Models/
│   │   ├── Account.swift          # Account model with SwiftData
│   │   ├── Transaction.swift      # Transaction model
│   │   ├── Category.swift         # Category + CategoryGroup
│   │   └── Goal.swift             # Savings goals
│   ├── Services/
│   │   ├── SupabaseService.swift  # API client for cloud sync
│   │   ├── CurrencyManager.swift  # Multi-currency formatting
│   │   └── ThemeManager.swift     # Dark mode management
│   ├── Views/
│   │   ├── MainTabView.swift      # Tab bar navigation
│   │   ├── Dashboard/             # Home screen
│   │   ├── Budget/                # Budget management
│   │   ├── Transactions/          # Transaction list + add sheet
│   │   ├── Accounts/              # Account management
│   │   └── Goals/                 # Goals tracking
│   └── Resources/
│       ├── Assets.xcassets/       # App icon, accent color
│       └── Info.plist
├── project.yml                    # XcodeGen project definition
└── setup.sh                       # One-line project generator
```

## Quick Start

### 1. Generate Xcode Project

```bash
cd clearbudget-ios
./setup.sh
```

This installs [XcodeGen](https://github.com/yonaskolb/XcodeGen) (if needed) and generates `ClearBudget.xcodeproj`.

### 2. Open in Xcode

```bash
open ClearBudget.xcodeproj
```

### 3. Configure

1. Select your **Development Team** in Signing & Capabilities
2. Select an **iPhone simulator** (iPhone 15 recommended)
3. Press **⌘R** to build and run

### 4. Connect to Supabase (Optional)

The app works offline with SwiftData. To enable cloud sync, update these in `SupabaseService.swift`:

```swift
enum SupabaseConfig {
    static let url = "https://YOUR_PROJECT.supabase.co"
    static let anonKey = "YOUR_ANON_KEY"
}
```

## Design System

Matches the web app's Linear-inspired design language:

| Token | Value |
|-------|-------|
| Primary | `#F97316` (Orange 500) |
| Background | `#FAFAFA` / `#09090B` (dark) |
| Cards | `#FFFFFF` / `#111113` (dark) |
| Positive | Green 500 |
| Negative | Red 500 |
| Font | SF Pro (system) |
| Corners | 16pt (cards), 10pt (icons) |

## Requirements

- **Xcode 15+**
- **iOS 17.0+**
- **Swift 5.9+**
- **macOS 14+** (for development)

## Screenshots

| Dashboard | Budget | Transactions |
|-----------|--------|-------------|
| Stats cards, recent transactions | Collapsible category groups | Searchable list, add sheet |

| Accounts | Goals |
|----------|-------|
| Net worth, account cards | Progress tracking, targets |

## Architecture Decisions

1. **SwiftData over Core Data** — Modern, type-safe, less boilerplate
2. **URLSession over Alamofire** — No external dependencies, native async/await
3. **No ObservableObject** — Uses iOS 17's `@Observable` macro (coming in next update)
4. **Local-first** — Works offline, syncs when connected
5. **No navigation library** — Native NavigationStack with deep linking support

## Roadmap

- [ ] Face ID / Touch ID authentication
- [ ] Haptic feedback on transactions
- [ ] Widget for quick balance check
- [ ] Siri Shortcuts ("Add expense $12 at Starbucks")
- [ ] Charts with Swift Charts
- [ ] Export to CSV
- [ ] Recurring transactions
- [ ] Bank sync via GoCardless
