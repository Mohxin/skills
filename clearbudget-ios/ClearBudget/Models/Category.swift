//
//  Category.swift
//  ClearBudget
//

import Foundation
import SwiftData

@Model
final class Category: Identifiable {
    @Attribute(.unique) var id: UUID = UUID()
    var name: String
    var budgeted: Double
    var activity: Double
    var createdAt: Date = .now
    
    // Relationships
    var group: CategoryGroup?
    var transactions: [Transaction] = []
    
    init(name: String, budgeted: Double = 0, activity: Double = 0) {
        self.name = name
        self.budgeted = budgeted
        self.activity = activity
    }
    
    var available: Double {
        budgeted + activity
    }
}

@Model
final class CategoryGroup: Identifiable {
    @Attribute(.unique) var id: UUID = UUID()
    var name: String
    var sortOrder: Int = 0
    var createdAt: Date = .now
    
    var categories: [Category] = []
    
    init(name: String, sortOrder: Int = 0) {
        self.name = name
        self.sortOrder = sortOrder
    }
    
    var totalBudgeted: Double {
        categories.reduce(0) { $0 + $1.budgeted }
    }
    
    var totalActivity: Double {
        categories.reduce(0) { $0 + $1.activity }
    }
    
    var totalAvailable: Double {
        totalBudgeted + totalActivity
    }
}
