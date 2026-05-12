//
//  PlannerView.swift
//  ClearBudget
//

import SwiftUI

struct PlannerView: View {
    @EnvironmentObject private var currencyManager: CurrencyManager

    @State private var isLoading = true
    @State private var overview: APIOverview?
    @State private var recurring: [APIRecurring] = []
    @State private var goals: [APIGoal] = []
    @State private var spending: [APISpending] = []
    @State private var errorMessage: String?

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

    private var safeToSpend: Double {
        max((overview?.available ?? 0) - monthlyBills * 0.5, 0)
    }

    private var runwayMonths: Double {
        guard monthlyBills > 0 else { return 0 }
        return (overview?.totalBalance ?? 0) / monthlyBills
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
                    ContentUnavailableView("Planner unavailable", systemImage: "exclamationmark.triangle", description: Text(errorMessage))
                        .padding(.vertical, 32)
                } else {
                    metricsGrid
                    recommendations
                    planSnapshot
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 24)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Planner")
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    private var hero: some View {
        ZStack(alignment: .leading) {
            LinearGradient(
                colors: [Color(hex: "fff7ed"), Color(hex: "fed7aa"), Color(hex: "f97316").opacity(0.75)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(alignment: .leading, spacing: 10) {
                Text("Planning Lab")
                    .font(.caption2.weight(.bold))
                    .textCase(.uppercase)
                    .foregroundStyle(.orange)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(.white.opacity(0.78), in: Capsule())

                Text("Turn the budget into next-month decisions.")
                    .font(.title2.weight(.black))
                    .foregroundStyle(.primary)
                    .fixedSize(horizontal: false, vertical: true)

                Text("See safe-to-spend, bill pressure, goal gaps, and the next move in one place.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding()
        }
        .frame(maxWidth: .infinity, minHeight: 170, alignment: .leading)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private var metricsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            PlannerMetricCard(title: "Safe to Spend", value: currencyManager.format(safeToSpend), subtitle: "After holding bill cushion", tint: safeToSpend > 0 ? .green : .orange, icon: "checkmark.shield")
            PlannerMetricCard(title: "Monthly Bills", value: currencyManager.format(monthlyBills), subtitle: "\(recurring.filter(\.enabled).count) active payments", tint: .blue, icon: "calendar.badge.clock")
            PlannerMetricCard(title: "Runway", value: String(format: "%.1f mo", runwayMonths), subtitle: "Balance vs fixed bills", tint: runwayMonths >= 3 ? .green : .orange, icon: "fuelpump")
            PlannerMetricCard(title: "Goal Gap", value: currencyManager.format(goalGap), subtitle: "Remaining target money", tint: goalGap > 0 ? .orange : .green, icon: "target")
        }
    }

    private var recommendations: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Recommended Next Moves", icon: "sparkles")

            let ready = overview?.toBeBudgeted ?? 0
            if ready > 0 {
                RecommendationRow(tint: .orange, title: "Assign ready money", description: "\(currencyManager.format(ready)) is still waiting for a job.")
            }

            if let overspent = spending.first(where: { $0.available < 0 }) {
                RecommendationRow(tint: .red, title: "Cover overspending", description: "\(overspent.category) needs \(currencyManager.format(abs(overspent.available))).")
            }

            if goalGap > 0 {
                RecommendationRow(tint: .green, title: "Fund goal momentum", description: "\(currencyManager.format(goalGap)) remains across active goals.")
            }

            RecommendationRow(tint: .blue, title: "Review committed bills", description: "\(currencyManager.format(monthlyBills)) is committed monthly before flexible spending.")
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private var planSnapshot: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionHeader(title: "Plan Snapshot", icon: "chart.line.uptrend.xyaxis")

            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("Bills vs balance")
                    Spacer()
                    Text("\(currencyManager.format(monthlyBills)) / \(currencyManager.format(overview?.totalBalance ?? 0))")
                        .monospacedDigit()
                }
                .font(.caption)
                .foregroundStyle(.secondary)

                ProgressView(value: min(monthlyBills / max(overview?.totalBalance ?? 1, 1), 1))
                    .tint(.orange)
            }

            if let topCategory {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Largest spending category")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(topCategory.category)
                        .font(.subheadline.weight(.semibold))
                    Text("\(currencyManager.format(topCategory.spent)) spent against \(currencyManager.format(topCategory.budgeted)) budgeted")
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

    private func loadData() async {
        isLoading = true
        errorMessage = nil

        do {
            async let overview = SupabaseService.shared.fetchOverview()
            async let recurring = SupabaseService.shared.fetchRecurring()
            async let goals = SupabaseService.shared.fetchGoals()
            async let spending = SupabaseService.shared.fetchSpendingByCategory()

            self.overview = try await overview
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

private struct PlannerMetricCard: View {
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

private struct SectionHeader: View {
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

#Preview {
    NavigationStack {
        PlannerView()
    }
    .environmentObject(CurrencyManager.shared)
}
