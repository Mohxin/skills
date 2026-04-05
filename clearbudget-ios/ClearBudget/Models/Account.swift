//
//  Account.swift
//  ClearBudget
//

import Foundation
import SwiftData

@Model
final class Account {
    @Attribute(.unique) var id: UUID
    var name: String
    var accountType: String
    var balance: Double
    @Attribute var createdAt: Date
    @Attribute var updatedAt: Date
    
    @Relationship(deleteRule: .cascade, inverse: \Transaction.account)
    var transactions: [Transaction] = []
    
    init(name: String, accountType: String, balance: Double) {
        self.id = UUID()
        self.name = name
        self.accountType = accountType
        self.balance = balance
        self.createdAt = Date.now
        self.updatedAt = Date.now
    }
    
    var typeDisplay: String {
        switch accountType {
        case "checking": return "Checking"
        case "savings": return "Savings"
        case "creditCard": return "Credit Card"
        case "cash": return "Cash"
        default: return accountType
        }
    }
    
    var typeIcon: String {
        switch accountType {
        case "checking", "creditCard": return "creditcard"
        case "savings": return "banknote"
        case "cash": return "dollarsign.circle"
        default: return "wallet.pass"
        }
    }
    
    var typeColor: String {
        switch accountType {
        case "checking": return "blue"
        case "savings": return "green"
        case "creditCard": return "purple"
        case "cash": return "orange"
        default: return "gray"
        }
    }
}
