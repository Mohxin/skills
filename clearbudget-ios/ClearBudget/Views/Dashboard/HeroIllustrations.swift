//
//  HeroIllustrations.swift
//  ClearBudget
//

import SwiftUI

// MARK: - Dashboard Hero
struct DashboardHeroIllustration: View {
    var body: some View {
        GeometryReader { geo in
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
                ChartBars()
                
                // Trend line
                TrendLine()
                
                // Floating card
                FloatingCard()
                
                // Coins
                Coins()
            }
        }
    }
}

// MARK: - Subviews
private struct ChartBars: View {
    var body: some View {
        ForEach(0..<5) { i in
            let barW: CGFloat = geoSize.width * 0.06
            let barH: CGFloat = geoSize.height * (0.3 + Double(i) * 0.15)
            let barX: CGFloat = geoSize.width * 0.12 + CGFloat(i) * (geoSize.width * 0.08) + barW / 2
            let barY: CGFloat = geoSize.height - barH - geoSize.height * 0.1 + barH / 2
            Rectangle()
                .fill(Color.black.opacity(0.06 + Double(i) * 0.04))
                .frame(width: barW, height: barH)
                .cornerRadius(4)
                .position(x: barX, y: barY)
        }
    }
    
    @Environment(\.layoutDirection) private var layoutDirection
    var geoSize: CGSize {
        CGSize(width: 300, height: 150)
    }
}

private struct TrendLine: View {
    var body: some View {
        let w: CGFloat = 300
        let h: CGFloat = 150
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
            .position(x: 300 * 0.47, y: 150 * 0.14)
    }
}

private struct FloatingCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            RoundedRectangle(cornerRadius: 3)
                .fill(Color.gray.opacity(0.4))
                .frame(width: 80, height: 6)
            RoundedRectangle(cornerRadius: 6)
                .fill(Color.black.opacity(0.7))
                .frame(width: 140, height: 12)
            RoundedRectangle(cornerRadius: 3)
                .fill(Color.green)
                .frame(width: 60, height: 6)
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(0.9))
        )
        .position(x: 300 * 0.72, y: 150 * 0.35)
    }
}

private struct Coins: View {
    var body: some View {
        coinView(size: 24, opacity: 0.3, x: 300 * 0.65, y: 150 * 0.75)
        coinView(size: 19, opacity: 0.2, x: 300 * 0.72, y: 150 * 0.80)
        coinView(size: 14, opacity: 0.15, x: 300 * 0.60, y: 150 * 0.85)
    }
    
    func coinView(size: CGFloat, opacity: Double, x: CGFloat, y: CGFloat) -> some View {
        ZStack {
            Circle()
                .fill(Color.amber.opacity(opacity))
                .frame(width: size)
            Text("$")
                .font(.system(size: size * 0.6))
                .fontWeight(.bold)
                .foregroundStyle(Color.amber.opacity(opacity + 0.3))
        }
        .position(x: x, y: y)
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
        .frame(height: 150)
}
