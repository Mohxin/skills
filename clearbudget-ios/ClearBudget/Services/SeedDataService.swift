//
//  SeedDataService.swift
//  ClearBudget
//

import SwiftData

@MainActor
enum SeedDataService {
    
    static func seedIfEmpty(container: ModelContainer) async {
        let context = container.mainContext
        let descriptor = FetchDescriptor<Account>()
        
        // Only seed if database is empty
        if let count = try? context.fetchCount(descriptor), count > 0 {
            return
        }
        
        print("🌱 Seeding database with demo data...")
        
        // Create accounts
        let checking = Account(name: "Chase Checking", accountType: "checking", balance: 4823.67)
        let savings = Account(name: "Ally Savings", accountType: "savings", balance: 15420.00)
        let creditCard = Account(name: "Chase Sapphire", accountType: "creditCard", balance: -1247.33)
        let cash = Account(name: "Apple Cash", accountType: "cash", balance: 127.50)
        
        context.insert(checking)
        context.insert(savings)
        context.insert(creditCard)
        context.insert(cash)
        
        // Create category groups
        let immediateGroup = CategoryGroup(name: "Immediate Obligations", sortOrder: 1)
        let trueExpensesGroup = CategoryGroup(name: "True Expenses", sortOrder: 2)
        let qualityGroup = CategoryGroup(name: "Quality of Life Goals", sortOrder: 3)
        let funGroup = CategoryGroup(name: "Just for Fun", sortOrder: 4)
        
        context.insert(immediateGroup)
        context.insert(trueExpensesGroup)
        context.insert(qualityGroup)
        context.insert(funGroup)
        
        // Create categories
        let rent = Category(name: "Rent/Mortgage", budgeted: 1500, activity: -1500)
        let groceries = Category(name: "Groceries", budgeted: 500, activity: -387.42)
        let transport = Category(name: "Transportation", budgeted: 200, activity: -156.80)
        let phone = Category(name: "Phone Bill", budgeted: 85, activity: -85)
        let internet = Category(name: "Internet", budgeted: 79, activity: -79)
        
        let carInsurance = Category(name: "Car Insurance", budgeted: 150, activity: 0)
        let healthInsurance = Category(name: "Health Insurance", budgeted: 320, activity: -320)
        let homeMaint = Category(name: "Home Maintenance", budgeted: 100, activity: -45.99)
        let carMaint = Category(name: "Car Maintenance", budgeted: 75, activity: 0)
        let medical = Category(name: "Medical", budgeted: 50, activity: -25.00)
        
        let dining = Category(name: "Dining Out", budgeted: 250, activity: -189.45)
        let entertainment = Category(name: "Entertainment", budgeted: 100, activity: -31.98)
        let gym = Category(name: "Gym Membership", budgeted: 50, activity: -49.99)
        let subscriptions = Category(name: "Subscriptions", budgeted: 45, activity: -44.97)
        
        let shopping = Category(name: "Shopping", budgeted: 200, activity: -156.78)
        let hobbies = Category(name: "Hobbies", budgeted: 75, activity: -34.99)
        let travel = Category(name: "Travel Fund", budgeted: 300, activity: 0)
        
        let immediateCats = [rent, groceries, transport, phone, internet]
        let trueExpCats = [carInsurance, healthInsurance, homeMaint, carMaint, medical]
        let qualityCats = [dining, entertainment, gym, subscriptions]
        let funCats = [shopping, hobbies, travel]
        
        immediateCats.forEach { $0.group = immediateGroup; context.insert($0) }
        trueExpCats.forEach { $0.group = trueExpensesGroup; context.insert($0) }
        qualityCats.forEach { $0.group = qualityGroup; context.insert($0) }
        funCats.forEach { $0.group = funGroup; context.insert($0) }
        
        // Create transactions
        let now = Date()
        func daysAgo(_ n: Int) -> Date {
            Calendar.current.date(byAdding: .day, value: -n, to: now)!
        }
        
        let transactions: [(Account, Category?, Date, String, String?, Double, Bool)] = [
            // Current month
            (checking, rent, daysAgo(1), "Property Management", "Monthly rent", -1500, true),
            (checking, groceries, daysAgo(0), "Whole Foods", "Weekly groceries", -87.43, false),
            (creditCard, groceries, daysAgo(2), "Trader Joe's", nil, -62.18, true),
            (creditCard, groceries, daysAgo(5), "Costco", "Bulk shopping", -143.67, true),
            (cash, groceries, daysAgo(8), "Local Farmers Market", "Fresh produce", -34.14, true),
            (checking, groceries, daysAgo(12), "Whole Foods", nil, -60.00, true),
            
            (creditCard, dining, daysAgo(1), "Chipotle", "Quick lunch", -15.90, true),
            (creditCard, dining, daysAgo(3), "Olive Garden", "Dinner with Sarah", -42.50, true),
            (creditCard, dining, daysAgo(7), "Starbucks", nil, -6.75, true),
            (cash, dining, daysAgo(10), "Pizza Hut", "Movie night", -28.30, true),
            (creditCard, dining, daysAgo(14), "Sushi Palace", "Anniversary dinner", -67.00, false),
            (creditCard, dining, daysAgo(18), "Starbucks", nil, -7.50, true),
            (checking, dining, daysAgo(22), "Sweetgreen", "Lunch with team", -14.50, true),
            
            (checking, nil, daysAgo(0), "TechCorp Inc", "Salary", 4250, true),
            (checking, nil, daysAgo(14), "TechCorp Inc", "Salary", 4250, true),
            (savings, nil, daysAgo(5), "Dividend Income", "VTSAX quarterly", 47.32, true),
            
            (creditCard, subscriptions, daysAgo(3), "Netflix", nil, -15.99, true),
            (creditCard, subscriptions, daysAgo(7), "Spotify", "Family plan", -10.99, true),
            (creditCard, subscriptions, daysAgo(10), "iCloud", "50GB storage", -2.99, true),
            (creditCard, subscriptions, daysAgo(12), "YouTube Premium", nil, -14.99, true),
            
            (creditCard, entertainment, daysAgo(4), "AMC Theaters", "Dune Part 2", -24.00, true),
            (cash, entertainment, daysAgo(9), "Steam", "Game sale", -7.99, true),
            
            (checking, phone, daysAgo(5), "T-Mobile", nil, -85, true),
            (checking, internet, daysAgo(10), "Xfinity", nil, -79, true),
            (checking, healthInsurance, daysAgo(1), "BlueCross", nil, -320, true),
            (checking, gym, daysAgo(1), "Planet Fitness", nil, -49.99, true),
            (checking, medical, daysAgo(15), "CVS Pharmacy", "Prescription", -25, true),
            
            (creditCard, shopping, daysAgo(6), "Amazon", "Kitchen items", -89.99, true),
            (creditCard, shopping, daysAgo(11), "Target", "Household stuff", -43.79, true),
            (cash, shopping, daysAgo(20), "Apple Store", "USB-C cable", -23, false),
            (creditCard, hobbies, daysAgo(13), "Michaels", "Art supplies", -34.99, true),
            
            (creditCard, transport, daysAgo(2), "Shell", nil, -52.30, true),
            (creditCard, transport, daysAgo(16), "Shell", nil, -48.50, true),
            (cash, transport, daysAgo(20), "Metro Card", "Monthly pass", -56, true),
        ]
        
        for (account, category, date, payee, memo, amount, cleared) in transactions {
            let tx = Transaction(
                date: date,
                payee: payee,
                memo: memo,
                amount: amount,
                cleared: cleared,
                transactionType: amount >= 0 ? .income : .expense
            )
            tx.account = account
            tx.category = category
            context.insert(tx)
        }
        
        // Create goals
        let hawaiiGoal = Goal(name: "Hawaii Vacation 🌺", targetAmount: 5000, currentAmount: 2400, targetDate: Calendar.current.date(byAdding: .month, value: 5, to: now)!, monthlyContribution: 300)
        let emergencyGoal = Goal(name: "Emergency Fund", targetAmount: 15000, currentAmount: 8750, targetDate: Calendar.current.date(byAdding: .month, value: 12, to: now)!, monthlyContribution: 500)
        let carGoal = Goal(name: "New Car Down Payment 🚗", targetAmount: 8000, currentAmount: 3200, targetDate: Calendar.current.date(byAdding: .month, value: 8, to: now)!, monthlyContribution: 400)
        let homeGoal = Goal(name: "Home Down Payment 🏠", targetAmount: 60000, currentAmount: 18500, targetDate: Calendar.current.date(byAdding: .month, value: 24, to: now)!, monthlyContribution: 1000)
        
        hawaiiGoal.category = travel
        context.insert(hawaiiGoal)
        context.insert(emergencyGoal)
        context.insert(carGoal)
        context.insert(homeGoal)
        
        // Save
        try? context.save()
        print("✅ Seeded \(transactions.count) transactions, 4 accounts, 17 categories, 4 goals")
    }
}
