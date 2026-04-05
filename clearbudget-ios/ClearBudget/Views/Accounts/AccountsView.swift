//
//  AccountsView.swift
//  ClearBudget
//

import SwiftUI
import SwiftData

struct AccountsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Account.name) private var accounts: [Account]
    @EnvironmentObject var currencyManager: CurrencyManager
    
    var totalBalance: Double {
        accounts.reduce(0) { $0 + $1.balance }
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Net Worth
                netWorthCard
                
                // Account Cards
                if accounts.isEmpty {
                    ContentUnavailableView(
                        "No accounts yet",
                        systemImage: "creditcard",
                        description: Text("Add your first account to start tracking")
                    )
                } else {
                    ForEach(accounts) { account in
                        AccountCard(account: account)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 24)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Accounts")
    }
    
    private var netWorthCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Net Worth")
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(currencyManager.format(totalBalance))
                .font(.title)
                .fontWeight(.bold)
                .monospacedDigit()
                .foregroundStyle(totalBalance >= 0 ? .green : .red)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
        )
    }
}

// MARK: - Account Card
private struct AccountCard: View {
    let account: Account
    @EnvironmentObject var currencyManager: CurrencyManager
    
    private var tint: Color {
        switch account.accountType {
        case "checking": return .blue
        case "savings": return .green
        case "creditCard": return .purple
        case "cash": return .orange
        default: return .gray
        }
    }
    
    var body: some View {
        HStack(spacing: 12) {
            // Icon
            Image(systemName: account.typeIcon)
                .font(.title3)
                .foregroundStyle(tint)
                .frame(width: 40, height: 40)
                .background(tint.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 10))
            
            VStack(alignment: .leading, spacing: 2) {
                Text(account.name)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Text(account.typeDisplay)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            Text(currencyManager.format(account.balance))
                .font(.subheadline)
                .fontWeight(.bold)
                .monospacedDigit()
                .foregroundStyle(account.balance >= 0 ? .green : .red)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

#Preview {
    NavigationStack {
        AccountsView()
    }
    .modelContainer(for: [Account.self], inMemory: true)
    .environmentObject(CurrencyManager.shared)
}
