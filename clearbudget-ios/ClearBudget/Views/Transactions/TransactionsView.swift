//
//  TransactionsView.swift
//  ClearBudget
//

import SwiftUI
import SwiftData

struct TransactionsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Transaction.date, order: .reverse) private var transactions: [Transaction]
    @EnvironmentObject var currencyManager: CurrencyManager
    @State private var showAddTransaction = false
    @State private var searchText = ""
    
    var filteredTransactions: [Transaction] {
        if searchText.isEmpty {
            return transactions
        }
        return transactions.filter { tx in
            tx.payee?.localizedCaseInsensitiveContains(searchText) == true ||
            tx.category?.name.localizedCaseInsensitiveContains(searchText) == true ||
            tx.memo?.localizedCaseInsensitiveContains(searchText) == true
        }
    }
    
    var body: some View {
        List {
            ForEach(filteredTransactions) { tx in
                TransactionDetailRow(transaction: tx)
            }
        }
        .listStyle(.plain)
        .navigationTitle("Transactions")
        .searchable(text: $searchText, prompt: "Search transactions")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showAddTransaction = true
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.title3)
                        .foregroundStyle(.orange)
                }
            }
        }
        .sheet(isPresented: $showAddTransaction) {
            AddTransactionSheet()
        }
    }
}

// MARK: - Transaction Detail Row
private struct TransactionDetailRow: View {
    let transaction: Transaction
    @EnvironmentObject var currencyManager: CurrencyManager
    
    var body: some View {
        HStack(spacing: 12) {
            // Icon
            ZStack {
                Circle()
                    .fill(transaction.transactionType == .income ? Color.green.opacity(0.12) : Color.orange.opacity(0.12))
                    .frame(width: 36, height: 36)
                Image(systemName: transaction.transactionType == .income ? "arrow.down.left" : "arrow.up.right")
                    .font(.caption)
                    .foregroundStyle(transaction.transactionType == .income ? .green : .orange)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(transaction.payee ?? "No payee")
                    .font(.subheadline)
                    .fontWeight(.medium)
                HStack(spacing: 4) {
                    Text(transaction.category?.name ?? "Uncategorized")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("·")
                        .foregroundStyle(.tertiary)
                    Text(transaction.date.formatted(date: .abbreviated, time: .omitted))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            
            Spacer()
            
            Text(currencyManager.format(transaction.amount))
                .font(.subheadline)
                .fontWeight(.semibold)
                .monospacedDigit()
                .foregroundStyle(transaction.transactionType == .income ? .green : .primary)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    NavigationStack {
        TransactionsView()
    }
    .modelContainer(for: [Transaction.self, Account.self, Category.self], inMemory: true)
    .environmentObject(CurrencyManager.shared)
}
