//
//  Goal.swift
//  ClearBudget
//

import Foundation
import SwiftData

@Model
final class Goal {
    @Attribute(.unique) var id: UUID
    var name: String
    var targetAmount: Double
    var currentAmount: Double
    var targetDate: Date?
    var monthlyContribution: Double
    @Attribute var createdAt: Date
    @Attribute var updatedAt: Date
    
    var category: Category?
    
    init(name: String, targetAmount: Double, currentAmount: Double = 0, targetDate: Date? = nil, monthlyContribution: Double = 0) {
        self.id = UUID()
        self.name = name
        self.targetAmount = targetAmount
        self.currentAmount = currentAmount
        self.targetDate = targetDate
        self.monthlyContribution = monthlyContribution
        self.createdAt = Date.now
        self.updatedAt = Date.now
    }
    
    var progress: Double {
        guard targetAmount > 0 else { return 0 }
        return Swift.min(currentAmount / targetAmount, 1.0)
    }
    
    var remaining: Double {
        Swift.max(targetAmount - currentAmount, 0)
    }
    
    var isComplete: Bool {
        progress >= 1.0
    }
}
