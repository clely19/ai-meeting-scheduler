//
//  NetworkService.swift
//  MeetingSchedulerMessages
//
//  Created by Clely Voyena Fernandes on 2/25/26.
//

import Foundation

class NetworkService {
    
    static let shared = NetworkService()
    private let baseURL = "https://455d2627-6e8b-4027-a7d9-4f3f73586cdd-00-2pod2xr4d64ve.janeway.replit.dev"
    
    private init() {}
    
    // MARK: - User Registration
    func registerUser(
        displayName: String,
        schedulingStyle: String,
        completion: @escaping (Result<UserModel, Error>) -> Void
    ) {
        guard let url = URL(
            string: "\(baseURL)/users/register"
        ) else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(
            "application/json",
            forHTTPHeaderField: "Content-Type"
        )
        
        let body: [String: String] = [
            "display_name": displayName,
            "scheduling_style": schedulingStyle
        ]
        
        request.httpBody = try? JSONSerialization
            .data(withJSONObject: body)
        
        URLSession.shared.dataTask(
            with: request
        ) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let data = data else { return }
            
            do {
                let user = try JSONDecoder()
                    .decode(UserModel.self, from: data)
                completion(.success(user))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    // MARK: - Get User
    func getUser(
        userID: String,
        completion: @escaping (Result<UserModel, Error>) -> Void
    ) {
        guard let url = URL(
            string: "\(baseURL)/users/\(userID)"
        ) else { return }
        
        URLSession.shared.dataTask(
            with: url
        ) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let data = data else { return }
            
            do {
                let user = try JSONDecoder()
                    .decode(UserModel.self, from: data)
                completion(.success(user))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}

// MARK: - User Model
struct UserModel: Codable {
    let id: String
    let display_name: String
    let scheduling_style: String
    let created_at: String
}
