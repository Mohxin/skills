//
//  SupabaseService.swift
//  ClearBudget
//

import Foundation
import SwiftData

// MARK: - Configuration
enum SupabaseConfig {
    static let url = "https://jzzkkavjijfadpzniaci.supabase.co"
    static let anonKey = "sb_publishable_43RyjvUQoKLHILyNmExNZw_WVuV8fXF"
}

// MARK: - API Response Types
struct APIAccount: Codable, Identifiable {
    let id: Int
    let name: String
    let type: String
    let balance: Double
    let createdAt: String?
    let updatedAt: String?
}

struct APICategory: Codable, Identifiable {
    let id: Int
    let categoryGroupId: Int?
    let name: String
    let budgeted: Double
    let activity: Double
    
    enum CodingKeys: String, CodingKey {
        case id
        case categoryGroupId = "category_group_id"
        case name, budgeted, activity
    }
}

struct APITransaction: Codable, Identifiable {
    let id: Int
    let accountId: Int?
    let categoryId: Int?
    let date: String
    let payee: String?
    let memo: String?
    let amount: Double
    let cleared: Bool
    let accountName: String?
    let categoryName: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case accountId = "account_id"
        case categoryId = "category_id"
        case date, payee, memo, amount, cleared
        case accountName = "account_name"
        case categoryName = "category_name"
    }
}

struct APIOverview: Codable {
    let totalBalance: Double
    let totalBudgeted: Double
    let totalActivity: Double
    let toBeBudgeted: Double
    let available: Double
    
    enum CodingKeys: String, CodingKey {
        case totalBalance = "total_balance"
        case totalBudgeted = "total_budgeted"
        case totalActivity = "total_activity"
        case toBeBudgeted = "to_be_budgeted"
        case available
    }
}

// MARK: - Service
@MainActor
final class SupabaseService: ObservableObject {
    static let shared = SupabaseService()
    
    private let baseURL = SupabaseConfig.url
    private let headers: [String: String]
    
    init() {
        self.headers = [
            "apikey": SupabaseConfig.anonKey,
            "Authorization": "Bearer \(SupabaseConfig.anonKey)",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        ]
    }
    
    // MARK: - Fetch
    func fetchAccounts() async throws -> [APIAccount] {
        try await fetch(path: "/accounts")
    }
    
    func fetchCategories() async throws -> [APICategory] {
        try await fetch(path: "/categories")
    }
    
    func fetchCategoryGroups() async throws -> [APICategoryGroup] {
        try await fetch(path: "/categories/groups")
    }
    
    func fetchTransactions() async throws -> [APITransaction] {
        try await fetch(path: "/transactions")
    }
    
    func fetchOverview() async throws -> APIOverview {
        try await fetch(path: "/reports/overview")
    }
    
    func fetchRecentTransactions(limit: Int = 5) async throws -> [APITransaction] {
        try await fetch(path: "/reports/recent-transactions?limit=\(limit)")
    }
    
    func fetchSpendingByCategory() async throws -> [APISpending] {
        try await fetch(path: "/reports/spending-by-category")
    }
    
    // MARK: - Create
    func createTransaction(_ tx: TransactionCreateRequest) async throws -> APITransaction {
        try await post(path: "/transactions", body: tx)
    }
    
    func createAccount(_ acc: AccountCreateRequest) async throws -> APIAccount {
        try await post(path: "/accounts", body: acc)
    }
    
    // MARK: - Update
    func updateTransaction(_ id: Int, _ tx: TransactionUpdateRequest) async throws -> APITransaction {
        try await put(path: "/transactions?id=\(id)", body: tx)
    }
    
    func deleteTransaction(_ id: Int) async throws {
        try await delete(path: "/transactions?id=\(id)")
    }
    
    func updateCategoryBudget(_ id: Int, budgeted: Double) async throws -> APICategory {
        try await put(path: "/categories/\(id)/budget", body: ["budgeted": budgeted])
    }
    
    // MARK: - Private
    private func fetch<T: Decodable>(path: String) async throws -> T {
        let url = URL(string: "\(baseURL)/api\(path)")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        headers.forEach { request.setValue($0.value, forHTTPHeaderField: $0.key) }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw APIError.requestFailed
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
    
    private func post<T: Codable>(path: String, body: Codable) async throws -> T {
        try await request(method: "POST", path: path, body: body)
    }
    
    private func put<T: Codable>(path: String, body: Codable) async throws -> T {
        try await request(method: "PUT", path: path, body: body)
    }
    
    private func delete(path: String) async throws {
        let url = URL(string: "\(baseURL)/api\(path)")!
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        headers.forEach { request.setValue($0.value, forHTTPHeaderField: $0.key) }
        
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw APIError.requestFailed
        }
    }
    
    private func request<T: Decodable>(method: String, path: String, body: Codable) async throws -> T {
        let url = URL(string: "\(baseURL)/api\(path)")!
        var request = URLRequest(url: url)
        request.httpMethod = method
        headers.forEach { request.setValue($0.value, forHTTPHeaderField: $0.key) }
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode < 300 else {
            throw APIError.requestFailed
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
}

// MARK: - Request Types
struct TransactionCreateRequest: Codable {
    let accountId: Int
    let categoryId: Int?
    let date: String
    let payee: String?
    let memo: String?
    let amount: Double
    let cleared: Bool
    
    enum CodingKeys: String, CodingKey {
        case accountId = "account_id"
        case categoryId = "category_id"
        case date, payee, memo, amount, cleared
    }
}

struct TransactionUpdateRequest: Codable {
    let accountId: Int
    let categoryId: Int?
    let date: String
    let payee: String?
    let memo: String?
    let amount: Double
    let cleared: Bool
    
    enum CodingKeys: String, CodingKey {
        case accountId = "account_id"
        case categoryId = "category_id"
        case date, payee, memo, amount, cleared
    }
}

struct AccountCreateRequest: Codable {
    let name: String
    let type: String
    let balance: Double
}

struct APICategoryGroup: Codable, Identifiable {
    let id: Int
    let name: String
    let categories: [APICategory]
}

struct APISpending: Codable, Identifiable {
    let id = UUID()
    let category: String
    let groupName: String?
    let spent: Double
    let budgeted: Double
    let available: Double
    
    enum CodingKeys: String, CodingKey {
        case category, groupName = "group_name", spent, budgeted, available
    }
}

enum APIError: Error {
    case requestFailed
    case decodingFailed
}
