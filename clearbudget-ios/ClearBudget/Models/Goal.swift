//
//  Goal.swift
//  ClearBudget
//

import Foundation
import SwiftData

@Model
final class Goal: Identifiable {
    @Attribute(.unique) var id: UUID = UUID()
    var name: String
    var targetAmount: Double
    var currentAmount: Double
    var targetDate: Date?
    var monthlyContribution: Double = 0
    var createdAt: Date = .now
    var updatedAt: Date = .now
    
    var category: Category?
    
    init(name: String, targetAmount: Double, currentAmount: Double = 0, targetDate: Date? = nil, monthlyContribution: Double = 0) {
        self.name = name
        self.targetAmount = targetAmount
        self.currentAmount = currentAmount
        self.targetDate = targetDate
        self.monthlyContribution = monthlyContribution
    }
    
    var progress: Double {
        guard targetAmount > 0 else { return 0 }
        return min(currentAmount / targetAmount, 1.0)
    }
    
    var remaining: Double {
        max(targetAmount - currentAmount, 0)
    }
    
    var isComplete: Bool {
        progress >= 1.0
    }
}
