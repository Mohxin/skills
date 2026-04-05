//
//  MainTabView.swift
//  ClearBudget
//

import SwiftUI

struct MainTabView: View {
    @State private var selectedTab: Tab = .home
    
    enum Tab: String, CaseIterable {
        case home
        case budget
        case transactions
        case accounts
        case goals
        
        var title: String {
            switch self {
            case .home: return "Home"
            case .budget: return "Budget"
            case .transactions: return "Transactions"
            case .accounts: return "Accounts"
            case .goals: return "Goals"
            }
        }
        
        var icon: String {
            switch self {
            case .home: return "house"
            case .budget: return "list.bullet.rectangle"
            case .transactions: return "arrow.left.arrow.right"
            case .accounts: return "creditcard"
            case .goals: return "target"
            }
        }
    }
    
    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                DashboardView()
            }
            .tabItem {
                Label(Tab.home.title, systemImage: Tab.home.icon)
            }
            .tag(Tab.home)
            
            NavigationStack {
                BudgetView()
            }
            .tabItem {
                Label(Tab.budget.title, systemImage: Tab.budget.icon)
            }
            .tag(Tab.budget)
            
            NavigationStack {
                TransactionsView()
            }
            .tabItem {
                Label(Tab.transactions.title, systemImage: Tab.transactions.icon)
            }
            .tag(Tab.transactions)
            
            NavigationStack {
                AccountsView()
            }
            .tabItem {
                Label(Tab.accounts.title, systemImage: Tab.accounts.icon)
            }
            .tag(Tab.accounts)
            
            NavigationStack {
                GoalsView()
            }
            .tabItem {
                Label(Tab.goals.title, systemImage: Tab.goals.icon)
            }
            .tag(Tab.goals)
        }
        .tint(.orange)
    }
}

#Preview {
    MainTabView()
}
