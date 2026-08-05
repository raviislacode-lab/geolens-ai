// HomePageViewController.swift
// GeoLens AI
//
// HIG Compliance Update — Navigation Streamlining (Release: 2026-08-03)
// Change: The former SettingsIcon (settings-outline) in the navigation bar header has been
//         RENAMED to ProfileIcon and its visual asset updated to `profile_icon_asset.png`.
//         Tapping this button now presents ProfileSettingsViewController (unified profile + settings).
//
// Apple HIG Reference:
//   https://developer.apple.com/design/human-interface-guidelines/navigation-bars

import UIKit

class HomePageViewController: UIViewController {

    // MARK: - Navigation Items

    // Renamed from settingsBarButton. Visual asset: profile_icon_asset.png (person-circle SF Symbol equivalent)
    private lazy var profileBarButton: UIBarButtonItem = {
        let icon = UIImage(named: "profile_icon_asset") ?? UIImage(systemName: "person.circle")
        let button = UIBarButtonItem(
            image: icon,
            style: .plain,
            target: self,
            action: #selector(didTapProfileIcon)
        )
        button.accessibilityLabel = "Profile and Settings"
        return button
    }()

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "GeoLens AI"
        view.backgroundColor = UIColor.systemBackground
        // Set ProfileIcon as the right bar button item (formerly SettingsIcon)
        navigationItem.rightBarButtonItem = profileBarButton
        setupUI()
    }

    private func setupUI() {
        // Home screen content (scan trigger card, stats, recent list) …
    }

    // MARK: - Actions

    /// Navigates to the unified ProfileSettingsViewController.
    /// Formerly this action opened SettingsViewController.
    @objc private func didTapProfileIcon() {
        let profileSettingsVC = ProfileSettingsViewController()
        navigationController?.pushViewController(profileSettingsVC, animated: true)
    }
}
