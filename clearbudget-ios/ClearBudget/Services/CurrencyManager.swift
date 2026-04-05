//
//  CurrencyManager.swift
//  ClearBudget
//

import SwiftUI

struct CurrencyInfo: Identifiable, Hashable {
    let id = UUID()
    let code: String
    let symbol: String
    let name: String
    let locale: String
}

final class CurrencyManager: ObservableObject {
    static let shared = CurrencyManager()
    
    static let currencies: [CurrencyInfo] = [
        CurrencyInfo(code: "USD", symbol: "$", name: "US Dollar", locale: "en_US"),
        CurrencyInfo(code: "EUR", symbol: "€", name: "Euro", locale: "de_DE"),
        CurrencyInfo(code: "GBP", symbol: "£", name: "British Pound", locale: "en_GB"),
        CurrencyInfo(code: "SEK", symbol: "kr", name: "Swedish Krona", locale: "sv_SE"),
        CurrencyInfo(code: "NOK", symbol: "kr", name: "Norwegian Krone", locale: "nb_NO"),
        CurrencyInfo(code: "DKK", symbol: "kr", name: "Danish Krone", locale: "da_DK"),
        CurrencyInfo(code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja_JP"),
        CurrencyInfo(code: "CAD", symbol: "CA$", name: "Canadian Dollar", locale: "en_CA"),
        CurrencyInfo(code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en_AU"),
        CurrencyInfo(code: "CHF", symbol: "CHF", name: "Swiss Franc", locale: "de_CH"),
    ]
    
    @AppStorage("selectedCurrency") var selectedCurrencyCode: String = "USD"
    
    var current: CurrencyInfo {
        Self.currencies.first { $0.code == selectedCurrencyCode } ?? Self.currencies[0]
    }
    
    func format(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = current.code
        formatter.maximumFractionDigits = 2
        return formatter.string(from: NSNumber(value: amount)) ?? "\(current.symbol)\(String(format: "%.2f", amount))"
    }
    
    func formatSigned(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = current.code
        formatter.maximumFractionDigits = 2
        if amount >= 0 {
            return "+" + (formatter.string(from: NSNumber(value: amount)) ?? "\(current.symbol)\(String(format: "%.2f", amount))")
        }
        return formatter.string(from: NSNumber(value: amount)) ?? "-\(current.symbol)\(String(format: "%.2f", abs(amount)))"
    }
}
