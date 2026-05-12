//
//  InsightsView.swift
//  ClearBudget
//

import SwiftUI

struct InsightsView: View {
    @EnvironmentObject private var currencyManager: CurrencyManager

    @State private var isLoading = true
    @State private var insights: APIInsights?
    @State private var accounts: [APIAccount] = []
    @State private var recurring: [APIRecurring] = []
    @State private var goals: [APIGoal] = []
    @State private var spending: [APISpending] = []
    @State private var errorMessage: String?

    private var totalBalance: Double {
        accounts.reduce(0) { $0 + $1.balance }
    }

    private var liquidBalance: Double {
        accounts
            .filter { ["checking", "savings", "cash"].contains($0.type) }
            .reduce(0) { $0 + max($1.balance, 0) }
    }

    private var monthlyBills: Double {
        recurring.filter(\.enabled).reduce(0) { total, item in
            let amount = abs(item.amount)
            switch item.frequency {
            case "weekly": return total + amount * 4.33
            case "biweekly": return total + amount * 2.17
            case "yearly": return total + amount / 12
            default: return total + amount
            }
        }
    }

    private var goalGap: Double {
        goals.reduce(0) { total, goal in
            total + max(goal.targetAmount - goal.currentAmount, 0)
        }
    }

    private var totalDaysInMonth: Int {
        Calendar.current.range(of: .day, in: .month, for: .now)?.count ?? 30
    }

    private var projectedMonthly: Double {
        (insights?.avgDaily ?? 0) * Double(totalDaysInMonth)
    }

    private var runwayMonths: Double {
        guard monthlyBills > 0 else { return 0 }
        return liquidBalance / monthlyBills
    }

