//
//  ThemeManager.swift
//  ClearBudget
//

import SwiftUI

final class ThemeManager: ObservableObject {
    static let shared = ThemeManager()
    
    @AppStorage("isDarkMode") var isDark: Bool = false
    
    func toggle() {
        isDark.toggle()
    }
}
