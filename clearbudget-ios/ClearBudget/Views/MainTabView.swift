//
//  MainTabView.swift
//  ClearBudget
//

import SwiftUI

struct MainTabView: View {
    @State private var selectedTab: Tab = .home
    @State private var showCurrencyPicker = false
    @EnvironmentObject var currencyManager: CurrencyManager
    
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
            .tabItem { Label(Tab.home.title, systemImage: Tab.home.icon) }
            .tag(Tab.home)
            
            NavigationStack {
                BudgetView()
            }
            .tabItem { Label(Tab.budget.title, systemImage: Tab.budget.icon) }
            .tag(Tab.budget)
            
            NavigationStack {
                TransactionsView()
            }
            .tabItem { Label(Tab.transactions.title, systemImage: Tab.transactions.icon) }
            .tag(Tab.transactions)
            
            NavigationStack {
                AccountsView()
            }
            .tabItem { Label(Tab.accounts.title, systemImage: Tab.accounts.icon) }
            .tag(Tab.accounts)
            
            NavigationStack {
                GoalsView()
            }
            .tabItem { Label(Tab.goals.title, systemImage: Tab.goals.icon) }
            .tag(Tab.goals)
        }
        .tint(.orange)
        .overlay(alignment: .bottom) {
            // Floating currency selector
            Button {
                showCurrencyPicker = true
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "globe")
                        .font(.caption2)
                    Text(currencyManager.current.code)
                        .font(.caption2)
                        .fontWeight(.semibold)
                }
                .foregroundStyle(.secondary)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(.ultraThinMaterial, in: Capsule())
                .padding(.bottom, 8)
            }
            .buttonStyle(.plain)
            .offset(y: 40)
        }
        .sheet(isPresented: $showCurrencyPicker) {
            CurrencyPickerSheet()
        }
    }
}

// MARK: - Currency Picker Sheet
struct CurrencyPickerSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var currencyManager: CurrencyManager
    
    var body: some View {
        NavigationStack {
            List {
                ForEach(CurrencyManager.currencies, id: \.code) { currency in
                    Button {
                        currencyManager.selectedCurrencyCode = currency.code
                        dismiss()
                    } label: {
                        HStack {
                            Text(currency.symbol)
                                .font(.title3)
                                .frame(width: 36)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(currency.code)
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                Text(currency.name)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            if currencyManager.current.code == currency.code {
                                Image(systemName: "checkmark")
                                    .foregroundStyle(.orange)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Currency")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

#Preview {
    MainTabView()
        .environmentObject(CurrencyManager.shared)
}
