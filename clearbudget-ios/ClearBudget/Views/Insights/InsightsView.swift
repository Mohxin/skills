//
//  InsightsView.swift
//  ClearBudget
//

import SwiftUI

struct InsightsView: View {
    @EnvironmentObject var currencyManager: CurrencyManager
    @State private var loading = true
    
    // Demo data
    let totalSpent: Double = 1247.89
    let dailyAverage: Double = 89.14
    let transactionCount: Int = 31
    let projectedMonthly: Double = 2762.34
    let topMerchants: [(String, Double)] = [
        ("Whole Foods", 287.43),
        ("Costco", 143.67),
        ("Sushi Palace", 67.00),
        ("Amazon", 89.99),
        ("Shell", 100.80),
    ]
    let topCategories: [(String, Double, Double)] = [
        ("Groceries", 387.42, 500),
        ("Dining Out", 189.45, 250),
        ("Shopping", 156.78, 200),
        ("Transportation", 156.80, 200),
        ("Subscriptions", 44.97, 45),
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Hero
                ZStack {
                    LinearGradient(
                        colors: [Color(hex: "fef3e2"), Color(hex: "fce8c5")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .frame(height: 100)
                    
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Your Spending")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundStyle(.white)
                            Text(currencyManager.format(totalSpent) + " this month")
                                .font(.caption)
                                .foregroundStyle(.white.opacity(0.8))
                        }
                        Spacer()
                        Image(systemName: "lightbulb.fill")
                            .font(.title)
                            .foregroundStyle(.white.opacity(0.6))
                    }
                    .padding(.horizontal)
                }
                .clipShape(RoundedRectangle(cornerRadius: 16))
                
                // Metrics
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    InsightMetricCard(title: "Daily Avg", value: currencyManager.format(dailyAverage), icon: "calendar")
                    InsightMetricCard(title: "Transactions", value: "\(transactionCount)", icon: "list.bullet")
                    InsightMetricCard(title: "Projected", value: currencyManager.format(projectedMonthly), icon: "chart.line.uptrend.xyaxis")
                    InsightMetricCard(title: "Budget Used", value: "62%", icon: "chart.pie.fill")
                }
                
                // Top Merchants
                InsightSection(title: "Top Merchants", icon: "bag.fill") {
                    ForEach(Array(topMerchants.enumerated()), id: \.offset) { i, merchant in
                        HStack {
                            Text("\(i + 1)")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundStyle(.secondary)
                                .frame(width: 20)
                            Text(merchant.0)
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Spacer()
                            Text(currencyManager.format(merchant.1))
                                .font(.subheadline)
                                .monospacedDigit()
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                }
                
                // Top Categories
                InsightSection(title: "Category Breakdown", icon: "chart.bar.fill") {
                    ForEach(Array(topCategories.enumerated()), id: \.offset) { _, cat in
                        VStack(spacing: 4) {
                            HStack {
                                Text(cat.0)
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                Spacer()
                                Text(currencyManager.format(cat.1))
                                    .font(.subheadline)
                                    .monospacedDigit()
                                    .foregroundStyle(.secondary)
                            }
                            
                            let progress = cat.2 > 0 ? cat.1 / cat.2 : 0
                            ProgressView(value: progress)
                                .tint(progress >= 1 ? .red : .orange)
                        }
                    }
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 24)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Insights")
    }
}

// MARK: - Subviews
private struct InsightMetricCard: View {
    let title: String
    let value: String
    let icon: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(.orange)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .monospacedDigit()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

private struct InsightSection<Content: View>: View {
    let title: String
    let icon: String
    @ViewBuilder let content: Content
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(.orange)
                Text(title)
                    .font(.headline)
                    .fontWeight(.semibold)
            }
            
            content
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

#Preview {
    NavigationStack {
        InsightsView()
    }
    .environmentObject(CurrencyManager.shared)
}
