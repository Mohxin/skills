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
    @State private var recurring: [APIRecurring] = []
    @State private var spending: [APISpending] = []
    @State private var forecast: APICashFlowForecast?
    
    struct DashboardOverview {
        let totalBalance: Double
        let toBeBudgeted: Double
        let totalBudgeted: Double
        let totalSpent: Double
        let available: Double
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

    private var budgetUtilization: Double {
        guard let overview, overview.totalBudgeted > 0 else { return 0 }
        return min(abs(overview.totalSpent) / overview.totalBudgeted, 1)
    }

    private var overspentCategory: APISpending? {
        spending.first { $0.available < 0 }
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

                if let forecast {
                    CashFlowForecastCard(forecast: forecast)
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
        ZStack(alignment: .leading) {
            LinearGradient(
                colors: [
                    Color(hex: "fff7ed"),
                    Color(hex: "ffedd5"),
                    Color(hex: "fed7aa")
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Circle()
                .fill(.orange.opacity(0.16))
                .frame(width: 180, height: 180)
                .offset(x: 220, y: -60)

            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 8) {
                    statusBadge
                    Text(monthTitle)
                        .font(.caption2.weight(.bold))
                        .textCase(.uppercase)
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(.white.opacity(0.72), in: Capsule())
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("Your money plan, ready at a glance.")
                        .font(.title2.weight(.black))
                        .foregroundStyle(.primary)
                        .fixedSize(horizontal: false, vertical: true)

                    Text(primaryMessage)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }

                if let overview {
                    HStack(spacing: 8) {
                        BannerMiniMetric(title: "Ready", value: currencyManager.format(overview.toBeBudgeted), tint: overview.toBeBudgeted >= 0 ? .green : .red)
                        BannerMiniMetric(title: "Available", value: currencyManager.format(overview.available), tint: overview.available >= 0 ? .green : .red)
                        BannerMiniMetric(title: "Bills", value: currencyManager.format(monthlyBills), tint: .orange)
                    }
                }

                nextMoveCard
            }
            .padding()
        }
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private var statusBadge: some View {
        let text: String
        let tint: Color

        if overspentCategory != nil {
            text = "Action needed"
            tint = .red
        } else if (overview?.toBeBudgeted ?? 0) > 0 {
            text = "Ready to assign"
            tint = .orange
        } else {
            text = "Balanced"
            tint = .green
        }

        return HStack(spacing: 6) {
            Circle()
                .fill(tint)
                .frame(width: 6, height: 6)
            Text(text)
        }
        .font(.caption2.weight(.bold))
        .textCase(.uppercase)
        .foregroundStyle(tint)
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(tint.opacity(0.12), in: Capsule())
    }

    private var primaryMessage: String {
        if let overspentCategory {
            return "\(overspentCategory.category) needs attention before the plan is balanced."
        }

        if let overview, overview.toBeBudgeted > 0 {
            return "\(currencyManager.format(overview.toBeBudgeted)) is waiting to be assigned."
        }

        return "Track the next bill, assign new money, and keep spending aligned."
    }

    private var nextMoveCard: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "sparkles")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.orange)
                .frame(width: 28, height: 28)
                .background(.orange.opacity(0.12), in: RoundedRectangle(cornerRadius: 8, style: .continuous))

            VStack(alignment: .leading, spacing: 2) {
                Text("Next move")
                    .font(.caption.weight(.semibold))
                Text(nextMoveText)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 0)
        }
        .padding(12)
        .background(.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private var nextMoveText: String {
        if overspentCategory != nil {
            return "Cover overspending first."
        }

        if (overview?.toBeBudgeted ?? 0) > 0 {
            return "Assign ready money now."
        }

        return "Review recent activity and stay on pace."
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
            async let recurring = service.fetchRecurring()
            async let spending = service.fetchSpendingByCategory()
            async let forecast = service.fetchCashFlowForecast(days: 30)
            await MainActor.run {
                self.overview = DashboardOverview(
                    totalBalance: overview.totalBalance,
                    toBeBudgeted: overview.toBeBudgeted,
                    totalBudgeted: overview.totalBudgeted,
                    totalSpent: overview.totalActivity,
                    available: overview.available
                )
            }

            let loadedRecurring = try await recurring
            let loadedSpending = try await spending
            let loadedForecast = try await forecast

            await MainActor.run {
                self.recurring = loadedRecurring
                self.spending = loadedSpending
                self.forecast = loadedForecast
                loading = false
            }
        } catch {
            print("Failed to load overview: \(error)")
            loading = false
        }
    }
}

