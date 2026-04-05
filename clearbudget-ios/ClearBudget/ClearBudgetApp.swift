//
//  ClearBudgetApp.swift
//  ClearBudget
//
//  Give Every Dollar a Job
//

import SwiftUI
import SwiftData

@main
struct ClearBudgetApp: App {
    @StateObject private var themeManager = ThemeManager.shared
    @StateObject private var currencyManager = CurrencyManager.shared
    
    var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            Account.self,
            Transaction.self,
            Category.self,
            CategoryGroup.self,
            Goal.self,
        ])
        let modelConfiguration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        do {
            return try ModelContainer(for: schema, configurations: [modelConfiguration])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environmentObject(themeManager)
                .environmentObject(currencyManager)
                .preferredColorScheme(themeManager.isDark ? .dark : .light)
        }
        .modelContainer(sharedModelContainer)
    }
}
