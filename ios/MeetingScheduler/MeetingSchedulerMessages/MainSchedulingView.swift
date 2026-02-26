//
//  MainSchedulingView.swift
//  MeetingSchedulerMessages
//
//  Created by Clely Voyena Fernandes on 2/25/26.
//

import SwiftUI

struct MainSchedulingView: View {
    
    let displayName = UserDefaults.standard
        .string(forKey: "display_name") ?? "User"
    
    var body: some View {
        VStack(spacing: 16) {
            Text("Welcome, \(displayName)")
                .font(.title3)
                .fontWeight(.semibold)
            
            Text("Your scheduling agent is ready")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
    }
}
