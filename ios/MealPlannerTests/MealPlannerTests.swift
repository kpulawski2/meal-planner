import XCTest
@testable import MealPlanner
final class MealPlannerTests: XCTestCase {
    func testOnlyTheExactHTTPSKitchenOriginIsTrusted() {
        XCTAssertTrue(KitchenOrigin.contains(URL(string: "https://meal-planner-wm4j.onrender.com/private/login")))
        for value in ["http://meal-planner-wm4j.onrender.com", "https://meal-planner-wm4j.onrender.com.evil.example", "https://meal-planner-wm4j.onrender.com:444", "javascript:alert(1)", "file:///tmp/test"] { XCTAssertFalse(KitchenOrigin.contains(URL(string: value))) }
    }
    func testBackupExportsCannotEscapeTheirTemporaryDirectory() {
        XCTAssertEqual(KitchenOrigin.exportName("meal-planner-backup.json"), "meal-planner-backup.json")
        for value in ["../password.json", "test/backup.json", "test\\backup.json", "run.html", ""] { XCTAssertNil(KitchenOrigin.exportName(value)) }
    }
}