    private var topCategory: APISpending? {
        spending.first
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                hero

                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 48)
                } else if let errorMessage {
                    ContentUnavailableView("Insights unavailable", systemImage: "exclamationmark.triangle", description: Text(errorMessage))
                        .padding(.vertical, 32)
                } else {
                    metrics
                    recommendations
                    accountMix
                    topMerchants
                    topCategories
                    quickFacts
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 24)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Insights")
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    private var hero: some View {
        ZStack(alignment: .leading) {
            LinearGradient(
                colors: [Color(hex: "fff7ed"), Color(hex: "fed7aa"), Color(hex: "f97316").opacity(0.55)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(alignment: .leading, spacing: 10) {
                Text("Money Coach")
                    .font(.caption2.weight(.bold))
                    .textCase(.uppercase)
                    .foregroundStyle(.orange)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(.white.opacity(0.78), in: Capsule())

                Text("See the habits behind the numbers.")
                    .font(.title2.weight(.black))
                    .foregroundStyle(.primary)

                Text("Spending pace, recurring bill pressure, goal gaps, merchant concentration, and account runway in one view.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding()
        }
        .frame(maxWidth: .infinity, minHeight: 160, alignment: .leading)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private var metrics: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            InsightMetricCard(title: "Total Spent", value: currencyManager.format(insights?.totalSpent ?? 0), subtitle: "\(insights?.transactionCount ?? 0) transactions", tint: .red, icon: "arrow.up.right")
            InsightMetricCard(title: "Daily Avg", value: currencyManager.format(insights?.avgDaily ?? 0), subtitle: "\(currencyManager.format((insights?.avgDaily ?? 0) * 7)) weekly rhythm", tint: .orange, icon: "calendar")
            InsightMetricCard(title: "Runway", value: String(format: "%.1f mo", runwayMonths), subtitle: "Liquid balance vs bills", tint: runwayMonths >= 3 ? .green : .orange, icon: "fuelpump")
            InsightMetricCard(title: "Goal Gap", value: currencyManager.format(goalGap), subtitle: "\(goals.count) active goals", tint: goalGap > 0 ? .orange : .green, icon: "target")
        }
    }

    private var recommendations: some View {
        VStack(alignment: .leading, spacing: 12) {
            InsightSectionHeader(title: "Coach Recommendations", icon: "sparkles")

            let monthly = projectedMonthly
            if monthly > 0 {
                RecommendationRow(tint: .orange, title: "Watch spending pace", description: "At the current daily average, this month is tracking toward \(currencyManager.format(monthly)).")
            }

            if monthlyBills > 0 {
                RecommendationRow(tint: monthlyBills / max(liquidBalance, 1) > 0.35 ? .orange : .green, title: "Review fixed commitments", description: "\(currencyManager.format(monthlyBills)) is committed monthly before flexible spending.")
            }

            if goalGap > 0 {
                RecommendationRow(tint: .green, title: "Fund goals deliberately", description: "\(currencyManager.format(goalGap)) remains across active goals.")
            }

            if let merchant = insights?.topMerchants.first {
                RecommendationRow(tint: .blue, title: "\(merchant.payee) is your top merchant", description: "\(currencyManager.format(merchant.total)) across \(merchant.count) transaction\(merchant.count == 1 ? "" : "s").")
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private var accountMix: some View {
        VStack(alignment: .leading, spacing: 14) {
            InsightSectionHeader(title: "Account Mix", icon: "chart.pie")

            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("Liquid balance")
                    Spacer()
                    Text(currencyManager.format(liquidBalance))
                        .monospacedDigit()
                }
                .font(.caption)
                .foregroundStyle(.secondary)
                ProgressView(value: min(liquidBalance / max(totalBalance, 1), 1))
                    .tint(.green)
            }

            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("Monthly bill pressure")
                    Spacer()
                    Text(currencyManager.format(monthlyBills))
                        .monospacedDigit()
                }
                .font(.caption)
                .foregroundStyle(.secondary)
                ProgressView(value: min(monthlyBills / max(liquidBalance, 1), 1))
                    .tint(.orange)
            }

            if let topCategory {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Largest spending category")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(topCategory.category)
                        .font(.subheadline.weight(.semibold))
                    Text("\(currencyManager.format(topCategory.spent)) this month")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
                .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private var topMerchants: some View {
        VStack(alignment: .leading, spacing: 12) {
            InsightSectionHeader(title: "Top Merchants", icon: "bag.fill")

            if insights?.topMerchants.isEmpty != false {
                Text("No merchant data yet")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(Array((insights?.topMerchants ?? []).prefix(5).enumerated()), id: \.element.id) { index, merchant in
                    HStack {
                        Text("\(index + 1)")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(.secondary)
                            .frame(width: 22)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(merchant.payee)
                                .font(.subheadline.weight(.medium))
                            Text("\(merchant.count) transaction\(merchant.count == 1 ? "" : "s")")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(currencyManager.format(merchant.total))
                            .font(.subheadline.weight(.semibold))
                            .monospacedDigit()
                    }
                    .padding(.vertical, 3)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private var topCategories: some View {
        VStack(alignment: .leading, spacing: 12) {
            InsightSectionHeader(title: "Top Categories", icon: "chart.bar.fill")

            if insights?.topCategories.isEmpty != false {
                Text("No category data yet")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(Array((insights?.topCategories ?? []).prefix(5).enumerated()), id: \.element.id) { _, category in
                    VStack(alignment: .leading, spacing: 5) {
                        HStack {
                            Text(category.category)
                                .font(.subheadline.weight(.medium))
                            Spacer()
                            Text(currencyManager.format(category.total))
                                .font(.subheadline.weight(.semibold))
                                .monospacedDigit()
                        }
                        ProgressView(value: min(category.total / max(insights?.totalSpent ?? 1, 1), 1))
                            .tint(.orange)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private var quickFacts: some View {
        VStack(alignment: .leading, spacing: 10) {
            InsightSectionHeader(title: "Quick Facts", icon: "info.circle")
            FactRow(text: "Daily average", value: currencyManager.format(insights?.avgDaily ?? 0))
            FactRow(text: "Weekly rhythm", value: currencyManager.format((insights?.avgDaily ?? 0) * 7))
            FactRow(text: "Projected month", value: currencyManager.format(projectedMonthly))
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private func loadData() async {
        isLoading = true
        errorMessage = nil

        do {
            async let insights = SupabaseService.shared.fetchInsights()
            async let accounts = SupabaseService.shared.fetchAccounts()
            async let recurring = SupabaseService.shared.fetchRecurring()
            async let goals = SupabaseService.shared.fetchGoals()
            async let spending = SupabaseService.shared.fetchSpendingByCategory()

            self.insights = try await insights
            self.accounts = try await accounts
            self.recurring = try await recurring
            self.goals = try await goals
            self.spending = try await spending
            isLoading = false
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }
}

private struct InsightMetricCard: View {
    let title: String
    let value: String
    let subtitle: String
    let tint: Color
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: icon)
                .font(.headline)
                .foregroundStyle(tint)
                .frame(width: 34, height: 34)
                .background(tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 10, style: .continuous))

            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)

            Text(value)
                .font(.title3.weight(.bold))
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.75)

            Text(subtitle)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

private struct InsightSectionHeader: View {
    let title: String
    let icon: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundStyle(.orange)
            Text(title)
                .font(.headline.weight(.semibold))
        }
    }
}

private struct RecommendationRow: View {
    let tint: Color
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Circle()
                .fill(tint)
                .frame(width: 9, height: 9)
                .padding(.top, 5)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                Text(description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

private struct FactRow: View {
    let text: String
    let value: String

    var body: some View {
        HStack {
            Text(text)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.semibold)
                .monospacedDigit()
        }
        .font(.subheadline)
    }
}

#Preview {
    NavigationStack {
        InsightsView()
    }
    .environmentObject(CurrencyManager.shared)
}
