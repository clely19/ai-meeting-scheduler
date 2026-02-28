//
//  CalendarService.swift
//  
//
//  Created by Clely Voyena Fernandes on 2/26/26.
//

import Foundation
import EventKit

class CalendarService {
    
    static let shared = CalendarService()
    private let eventStore = EKEventStore()
    private init() {}
    
    // MARK: - Request Permission
    func requestCalendarAccess(
        completion: @escaping (Bool) -> Void
    ) {
        if #available(iOS 17.0, *) {
            eventStore.requestFullAccessToEvents {
                granted, error in
                DispatchQueue.main.async {
                    completion(granted)
                }
            }
        } else {
            eventStore.requestAccess(
                to: .event
            ) { granted, error in
                DispatchQueue.main.async {
                    completion(granted)
                }
            }
        }
    }
    
    // MARK: - Get Busy Blocks
    func getBusyBlocks(
        from startDate: Date,
        to endDate: Date,
        completion: @escaping ([[String: String]]) -> Void
    ) {
        let status = EKEventStore.authorizationStatus(
            for: .event
        )
        
        if #available(iOS 17.0, *) {
            guard status == .fullAccess else {
                completion([])
                return
            }
        } else {
            guard status == .authorized else {
                completion([])
                return
            }
        }
        
        let predicate = eventStore.predicateForEvents(
            withStart: startDate,
            end: endDate,
            calendars: nil
        )
        
        let events = eventStore.events(
            matching: predicate
        )
        
        let formatter = ISO8601DateFormatter()
        
        let busyBlocks = events.map { event in
            [
                "start": formatter.string(
                    from: event.startDate
                ),
                "end": formatter.string(
                    from: event.endDate
                )
            ]
        }
        
        completion(busyBlocks)
    }
    
    // MARK: - Create Calendar Event
    func createEvent(
        title: String,
        startDate: Date,
        endDate: Date,
        completion: @escaping (Bool) -> Void
    ) {
        let event = EKEvent(eventStore: eventStore)
        event.title = title
        event.startDate = startDate
        event.endDate = endDate
        event.calendar = eventStore
            .defaultCalendarForNewEvents
        
        do {
            try eventStore.save(
                event,
                span: .thisEvent
            )
            completion(true)
        } catch {
            print("Error saving event: \(error)")
            completion(false)
        }
    }
}