private struct CashFlowForecastCard: View {
    @EnvironmentObject private var currencyManager: CurrencyManager

    let forecast: APICashFlowForecast

    private var tint: Color {
        switch forecast.status {
        case "risk": return .red
        case "tight": return .orange
        default: return .green
        }
    }

    private var statusTitle: String {
        switch forecast.status {
        case "risk": return "Risk"
        case "tight": return "Tight"
        default: return "Healthy"
        }
    }

    private var lowDateText: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let date = formatter.date(from: forecast.projectedLowDate) else { return forecast.projectedLowDate }
        return date.formatted(.dateTime.month(.abbreviated).day())
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("30-Day Forecast")
                        .font(.headline.weight(.semibold))
                    Text(statusDescription)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Text(statusTitle)
                    .font(.caption2.weight(.bold))
                    .textCase(.uppercase)
                    .foregroundStyle(tint)
                    .padding(.horizontal, 9)
                    .padding(.vertical, 5)
                    .background(tint.opacity(0.12), in: Capsule())
            }

            ForecastLine(points: forecast.points, tint: tint)
                .frame(height: 62)

            HStack(spacing: 10) {
                forecastMetric("Safe to spend", currencyManager.format(forecast.safeToSpend), .green)
                forecastMetric("Lowest point", currencyManager.format(forecast.projectedLowBalance), forecast.projectedLowBalance < 0 ? .red : .primary, footnote: lowDateText)
            }

            if !forecast.upcomingEvents.isEmpty {
                VStack(spacing: 8) {
                    ForEach(forecast.upcomingEvents.prefix(3)) { event in
                        HStack {
                            VStack(alignment: .leading, spacing: 1) {
                                Text(event.payee)
                                    .font(.caption.weight(.semibold))
                                    .lineLimit(1)
                                Text(event.date)
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text(currencyManager.format(event.amount))
                                .font(.caption.weight(.bold))
                                .monospacedDigit()
                                .foregroundStyle(event.amount < 0 ? .red : .green)
                        }
                    }
                }
                .padding(12)
                .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private var statusDescription: String {
        switch forecast.status {
        case "risk": return "Projected balance dips below zero before the month is done."
        case "tight": return "The plan works, but the remaining cushion is thin."
        default: return "Upcoming bills and recent spend keep a working cushion."
        }
    }

    private func forecastMetric(_ title: String, _ value: String, _ tint: Color, footnote: String? = nil) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption2.weight(.bold))
                .textCase(.uppercase)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.subheadline.weight(.bold))
                .monospacedDigit()
                .foregroundStyle(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
            if let footnote {
                Text(footnote)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

private struct ForecastLine: View {
    let points: [APICashFlowPoint]
    let tint: Color

    var body: some View {
        GeometryReader { proxy in
            let balances = points.map(\.balance)
            let minBalance = balances.min() ?? 0
            let maxBalance = balances.max() ?? 1
            let range = max(maxBalance - minBalance, 1)

            Path { path in
                for (index, point) in points.enumerated() {
                    let x = points.count > 1 ? proxy.size.width * CGFloat(index) / CGFloat(points.count - 1) : 0
                    let normalized = CGFloat((point.balance - minBalance) / range)
                    let y = proxy.size.height - normalized * proxy.size.height
                    if index == 0 {
                        path.move(to: CGPoint(x: x, y: y))
                    } else {
                        path.addLine(to: CGPoint(x: x, y: y))
                    }
                }
            }
            .stroke(tint, style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
        }
    }
}

private struct BannerMiniMetric: View {
    let title: String
    let value: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption2.weight(.bold))
                .textCase(.uppercase)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.caption.weight(.bold))
                .monospacedDigit()
                .foregroundStyle(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
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
