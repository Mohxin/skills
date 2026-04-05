//
//  GoalsView.swift
//  ClearBudget
//

import SwiftUI
import SwiftData

struct GoalsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Goal.targetDate, order: .forward) private var goals: [Goal]
    @EnvironmentObject var currencyManager: CurrencyManager
    @State private var showAddGoal = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                if goals.isEmpty {
                    ContentUnavailableView(
                        "No goals yet",
                        systemImage: "target",
                        description: Text("Create your first savings goal")
                    )
                    .padding(.top, 40)
                } else {
                    ForEach(goals) { goal in
                        GoalCard(goal: goal)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 24)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Goals")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showAddGoal = true
                } label: {
                    Image(systemName: "plus")
                        .foregroundStyle(.orange)
                }
            }
        }
        .sheet(isPresented: $showAddGoal) {
            AddGoalSheet()
        }
    }
}

// MARK: - Goal Card
private struct GoalCard: View {
    let goal: Goal
    @EnvironmentObject var currencyManager: CurrencyManager
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(goal.name)
                        .font(.headline)
                        .fontWeight(.semibold)
                    if let targetDate = goal.targetDate {
                        Text("Target: \(targetDate.formatted(date: .abbreviated, time: .omitted))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                
                Spacer()
                
                if goal.isComplete {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                        .font(.title3)
                }
            }
            
            // Progress
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("\(Int(goal.progress * 100))%")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(goal.isComplete ? .green : .orange)
                    Spacer()
                    Text(currencyManager.format(goal.remaining) + " remaining")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                ProgressView(value: goal.progress)
                    .tint(goal.isComplete ? .green : .orange)
            }
            
            // Amounts
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Saved")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(currencyManager.format(goal.currentAmount))
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundStyle(.green)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Target")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(currencyManager.format(goal.targetAmount))
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Add Goal Sheet
struct AddGoalSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Query private var categories: [Category]
    
    @State private var name = ""
    @State private var targetAmount = ""
    @State private var currentAmount = ""
    @State private var targetDate = Date.now.addingTimeInterval(365 * 24 * 60 * 60)
    @State private var monthlyContribution = ""
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Goal Details") {
                    TextField("Goal name", text: $name)
                    TextField("Target amount", text: $targetAmount)
                        .keyboardType(.decimalPad)
                    TextField("Current amount", text: $currentAmount)
                        .keyboardType(.decimalPad)
                    DatePicker("Target date", selection: $targetDate, displayedComponents: .date)
                }
            }
            .navigationTitle("New Goal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        save()
                    }
                    .disabled(name.isEmpty || targetAmount.isEmpty)
                }
            }
        }
    }
    
    private func save() {
        let goal = Goal(
            name: name,
            targetAmount: Double(targetAmount) ?? 0,
            currentAmount: Double(currentAmount) ?? 0,
            targetDate: targetDate,
            monthlyContribution: Double(monthlyContribution) ?? 0
        )
        modelContext.insert(goal)
        try? modelContext.save()
        dismiss()
    }
}

#Preview {
    NavigationStack {
        GoalsView()
    }
    .modelContainer(for: [Goal.self], inMemory: true)
    .environmentObject(CurrencyManager.shared)
}
