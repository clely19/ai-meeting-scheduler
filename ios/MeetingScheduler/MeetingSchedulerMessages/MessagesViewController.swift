import UIKit
import Messages
import SwiftUI

class MessagesViewController: MSMessagesAppViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        showInitialView()
    }
    
    private func showInitialView() {
        if let userID = UserDefaults.standard
            .string(forKey: "user_id") {
            print("Existing user found: \(userID)")
            requestCalendarAndSubmitAvailability(
                userID: userID
            )
            showMainScreen()
        } else {
            showOnboarding()
        }
    }
    
    // MARK: - Calendar Permission + Availability
    func requestCalendarAndSubmitAvailability(
        userID: String
    ) {
        CalendarService.shared.requestCalendarAccess {
            granted in
            if granted {
                print("Calendar access granted")
                self.submitAvailability(userID: userID)
            } else {
                print("Calendar access denied - backend will use mock data")
                self.submitAvailabilityWithMock(
                    userID: userID
                )
            }
        }
    }
    
    private func submitAvailability(userID: String) {
        // Get date range for next 2 weeks
        let now = Date()
        let twoWeeksLater = Calendar.current.date(
            byAdding: .day,
            value: 14,
            to: now
        ) ?? now
        
        let formatter = ISO8601DateFormatter()
        let startString = formatter.string(from: now)
        let endString = formatter.string(
            from: twoWeeksLater
        )
        
        // Get real busy blocks from device calendar
        CalendarService.shared.getBusyBlocks(
            from: now,
            to: twoWeeksLater
        ) { busyBlocks in
            NetworkService.shared.submitAvailability(
                userID: userID,
                sessionID: "default-session",
                dateRangeStart: startString,
                dateRangeEnd: endString,
                durationMinutes: 60,
                busyBlocks: busyBlocks
            ) { result in
                switch result {
                case .success(let response):
                    print("✅ Availability submitted:")
                    print("   Free slots: \(response.slots_count)")
                case .failure(let error):
                    print("❌ Availability error: \(error)")
                }
            }
        }
    }
    
    private func submitAvailabilityWithMock(
        userID: String
    ) {
        let now = Date()
        let twoWeeksLater = Calendar.current.date(
            byAdding: .day,
            value: 14,
            to: now
        ) ?? now
        
        let formatter = ISO8601DateFormatter()
        
        // Send empty busy blocks
        // backend automatically uses mock data
        NetworkService.shared.submitAvailability(
            userID: userID,
            sessionID: "default-session",
            dateRangeStart: formatter.string(from: now),
            dateRangeEnd: formatter.string(
                from: twoWeeksLater
            ),
            durationMinutes: 60,
            busyBlocks: []
        ) { result in
            switch result {
            case .success(let response):
                print("✅ Mock availability submitted:")
                print("   Free slots: \(response.slots_count)")
            case .failure(let error):
                print("❌ Mock availability error: \(error)")
            }
        }
    }
    
    // MARK: - Navigation
    private func showOnboarding() {
        removeAllChildren()
        let onboardingView = OnboardingView {
            [weak self] in
            self?.showMainScreen()
        }
        let hostingController = UIHostingController(
            rootView: onboardingView
        )
        addChild(hostingController)
        view.addSubview(hostingController.view)
        hostingController.view.frame = view.bounds
        hostingController.view
            .autoresizingMask = [.flexibleWidth,
                                 .flexibleHeight]
        hostingController.didMove(toParent: self)
    }
    
    private func showMainScreen() {
        removeAllChildren()
        let mainView = MainSchedulingView()
        let hostingController = UIHostingController(
            rootView: mainView
        )
        addChild(hostingController)
        view.addSubview(hostingController.view)
        hostingController.view.frame = view.bounds
        hostingController.view
            .autoresizingMask = [.flexibleWidth,
                                 .flexibleHeight]
        hostingController.didMove(toParent: self)
    }
    
    private func removeAllChildren() {
        children.forEach { child in
            child.willMove(toParent: nil)
            child.view.removeFromSuperview()
            child.removeFromParent()
        }
    }
}
