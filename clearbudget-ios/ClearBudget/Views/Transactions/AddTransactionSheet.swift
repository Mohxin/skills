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
    
    @State private var transactionType: TransactionType = .expense
    @State private var selectedAccountId: UUID?
    @State private var selectedCategoryId: UUID?
    @State private var date = Date.now
    @State private var payee = ""
    @State private var memo = ""
    @State private var amount = ""
    @State private var cleared = false
    @State private var saving = false

    var body: some View {
        NavigationStack {
            Form {
                // Type
                Section {
                    Picker("Type", selection: $transactionType) {
                        Text("Expense").tag(TransactionType.expense)
                        Text("Income").tag(TransactionType.income)
                    }
                    .pickerStyle(.segmented)
                }
                
                // Details
                Section {
                    Picker("Account", selection: $selectedAccountId) {
                        ForEach(accounts) { account in
                            Text(account.name).tag(account.id as UUID?)
                        }
                    }
                    .pickerStyle(.menu)

                    Picker("Category", selection: $selectedCategoryId) {
                        Text("None").tag(nil as UUID?)
                        ForEach(categories) { category in
                            Text(category.name).tag(category.id as UUID?)
                        }
                    }
                    .pickerStyle(.menu)
                    
                    TextField("Payee", text: $payee)
                    TextField("Memo", text: $memo)
                    
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                }
                
                // Amount
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
                    .disabled(amount.isEmpty || selectedAccountId == nil)
                }
            }
            .onAppear {
                selectedAccountId = accounts.first?.id
            }
        }
    }

    private func save() async {
        guard let accountId = selectedAccountId,
              let amountValue = Double(amount),
              amountValue > 0 else { return }

        saving = true

        let tx = Transaction(
            date: date,
            payee: payee.isEmpty ? nil : payee,
            memo: memo.isEmpty ? nil : memo,
            amount: transactionType == .expense ? -amountValue : amountValue,
            cleared: cleared,
            transactionType: transactionType
        )

        // Find account and category
        if let account = accounts.first(where: { $0.id == accountId }) {
            tx.account = account
            account.balance += (transactionType == .expense ? -amountValue : amountValue)
        }

        if let categoryId = selectedCategoryId,
           let category = categories.first(where: { $0.id == categoryId }) {
            tx.category = category
            category.activity += (transactionType == .expense ? -amountValue : amountValue)
        }
        
        modelContext.insert(tx)
        try? modelContext.save()
        
        // Sync to Supabase
        if let accountIndex = accounts.firstIndex(where: { $0.id == accountId }) {
            let apiTx = TransactionCreateRequest(
                accountId: accountIndex + 1, // Simplified mapping
                categoryId: nil,
                date: ISO8601DateFormatter().string(from: date),
                payee: payee.isEmpty ? nil : payee,
                memo: memo.isEmpty ? nil : memo,
                amount: type == .expense ? -amountValue : amountValue,
                cleared: cleared
            )
            _ = try? await SupabaseService.shared.createTransaction(apiTx)
        }
        
        saving = false
        dismiss()
    }
}

#Preview {
    AddTransactionSheet()
        .modelContainer(for: [Account.self, Category.self], inMemory: true)
        .environmentObject(CurrencyManager.shared)
}
