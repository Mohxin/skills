//
//  BudgetView.swift
//  ClearBudget
//

import SwiftUI
import SwiftData

struct BudgetView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \CategoryGroup.sortOrder) private var groups: [CategoryGroup]
    @EnvironmentObject var currencyManager: CurrencyManager
    @State private var editingCategory: Category?
    @State private var editAmount: String = ""
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                ForEach(groups) { group in
                    CategoryGroupCard(
                        group: group,
                        editingCategory: editingCategory,
                        editAmount: editAmount,
                        onStartEdit: startEditing,
                        onSave: saveBudget
                    )
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 24)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Budget")
    }
    
    private func startEditing(_ category: Category, amount: String) {
        editingCategory = category
        editAmount = amount
    }
    
    private func saveBudget() {
        guard let category = editingCategory,
              let amount = Double(editAmount) else {
            editingCategory = nil
            return
        }
        category.budgeted = amount
        editingCategory = nil
        // Local save only - cloud sync requires proper API ID mapping
    }
}

// MARK: - Category Group Card
private struct CategoryGroupCard: View {
    let group: CategoryGroup
    let editingCategory: Category?
    let editAmount: String
    let onStartEdit: (Category, String) -> Void
    let onSave: () -> Void
    @EnvironmentObject var currencyManager: CurrencyManager
    @State private var isExpanded = true
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    isExpanded.toggle()
                }
            } label: {
                HStack {
                    Text(group.name)
                        .font(.headline)
                        .fontWeight(.semibold)
                    Spacer()
                    Text(currencyManager.format(group.totalBudgeted))
                        .font(.subheadline)
                        .monospacedDigit()
                        .foregroundStyle(.secondary)
                    Text(currencyManager.format(group.totalAvailable))
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .monospacedDigit()
                        .foregroundStyle(group.totalAvailable >= 0 ? .green : .red)
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .rotationEffect(.degrees(isExpanded ? 90 : 0))
                        .foregroundStyle(.tertiary)
                }
                .padding(.horizontal)
                .padding(.vertical, 12)
            }
            .buttonStyle(.plain)
            
            if isExpanded {
                // Column headers
                HStack {
                    Text("Category")
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundStyle(.tertiary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text("Budgeted")
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundStyle(.tertiary)
                        .frame(width: 80, alignment: .trailing)
                    Text("Activity")
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundStyle(.tertiary)
                        .frame(width: 80, alignment: .trailing)
                    Text("Available")
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundStyle(.tertiary)
                        .frame(width: 80, alignment: .trailing)
                }
                .padding(.horizontal)
                .padding(.bottom, 8)
                .background(Color(.secondarySystemGroupedBackground))
                
                // Categories
                ForEach(group.categories) { category in
                    CategoryRow(
                        category: category,
                        isEditing: editingCategory?.id == category.id,
                        editAmount: editAmount,
                        onStartEdit: { onStartEdit(category, String(category.budgeted)) },
                        onSave: onSave
                    )
                }
            }
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Category Row
private struct CategoryRow: View {
    let category: Category
    let isEditing: Bool
    let editAmount: String
    let onStartEdit: () -> Void
    let onSave: () -> Void
    @EnvironmentObject var currencyManager: CurrencyManager
    
    private var progress: Double {
        guard category.budgeted > 0 else { return 0 }
        return min(abs(category.activity) / category.budgeted, 1.0)
    }
    
    var body: some View {
        VStack(spacing: 6) {
            HStack {
                Text(category.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                if isEditing {
                    TextField("Amount", text: .constant(editAmount))
                        .keyboardType(.decimalPad)
                        .font(.subheadline)
                        .monospacedDigit()
                        .multilineTextAlignment(.trailing)
                        .frame(width: 80)
                        .onSubmit { onSave() }
                } else {
                    Text(currencyManager.format(category.budgeted))
                        .font(.subheadline)
                        .monospacedDigit()
                        .foregroundStyle(.secondary)
                        .frame(width: 80, alignment: .trailing)
                        .onTapGesture { onStartEdit() }
                }
                
                Text(currencyManager.format(category.activity))
                    .font(.subheadline)
                    .monospacedDigit()
                    .foregroundStyle(.red)
                    .frame(width: 80, alignment: .trailing)
                
                Text(currencyManager.format(category.available))
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .monospacedDigit()
                    .foregroundStyle(category.available >= 0 ? .green : .red)
                    .frame(width: 80, alignment: .trailing)
            }
            
            // Progress bar
            ProgressView(value: progress)
                .tint(category.available < 0 ? .red : .orange)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
    }
}

#Preview {
    NavigationStack {
        BudgetView()
    }
    .modelContainer(for: [Category.self, CategoryGroup.self], inMemory: true)
    .environmentObject(CurrencyManager.shared)
}
