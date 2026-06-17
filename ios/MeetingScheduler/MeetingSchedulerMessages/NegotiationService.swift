//
//  NegotiationService.swift
//  
//
//  Created by Clely Voyena Fernandes on 3/7/26.
//

import Foundation

class NegotiationService {
    
    static let shared = NegotiationService()
    private init() {}
    
    // MARK: - Start Negotiation
    func startNegotiation(
        hostUserID: String,
        hostDisplayName: String,
        hostSchedulingStyle: String,
        invitees: [[String: String]],
        meetingTitle: String,
        durationMinutes: Int,
        completion: @escaping (Result<NegotiationResult, Error>) -> Void
    ) {
        NetworkService.shared.startNegotiation(
            hostUserID: hostUserID,
            hostDisplayName: hostDisplayName,
            hostSchedulingStyle: hostSchedulingStyle,
            invitees: invitees,
            meetingTitle: meetingTitle,
            durationMinutes: durationMinutes,
            completion: completion
        )
    }
}

// MARK: - Negotiation Models
struct NegotiationResult: Codable {
    let session_id: String
    let status: String
    let agreed_slot: AgreedSlot?
    let rounds_completed: Int
    let negotiation_logs: NegotiationLogs?
}

struct AgreedSlot: Codable {
    let start: String
    let end: String
}

struct NegotiationLogs: Codable {
    let final_result: String?
    let rounds_completed: Int?
}
