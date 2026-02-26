//
//  OnboardingView.swift
//  MeetingSchedulerMessages
//
//  Created by Clely Voyena Fernandes on 2/25/26.
//

import SwiftUI

struct OnboardingView: View {
    
    @State private var displayName: String = ""
    @State private var schedulingStyle: String = "balanced"
    @State private var isLoading: Bool = false
    @State private var errorMessage: String = ""
    
    let onComplete: () -> Void
    
    let styles = ["early", "balanced", "flexible"]
    
    var body: some View {
        VStack(spacing: 24) {
            
            // Header
            VStack(spacing: 8) {
                Text("Meeting Scheduler")
                    .font(.title2)
                    .fontWeight(.bold)
                Text("Set up your scheduling agent")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding(.top, 32)
            
            // Name Input
            VStack(alignment: .leading, spacing: 8) {
                Text("Your Name")
                    .font(.caption)
                    .foregroundColor(.secondary)
                TextField("Enter your name",
                         text: $displayName)
                    .textFieldStyle(
                        RoundedBorderTextFieldStyle()
                    )
            }
            .padding(.horizontal, 24)
            
            // Scheduling Style Picker
            VStack(alignment: .leading, spacing: 8) {
                Text("Scheduling Style")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Picker("Style",
                       selection: $schedulingStyle) {
                    Text("Early").tag("early")
                    Text("Balanced").tag("balanced")
                    Text("Flexible").tag("flexible")
                }
                .pickerStyle(SegmentedPickerStyle())
                
                // Style description
                Text(styleDescription)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .padding(.top, 4)
            }
            .padding(.horizontal, 24)
            
            // Error message
            if !errorMessage.isEmpty {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundColor(.red)
                    .padding(.horizontal, 24)
            }
            
            // Register Button
            Button(action: registerUser) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(
                            CircularProgressViewStyle(
                                tint: .white
                            )
                        )
                } else {
                    Text("Create My Agent")
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(displayName.isEmpty ?
                       Color.gray : Color.blue)
            .foregroundColor(.white)
            .cornerRadius(12)
            .padding(.horizontal, 24)
            .disabled(displayName.isEmpty || isLoading)
            
            Spacer()
        }
    }
    
    private var styleDescription: String {
        switch schedulingStyle {
        case "early":
            return "Prefers the earliest available slots"
        case "balanced":
            return "Finds slots with most free time around them"
        case "flexible":
            return "Looks further out for low-density periods"
        default:
            return ""
        }
    }
    
    private func registerUser() {
        guard !displayName.isEmpty else { return }
        isLoading = true
        errorMessage = ""
        
        NetworkService.shared.registerUser(
            displayName: displayName,
            schedulingStyle: schedulingStyle
        ) { result in
            DispatchQueue.main.async {
                isLoading = false
                switch result {
                case .success(let user):
                    // Save UUID to UserDefaults
                    UserDefaults.standard.set(
                        user.id,
                        forKey: "user_id"
                    )
                    UserDefaults.standard.set(
                        user.display_name,
                        forKey: "display_name"
                    )
                    UserDefaults.standard.set(
                        user.scheduling_style,
                        forKey: "scheduling_style"
                    )
                    onComplete()
                case .failure(let error):
                    self.errorMessage =
                        "Registration failed. Please try again."
                    print("Registration error: \(error)")
                }
            }
        }
    }
}
