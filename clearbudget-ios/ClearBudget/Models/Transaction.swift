//
//  Transaction.swift
//  ClearBudget
//

import Foundation
import SwiftData

@Model
final class Transaction: Identifiable {
    @Attribute(.unique) var id: UUID = UUID()
    var date: Date
    var payee: String?
    var memo: String?
    var amount: Double
    var cleared: Bool
    var transactionType: TransactionType
    var createdAt: Date = .now
    var updatedAt: Date = .now
    
    // Relationships
    var account: Account?
    var category: Category?
    
    init(date: Date = .now, payee: String? = nil, memo: String? = nil, amount: Double, cleared: Bool = false, transactionType: TransactionType = .expense) {
        self.date = date
        self.payee = payee
        self.memo = memo
        self.amount = amount
        self.cleared = cleared
        self.transactionType = transactionType
    }
}

enum TransactionType: String, Codable, CaseIterable {
    case expense
    case income
    
    var displayName: String {
        switch self {
        case .expense: return "Expense"
        case .income: return "Income"
        }
    }
}
