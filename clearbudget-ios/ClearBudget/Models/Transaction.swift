//
//  Transaction.swift
//  ClearBudget
//

import Foundation
import SwiftData

@Model
final class Transaction {
    @Attribute(.unique) var id: UUID
    var date: Date
    var payee: String?
    var memo: String?
    var amount: Double
    var cleared: Bool
    var transactionType: TransactionType
    @Attribute var createdAt: Date
    @Attribute var updatedAt: Date
    
    @Relationship var account: Account?
    @Relationship var category: Category?
    
    init(date: Date = Date.now, payee: String? = nil, memo: String? = nil, amount: Double, cleared: Bool = false, transactionType: TransactionType = .expense) {
        self.id = UUID()
        self.date = date
        self.payee = payee
        self.memo = memo
        self.amount = amount
        self.cleared = cleared
        self.transactionType = transactionType
        self.createdAt = Date.now
        self.updatedAt = Date.now
    }
}

enum TransactionType: String, Codable {
    case expense
    case income
}
