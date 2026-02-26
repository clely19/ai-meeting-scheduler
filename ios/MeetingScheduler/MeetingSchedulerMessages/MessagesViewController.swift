import UIKit
import Messages
import SwiftUI

class MessagesViewController: MSMessagesAppViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        showInitialView()
    }
    
    private func showInitialView() {
        // Check if user is already registered
        if let userID = UserDefaults.standard
            .string(forKey: "user_id") {
            print("Existing user found: \(userID)")
            showMainScreen()
        } else {
            showOnboarding()
        }
    }
    
    private func showOnboarding() {
        
        removeAllChildren()
        
        let onboardingView = OnboardingView { [weak self] in
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
