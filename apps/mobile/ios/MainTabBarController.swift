// MainTabBarController.swift
// GeoLens AI
//
// HIG Compliance Update — Navigation Streamlining (Release: 2026-08-03)
// Change: Profile tab item REMOVED from main tab bar per HIG §Navigation > Tab Bars.
//         Profile & Settings are now accessible via the ProfileIcon button on HomePageViewController.
//
// Apple HIG Reference:
//   https://developer.apple.com/design/human-interface-guidelines/tab-bars
//
// Remaining tabs: Home | Camera | History

import UIKit

class MainTabBarController: UITabBarController {

    override func viewDidLoad() {
        super.viewDidLoad()
        setupTabBar()
    }

    private func setupTabBar() {
        // ── Appearance ──────────────────────────────────────────────────────────
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor.systemBackground
        tabBar.standardAppearance = appearance
        tabBar.scrollEdgeAppearance = appearance
        tabBar.tintColor = UIColor(named: "AccentColor")

        // ── View Controllers ────────────────────────────────────────────────────
        // NOTE: ProfileViewController is NO LONGER a tab item.
        //       It is accessed via the ProfileIcon header button on HomePageViewController.
        //       See: HomePageViewController.swift and ProfileSettingsViewController.swift
        let homeVC = HomePageViewController()
        homeVC.tabBarItem = UITabBarItem(title: "Home", image: UIImage(systemName: "house"), selectedImage: UIImage(systemName: "house.fill"))

        let cameraVC = CameraViewController()
        cameraVC.tabBarItem = UITabBarItem(title: "", image: UIImage(systemName: "camera.fill"), selectedImage: nil)

        let historyVC = HistoryViewController()
        historyVC.tabBarItem = UITabBarItem(title: "History", image: UIImage(systemName: "clock"), selectedImage: UIImage(systemName: "clock.fill"))

        // REMOVED: profile tab item
        // let profileVC = ProfileViewController()
        // profileVC.tabBarItem = UITabBarItem(title: "Profile", image: UIImage(systemName: "person"), ...)

        viewControllers = [
            UINavigationController(rootViewController: homeVC),
            UINavigationController(rootViewController: cameraVC),
            UINavigationController(rootViewController: historyVC),
        ]
    }
}
