//
//  ReportsView.swift
//  ClearBudget
//

import SwiftUI
import Charts

struct SpendingItem: Identifiable {
    let id = UUID()
    let category: String
    let spent: Double
    let budgeted: Double
}

struct ReportsView: View {
    @EnvironmentObject var currencyManager: CurrencyManager
    @State private var loading = true
    @State private var spendingData: [SpendingItem] = []
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Spending by category
                VStack(alignment: .leading, spacing: 12) {
                    Text("Spending by Category")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    if loading {
                        ProgressView()
                            .frame(maxWidth: .infinity, minHeight: 200)
                    } else if spendingData.isEmpty {
                        ContentUnavailableView(
                            "No data yet",
                            systemImage: "chart.bar",
                            description: Text("Transactions will appear here")
                        )
                    } else {
                        VStack(spacing: 12) {
                            ForEach(spendingData) { item in
                                SpendingRow(item: item, formatCurrency: currencyManager.format)
                            }
                        }
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                
                // Monthly trend placeholder
                VStack(alignment: .leading, spacing: 12) {
                    Text("Monthly Trend")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text("Add more transactions to see monthly trends")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, minHeight: 120)
                        .frame(maxWidth: .infinity)
                }
                .padding()
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            .padding(.horizontal)
            .padding(.bottom, 24)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Reports")
        .task {
            // Demo data for now - would fetch from Supabase
            spendingData = [
                SpendingItem(category: "Groceries", spent: 387.42, budgeted: 500),
                SpendingItem(category: "Dining Out", spent: 189.45, budgeted: 250),
                SpendingItem(category: "Shopping", spent: 156.78, budgeted: 200),
                SpendingItem(category: "Transportation", spent: 156.80, budgeted: 200),
                SpendingItem(category: "Subscriptions", spent: 44.97, budgeted: 45),
            ]
            loading = false
        }
    }
}

private struct SpendingRow: View {
    let item: SpendingItem
    let formatCurrency: (Double) -> String
    
    private var progress: Double {
        guard item.budgeted > 0 else { return 0 }
        return Swift.min(item.spent / item.budgeted, 1.0)
    }
    
    var body: some View {
        VStack(spacing: 6) {
            HStack {
                Text(item.category)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Spacer()
                Text(formatCurrency(item.spent))
                    .font(.subheadline)
                    .monospacedDigit()
                    .foregroundStyle(.secondary)
            }
            
            ProgressView(value: progress)
                .tint(progress >= 1 ? .red : .orange)
        }
    }
}

#Preview {
    NavigationStack {
        ReportsView()
    }
    .environmentObject(CurrencyManager.shared)
}
