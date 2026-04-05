//
//  DashboardView.swift
//  ClearBudget
//

import SwiftUI
import SwiftData

struct DashboardView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Account.name) private var accounts: [Account]
    @Query(sort: \Transaction.date, order: .reverse) private var transactions: [Transaction]
    @EnvironmentObject var currencyManager: CurrencyManager
    @State private var loading = true
    @State private var overview: DashboardOverview?
    
    struct DashboardOverview {
        let totalBalance: Double
        let toBeBudgeted: Double
        let totalBudgeted: Double
        let totalSpent: Double
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Header
                headerSection
                
                // Stats Grid
                if let overview {
                    statsGrid(overview)
                }
                
                // Recent Transactions
                recentTransactionsSection
            }
            .padding(.horizontal)
            .padding(.bottom, 24)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                HStack(spacing: 8) {
                    Image(systemName: "dollarsign.circle.fill")
                        .font(.title2)
                        .foregroundStyle(.orange)
                    Text("ClearBudget")
                        .font(.headline)
                        .fontWeight(.semibold)
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showAddTransaction = true
                } label: {
                    Image(systemName: "plus")
                        .font(.body.weight(.semibold))
                        .foregroundStyle(.orange)
                }
            }
        }
        .task {
            await loadOverview()
        }
        .sheet(isPresented: $showAddTransaction) {
            AddTransactionSheet()
        }
    }
    
    // MARK: - Header
    private var headerSection: some View {
        ZStack(alignment: .bottomLeading) {
            DashboardHeroIllustration()
                .frame(height: 160)
                .clipped()
            
            VStack(alignment: .leading, spacing: 4) {
                Text(Date.now.formatted(date: .abbreviated, time: .omitted))
                    .font(.caption)
                    .foregroundStyle(.white)
                Text(monthTitle)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
            }
            .padding(.bottom, 16)
            .padding(.leading)
        }
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
    
    private var monthTitle: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        return formatter.string(from: .now)
    }
    
    // MARK: - Stats
    @ViewBuilder
    private func statsGrid(_ overview: DashboardOverview) -> some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            StatCard(
                title: "Ready to Assign",
                value: currencyManager.format(overview.toBeBudgeted),
                tint: overview.toBeBudgeted >= 0 ? .green : .red,
                icon: "list.bullet.rectangle"
            )
            StatCard(
                title: "Total Balance",
                value: currencyManager.format(overview.totalBalance),
                tint: .blue,
                icon: "banknote"
            )
            StatCard(
                title: "Budgeted",
                value: currencyManager.format(overview.totalBudgeted),
                tint: .orange,
                icon: "chart.pie"
            )
            StatCard(
                title: "Spent",
                value: currencyManager.format(overview.totalSpent),
                tint: .red,
                icon: "arrow.up.right"
            )
        }
    }
    
    // MARK: - Transactions
    private var recentTransactionsSection: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Recent")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
                Button("See All") {
                    // Navigate to transactions
                }
                .font(.caption)
                .foregroundStyle(.orange)
            }
            .padding(.horizontal)
            .padding(.vertical, 12)
            
            if transactions.isEmpty {
                ContentUnavailableView(
                    "No transactions yet",
                    systemImage: "creditcard",
                    description: Text("Add your first transaction to get started")
                )
                .padding(.top, 24)
            } else {
                ForEach(Array(transactions.prefix(5))) { tx in
                    TransactionRow(transaction: tx)
                }
            }
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
    
    // MARK: - Actions
    @State private var showAddTransaction = false
    
    private func loadOverview() async {
        do {
            let service = SupabaseService.shared
            let overview = try await service.fetchOverview()
            await MainActor.run {
                self.overview = DashboardOverview(
                    totalBalance: overview.totalBalance,
                    toBeBudgeted: overview.toBeBudgeted,
                    totalBudgeted: overview.totalBudgeted,
                    totalSpent: overview.totalActivity
                )
                loading = false
            }
        } catch {
            print("Failed to load overview: \(error)")
            loading = false
        }
    }
}

// MARK: - Stat Card
private struct StatCard: View {
    let title: String
    let value: String
    let tint: Color
    let icon: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Spacer()
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundStyle(tint)
                    .frame(width: 36, height: 36)
                    .background(tint.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.title3)
                    .fontWeight(.bold)
                    .monospacedDigit()
                    .lineLimit(1)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Transaction Row
private struct TransactionRow: View {
    let transaction: Transaction
    @EnvironmentObject var currencyManager: CurrencyManager
    
    var body: some View {
        HStack(spacing: 12) {
            // Icon
            ZStack {
                Circle()
                    .fill(transaction.transactionType == .income ? Color.green.opacity(0.1) : Color.orange.opacity(0.1))
                    .frame(width: 40, height: 40)
                Image(systemName: transaction.transactionType == .income ? "arrow.down.left" : "arrow.up.right")
                    .font(.caption)
                    .foregroundStyle(transaction.transactionType == .income ? .green : .orange)
            }
            
            // Details
            VStack(alignment: .leading, spacing: 2) {
                Text(transaction.payee ?? "No payee")
                    .font(.subheadline)
                    .fontWeight(.medium)
                HStack(spacing: 4) {
                    Text(transaction.category?.name ?? "Uncategorized")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("·")
                        .foregroundStyle(.secondary)
                    Text(transaction.date.formatted(date: .abbreviated, time: .omitted))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            
            Spacer()
            
            // Amount
            Text(currencyManager.format(transaction.amount))
                .font(.subheadline)
                .fontWeight(.semibold)
                .monospacedDigit()
                .foregroundStyle(transaction.transactionType == .income ? .green : .primary)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
    }
}

// MARK: - Preview
#Preview {
    NavigationStack {
        DashboardView()
    }
    .modelContainer(for: [Account.self, Transaction.self, Category.self, CategoryGroup.self, Goal.self], inMemory: true)
    .environmentObject(CurrencyManager.shared)
}
