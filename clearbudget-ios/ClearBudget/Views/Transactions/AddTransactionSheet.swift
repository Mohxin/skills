//
//  AddTransactionSheet.swift
//  ClearBudget
//

import SwiftUI
import SwiftData

struct AddTransactionSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Account.name) private var accounts: [Account]
    @Query(sort: \Category.name) private var categories: [Category]
    @EnvironmentObject var currencyManager: CurrencyManager

    @State private var transactionTypeRaw: String = "expense"
    @State private var selectedAccountIndex: Int = 0
    @State private var selectedCategoryIndex: Int = 0
    @State private var date = Date.now
    @State private var payee = ""
    @State private var memo = ""
    @State private var amount = ""
    @State private var cleared = false
    @State private var saving = false
    
    var transactionType: TransactionType {
        TransactionType(rawValue: transactionTypeRaw) ?? .expense
    }
    
    var categoryNames: [String] {
        ["None"] + categories.map(\.name)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Picker("Type", selection: $transactionTypeRaw) {
                        Text("Expense").tag("expense")
                        Text("Income").tag("income")
                    }
                    .pickerStyle(.segmented)
                }

                Section {
                    Picker("Account", selection: $selectedAccountIndex) {
                        ForEach(Array(accounts.enumerated()), id: \.offset) { index, account in
                            Text(account.name).tag(index)
                        }
                    }

                    Picker("Category", selection: $selectedCategoryIndex) {
                        ForEach(Array(categoryNames.enumerated()), id: \.offset) { index, name in
                            Text(name).tag(index)
                        }
                    }

                    TextField("Payee", text: $payee)
                    TextField("Memo", text: $memo)
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                }

                Section("Amount") {
                    TextField("0.00", text: $amount)
                        .keyboardType(.decimalPad)
                        .font(.title2)
                        .fontWeight(.bold)
                        .monospacedDigit()
                }
            }
            .navigationTitle(transactionType == .expense ? "New Expense" : "New Income")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task { await save() }
                    }
                    .disabled(amount.isEmpty || accounts.isEmpty)
                }
            }
        }
    }

    private func save() async {
        guard let amountValue = Double(amount),
              amountValue > 0,
              !accounts.isEmpty,
              selectedAccountIndex < accounts.count else { return }

        saving = true

        let account = accounts[selectedAccountIndex]
        let category: Category? = selectedCategoryIndex > 0 && selectedCategoryIndex <= categories.count
            ? categories[selectedCategoryIndex - 1]
            : nil

        let tx = Transaction(
            date: date,
            payee: payee.isEmpty ? nil : payee,
            memo: memo.isEmpty ? nil : memo,
            amount: transactionType == .expense ? -amountValue : amountValue,
            cleared: cleared,
            transactionType: transactionType
        )

        tx.account = account
        account.balance += (transactionType == .expense ? -amountValue : amountValue)

        if let category {
            tx.category = category
            category.activity += (transactionType == .expense ? -amountValue : amountValue)
        }

        modelContext.insert(tx)
        try? modelContext.save()

        saving = false
        dismiss()
    }
}

#Preview {
    AddTransactionSheet()
        .modelContainer(for: [Account.self, Category.self], inMemory: true)
        .environmentObject(CurrencyManager.shared)
}
