//
//  HeroIllustrations.swift
//  ClearBudget
//

import SwiftUI

// MARK: - Dashboard Hero
struct DashboardHeroIllustration: View {
    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            
            ZStack {
                // Background gradient
                LinearGradient(
                    colors: [
                        Color(hex: "fef3e2"),
                        Color(hex: "fce8c5"),
                        Color(hex: "f9cc8a")
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                
                // Chart bars
                ForEach(0..<5) { i in
                    let barX = w * 0.12 + CGFloat(i) * (w * 0.08)
                    let barH = h * (0.3 + Double(i) * 0.15)
                    let barY = h - barH - h * 0.1
                    Rectangle()
                        .fill(Color.black.opacity(0.06 + Double(i) * 0.04))
                        .frame(width: w * 0.06, height: barH)
                        .cornerRadius(4)
                        .position(x: barX + w * 0.03, y: barY + barH / 2)
                }
                
                // Trend line
                Path { path in
                    path.move(to: CGPoint(x: w * 0.15, y: h * 0.58))
                    path.addLine(to: CGPoint(x: w * 0.23, y: h * 0.45))
                    path.addLine(to: CGPoint(x: w * 0.31, y: h * 0.32))
                    path.addLine(to: CGPoint(x: w * 0.39, y: h * 0.22))
                    path.addLine(to: CGPoint(x: w * 0.47, y: h * 0.14))
                }
                .stroke(Color.orange, lineWidth: 3)
                
                Circle()
                    .fill(Color.orange)
                    .frame(width: 10)
                    .position(x: w * 0.47, y: h * 0.14)
                
                // Floating card
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white.opacity(0.9))
                    .frame(width: w * 0.35, height: h * 0.3)
                    .position(x: w * 0.72, y: h * 0.35)
                
                // Checkmark
                Image(systemName: "checkmark.circle.fill")
                    .font(.title2)
                    .foregroundStyle(.green)
                    .position(x: w * 0.82, y: h * 0.4)
                
                // Coins
                ForEach(0..<3) { i in
                    Circle()
                        .fill(Color.amber.opacity(0.3 - Double(i) * 0.08))
                        .frame(width: 24 - CGFloat(i) * 5)
                        .position(
                            x: w * (0.65 + Double(i) * 0.07),
                            y: h * (0.75 + Double(i) * 0.05)
                        )
                    Text("$")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundStyle(Color.amber.opacity(0.6 - Double(i) * 0.15))
                        .position(
                            x: w * (0.65 + Double(i) * 0.07),
                            y: h * (0.75 + Double(i) * 0.05) + 1
                        )
                }
            }
        }
    }
}

// MARK: - Color helper
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: .alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6:
            (r, g, b, a) = (int >> 16, int >> 8 & 0xFF, int & 0xFF, 255)
        case 8:
            (r, g, b, a) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (r, g, b, a) = (255, 255, 255, 255)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

#Preview {
    DashboardHeroIllustration()
        .frame(height: 200)
}
