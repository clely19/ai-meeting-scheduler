//
//  MainSchedulingView.swift
//  MeetingSchedulerMessages
//
//  Created by Clely Voyena Fernandes on 2/25/26.
//

import SwiftUI

struct MainSchedulingView: View {
    
    @State private var meetingTitle = ""
    @State private var selectedDuration = 60
    @State private var inviteeUUIDs = ""
    @State private var isNegotiating = false
    @State private var negotiationResult: NegotiationResult? = nil
    @State private var errorMessage = ""
    @State private var showResult = false
    
    let durations = [30, 60, 90]
    
    let displayName = UserDefaults.standard
        .string(forKey: "display_name") ?? "User"
    let userID = UserDefaults.standard
        .string(forKey: "user_id") ?? ""
    let schedulingStyle = UserDefaults.standard
        .string(forKey: "scheduling_style") ?? "balanced"
    
    var body: some View {
        VStack(spacing: 0) {
            
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Meeting Scheduler")
                        .font(.headline)
                        .fontWeight(.bold)
                    Text("Hi \(displayName) · \(schedulingStyle) style")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .padding(.bottom, 16)
            
            Divider()
            
            ScrollView {
                VStack(spacing: 20) {
                    
                    // Meeting Title
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Meeting Title")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.secondary)
                        TextField(
                            "e.g. Team Standup",
                            text: $meetingTitle
                        )
                        .textFieldStyle(
                            RoundedBorderTextFieldStyle()
                        )
                    }
                    
                    // Duration Picker
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Duration")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.secondary)
                        Picker(
                            "Duration",
                            selection: $selectedDuration
                        ) {
                            Text("30 min").tag(30)
                            Text("60 min").tag(60)
                            Text("90 min").tag(90)
                        }
                        .pickerStyle(
                            SegmentedPickerStyle()
                        )
                    }
                    
                    // Invitee UUIDs
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Invitee User IDs")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.secondary)
                        Text("Enter comma separated UUIDs")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        TextField(
                            "uuid1, uuid2...",
                            text: $inviteeUUIDs,
                            axis: .vertical
                        )
                        .textFieldStyle(
                            RoundedBorderTextFieldStyle()
                        )
                        .lineLimit(3)
                    }
                    
                    // Error message
                    if !errorMessage.isEmpty {
                        Text(errorMessage)
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                    
                    // Find a Time Button
                    Button(action: startNegotiation) {
                        if isNegotiating {
                            HStack(spacing: 12) {
                                ProgressView()
                                    .progressViewStyle(
                                        CircularProgressViewStyle(
                                            tint: .white
                                        )
                                    )
                                Text("Agents negotiating...")
                                    .fontWeight(.semibold)
                            }
                        } else {
                            Text("Find a Time")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        isFormValid ? Color.blue : Color.gray
                    )
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    .disabled(!isFormValid || isNegotiating)
                    
                }
                .padding(20)
            }
        }
        .sheet(isPresented: $showResult) {
            if let result = negotiationResult {
                ResultView(
                    result: result,
                    meetingTitle: meetingTitle,
                    onDismiss: {
                        showResult = false
                        meetingTitle = ""
                        inviteeUUIDs = ""
                    }
                )
            }
        }
    }
    
    private var isFormValid: Bool {
        !meetingTitle.isEmpty && !inviteeUUIDs.isEmpty
    }
    
    private func parseInvitees() -> [[String: String]] {
        let uuids = inviteeUUIDs
            .split(separator: ",")
            .map { $0.trimmingCharacters(
                in: .whitespaces
            )}
            .filter { !$0.isEmpty }
        
        return uuids.map { uuid in
            [
                "user_id": uuid,
                "display_name": "Invitee",
                "scheduling_style": "balanced"
            ]
        }
    }
    
    private func startNegotiation() {
        guard isFormValid else { return }
        isNegotiating = true
        errorMessage = ""
        
        let invitees = parseInvitees()
        
        print("Parsed invitees: \(invitees)")
        print("Host UUID: \(userID)")
        print("Meeting title: \(meetingTitle)")
        
        NegotiationService.shared.startNegotiation(
            hostUserID: userID,
            hostDisplayName: displayName,
            hostSchedulingStyle: schedulingStyle,
            invitees: invitees,
            meetingTitle: meetingTitle,
            durationMinutes: selectedDuration
        ) { result in
            DispatchQueue.main.async {
                isNegotiating = false
                switch result {
                case .success(let negotiation):
                    negotiationResult = negotiation
                    showResult = true
                case .failure(let error):
                    errorMessage = error.localizedDescription
                    print("Negotiation error: \(error)")
                }
            }
        }
    }
}
