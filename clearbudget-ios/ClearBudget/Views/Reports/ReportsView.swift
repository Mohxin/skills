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

struct MonthlyTrendItem: Identifiable, Equatable {
    let id = UUID()
    let month: String
    let category: String
    let spent: Double
}

struct ReportsView: View {
    @EnvironmentObject var currencyManager: CurrencyManager
    @State private var loading = true
    @State private var spendingData: [SpendingItem] = []
    @State private var monthlyData: [MonthlyTrendItem] = []
    
    var totalSpent: Double {
        spendingData.reduce(0) { $0 + $1.spent }
    }
    
    let categoryColors: [String: Color] = [
        "Groceries": .green,
        "Dining Out": .orange,
        "Shopping": .purple,
        "Transportation": .blue,
        "Subscriptions": .pink,
    ]
    
    let monthColors: [String: Color] = [
        "Jan": Color(hex: "22c55e"),
        "Feb": Color(hex: "3b82f6"),
        "Mar": Color(hex: "f59e0b"),
        "Apr": Color(hex: "ef4444"),
        "May": Color(hex: "8b5cf6"),
        "Jun": Color(hex: "14b8a6"),
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Summary Card
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Total Spent")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text(currencyManager.format(totalSpent))
                            .font(.title2)
                            .fontWeight(.bold)
                            .monospacedDigit()
                    }
                    Spacer()
                    Image(systemName: "chart.pie.fill")
                        .font(.title)
                        .foregroundStyle(.orange)
                }
                .padding()
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                
                // Pie Chart
                VStack(alignment: .leading, spacing: 12) {
                    Text("Spending by Category")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    if loading || spendingData.isEmpty {
                        ProgressView()
                            .frame(height: 200)
                    } else {
                        Chart(spendingData) { item in
                            SectorMark(
                                angle: .value("Spent", item.spent),
                                innerRadius: .ratio(0.5),
                                angularInset: 2
                            )
                            .foregroundStyle(categoryColors[item.category, default: .orange])
                            .cornerRadius(4)
                            .annotation(position: .overlay) {
                                let pct = totalSpent > 0 ? (item.spent / totalSpent * 100) : 0
                                if pct > 8 {
                                    Text("\(Int(pct))%")
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .foregroundStyle(.white)
                                }
                            }
                        }
                        .frame(height: 220)
                        .chartLegend(.hidden)
                        
                        // Legend
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                            ForEach(spendingData) { item in
                                HStack(spacing: 8) {
                                    Circle()
                                        .fill(categoryColors[item.category, default: .orange])
                                        .frame(width: 10, height: 10)
                                    Text(item.category)
                                        .font(.caption)
                                        .foregroundStyle(.primary)
                                    Spacer()
                                    Text(currencyManager.format(item.spent))
                                        .font(.caption)
                                        .monospacedDigit()
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                
                // Budget Progress
                VStack(alignment: .leading, spacing: 12) {
                    Text("Budget Usage")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    if loading || spendingData.isEmpty {
                        ProgressView()
                            .frame(height: 150)
                    } else {
                        VStack(spacing: 10) {
                            ForEach(spendingData) { item in
                                let progress = item.budgeted > 0 ? item.spent / item.budgeted : 0
                                let pct = min(progress * 100, 100)
                                HStack(spacing: 8) {
                                    Text(item.category)
                                        .font(.subheadline)
                                        .frame(width: 100, alignment: .leading)
                                    
                                    GeometryReader { geo in
                                        ZStack(alignment: .leading) {
                                            RoundedRectangle(cornerRadius: 4)
                                                .fill(Color(.systemGray5))
                                                .frame(height: 8)
                                            RoundedRectangle(cornerRadius: 4)
                                                .fill(progress >= 1 ? .red : .orange)
                                                .frame(width: geo.size.width * pct / 100, height: 8)
                                        }
                                    }
                                    
                                    Text("\(Int(pct))%")
                                        .font(.caption)
                                        .monospacedDigit()
                                        .foregroundStyle(.secondary)
                                        .frame(width: 40, alignment: .trailing)
                                }
                            }
                        }
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                
                // Monthly Bar Chart
                VStack(alignment: .leading, spacing: 12) {
                    Text("Monthly Spending")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    if loading || monthlyData.isEmpty {
                        ProgressView()
                            .frame(height: 200)
                    } else {
                        Chart(monthlyData) { item in
                            BarMark(
                                x: .value("Month", item.month),
                                y: .value("Spent", item.spent)
                            )
                            .foregroundStyle(monthColors[item.month, default: .orange])
                            .cornerRadius(6)
                        }
                        .frame(height: 200)
                        .chartYAxis {
                            AxisMarks { value in
                                if let amount = value.as(Double.self) {
                                    AxisGridLine()
                                    AxisValueLabel {
                                        Text(currencyManager.format(amount))
                                            .font(.caption2)
                                    }
                                }
                            }
                        }
                        .chartXAxis {
                            AxisMarks { value in
                                AxisGridLine(stroke: .init(dash: [3, 3]))
                                AxisValueLabel {
                                    if let month = value.as(String.self) {
                                        Text(month)
                                            .font(.caption)
                                            .fontWeight(.medium)
                                    }
                                }
                            }
                        }
                    }
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
            // Demo data
            spendingData = [
                SpendingItem(category: "Groceries", spent: 387.42, budgeted: 500),
                SpendingItem(category: "Dining Out", spent: 189.45, budgeted: 250),
                SpendingItem(category: "Shopping", spent: 156.78, budgeted: 200),
                SpendingItem(category: "Transportation", spent: 156.80, budgeted: 200),
                SpendingItem(category: "Subscriptions", spent: 44.97, budgeted: 45),
            ]
            
            monthlyData = [
                MonthlyTrendItem(month: "Jan", category: "Total", spent: 1450),
                MonthlyTrendItem(month: "Feb", category: "Total", spent: 1320),
                MonthlyTrendItem(month: "Mar", category: "Total", spent: 1680),
                MonthlyTrendItem(month: "Apr", category: "Total", spent: 1247),
            ]
            
            loading = false
        }
    }
}

#Preview {
    NavigationStack {
        ReportsView()
    }
    .environmentObject(CurrencyManager.shared)
}
