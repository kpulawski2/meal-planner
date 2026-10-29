import XCTest
final class MealPlannerUITests: XCTestCase {
    func testShellOpensWithoutAProductionLoginOrNetwork() {
        let app = XCUIApplication()
        app.launchArguments = ["--ui-testing"]
        app.launch()
        XCTAssertTrue(app.webViews.staticTexts["Private iPhone shell"].waitForExistence(timeout: 20))
        XCTAssertTrue(app.webViews.buttons["Export test backup"].exists)
    }
}
