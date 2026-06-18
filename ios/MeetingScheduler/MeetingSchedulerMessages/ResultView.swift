//
//  ResultView.swift
//  
//
//  Created by Clely Voyena Fernandes on 3/7/26.
//

import SwiftUI

struct ResultView: View {
    
    let result: NegotiationResult
    let meetingTitle: String
    let onDismiss: () -> Void
    
    var body: some View {
        VStack(spacing: 24) {
            
            // Status Icon
            VStack(spacing: 12) {
                Image(systemName: statusIcon)
                    .font(.system(size: 48))
                    .foregroundColor(statusColor)
                
                Text(statusTitle)
                    .font(.title3)
                    .fontWeight(.bold)
                
                Text(statusSubtitle)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 32)
            
            // Agreed Slot
            if let slot = result.agreed_slot {
                VStack(spacing: 8) {
                    Text(meetingTitle)
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text(formatSlot(slot))
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    Text(
                        "Completed in \(result.rounds_completed) round(s)"
                    )
                    .font(.caption)
                    .foregroundColor(.secondary)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
                .padding(.horizontal, 24)
            }
            
            Spacer()
            
            // Action Buttons
            VStack(spacing: 12) {
                if result.agreed_slot != nil {
                    Button(action: confirmMeeting) {
                        Text("Confirm Meeting")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                    .padding(.horizontal, 24)
                }
                
                Button(action: onDismiss) {
                    Text(
                        result.agreed_slot != nil ?
                        "Decline" : "Close"
                    )
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(.systemGray5))
                    .foregroundColor(.primary)
                    .cornerRadius(12)
                }
                .padding(.horizontal, 24)
            }
            .padding(.bottom, 32)
        }
    }
    
    private var statusIcon: String {
        switch result.status {
        case "CONSENSUS": return "checkmark.circle.fill"
        case "PARTIAL_CONSENSUS": return "checkmark.circle"
        case "NO_CONSENSUS": return "xmark.circle.fill"
        default: return "questionmark.circle"
        }
    }
    
    private var statusColor: Color {
        switch result.status {
        case "CONSENSUS": return .green
        case "PARTIAL_CONSENSUS": return .orange
        case "NO_CONSENSUS": return .red
        default: return .gray
        }
    }
    
    private var statusTitle: String {
        switch result.status {
        case "CONSENSUS": return "Time Found!"
        case "PARTIAL_CONSENSUS": return "Best Time Found"
        case "NO_CONSENSUS": return "No Time Available"
        default: return "Unknown Result"
        }
    }
    
    private var statusSubtitle: String {
        switch result.status {
        case "CONSENSUS":
            return "All agents agreed on a time"
        case "PARTIAL_CONSENSUS":
            return "Best available time found"
        case "NO_CONSENSUS":
            return "No common time found in this window"
        default:
            return ""
        }
    }
    
    private func formatSlot(_ slot: AgreedSlot) -> String {
        let formatter = ISO8601DateFormatter()
        let displayFormatter = DateFormatter()
        displayFormatter.dateFormat =
            "EEEE, MMM d · h:mm a"
        
        if let date = formatter.date(from: slot.start) {
            return displayFormatter.string(from: date)
        }
        return slot.start
    }
    
    private func confirmMeeting() {
        guard let slot = result.agreed_slot else { return }
        
        let formatter = ISO8601DateFormatter()
        guard
            let startDate = formatter.date(from: slot.start),
            let endDate = formatter.date(from: slot.end)
        else { return }
        
        CalendarService.shared.createEvent(
            title: meetingTitle,
            startDate: startDate,
            endDate: endDate
        ) { success in
            DispatchQueue.main.async {
                if success {
                    print("✅ Event created in calendar")
                } else {
                    print("❌ Failed to create event")
                }
                onDismiss()
            }
        }
    }
}
