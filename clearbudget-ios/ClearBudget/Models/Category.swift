//
//  Category.swift
//  ClearBudget
//

import Foundation
import SwiftData

@Model
final class Category {
    @Attribute(.unique) var id: UUID
    var name: String
    var budgeted: Double
    var activity: Double
    @Attribute var createdAt: Date
    
    var group: CategoryGroup?
    var transactions: [Transaction] = []
    
    init(name: String, budgeted: Double = 0, activity: Double = 0) {
        self.id = UUID()
        self.name = name
        self.budgeted = budgeted
        self.activity = activity
        self.createdAt = Date.now
    }
    
    var available: Double {
        budgeted + activity
    }
}

@Model
final class CategoryGroup {
    @Attribute(.unique) var id: UUID
    var name: String
    var sortOrder: Int
    @Attribute var createdAt: Date
    
    var categories: [Category] = []
    
    init(name: String, sortOrder: Int = 0) {
        self.id = UUID()
        self.name = name
        self.sortOrder = sortOrder
        self.createdAt = Date.now
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
