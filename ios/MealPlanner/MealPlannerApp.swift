import SwiftUI
import WebKit

@main
struct MealPlannerApp: App {
    var body: some Scene { WindowGroup { KitchenView() } }
}

enum KitchenOrigin {
    static let url = URL(string: "https://meal-planner-wm4j.onrender.com")!
    static func contains(_ url: URL?) -> Bool {
        guard let url else { return false }
        return url.scheme == "https" && url.host == self.url.host && (url.port == nil || url.port == 443)
    }
    static func exportName(_ name: String) -> String? {
        guard name.count <= 100, !name.isEmpty, !name.contains("/"), !name.contains("\\"),
              ["json", "txt", "ics", "csv"].contains((name as NSString).pathExtension.lowercased()),
              name.unicodeScalars.allSatisfy({ CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "-_. ")).contains($0) }) else { return nil }
        return name
    }
}

final class KitchenModel: ObservableObject {
    @Published var loading = true
    @Published var failure: String?
    @Published var export: KitchenExport?
    weak var webView: WKWebView?
    func signOut() {
        guard let webView else { return }
        let store = webView.configuration.websiteDataStore.httpCookieStore
        store.getAllCookies { [weak self] cookies in
            if let cookie = cookies.first(where: { $0.name == "__Host-mealplanner_session" && $0.domain == KitchenOrigin.url.host }) {
                store.delete(cookie) { DispatchQueue.main.async { self?.reload() } }
            } else { DispatchQueue.main.async { self?.reload() } }
        }
    }
    func reload() {
        failure = nil
        loading = true
        webView?.load(URLRequest(url: KitchenOrigin.url))
    }
}

struct KitchenExport: Identifiable { let id = UUID(); let url: URL }
struct KitchenView: View {
    @StateObject private var model = KitchenModel()
    var body: some View {
        NavigationStack { ZStack {
            Color(red: 0.067, green: 0.11, blue: 0.173).ignoresSafeArea()
            KitchenWebView(model: model)
                .ignoresSafeArea(edges: .bottom)
            if model.loading { ProgressView("Opening your kitchen…").padding().background(.regularMaterial).clipShape(RoundedRectangle(cornerRadius: 16)) }
            if let error = model.failure {
                VStack(spacing: 16) {
                    Image(systemName: "wifi.exclamationmark").font(.largeTitle)
                    Text("Can’t open your kitchen").font(.headline)
                    Text(error).multilineTextAlignment(.center)
                    Button("Try again") { model.reload() }.buttonStyle(.borderedProminent)
                }.padding(28).background(.regularMaterial).clipShape(RoundedRectangle(cornerRadius: 20)).padding()
            }
        }
        .toolbar { ToolbarItem(placement: .topBarTrailing) { Menu {
            Button("Reload", systemImage: "arrow.clockwise") { model.reload() }
            Button("Sign out", systemImage: "lock", role: .destructive) { model.signOut() }
        } label: { Image(systemName: "ellipsis.circle").accessibilityLabel("Kitchen controls") } } }
        .sheet(item: $model.export, onDismiss: cleanExports) { item in ShareExport(url: item.url) }
        }
    }
    private func cleanExports() {
        try? FileManager.default.removeItem(at: FileManager.default.temporaryDirectory.appendingPathComponent("MealPlannerExports"))
    }
}

struct KitchenWebView: UIViewRepresentable {
    @ObservedObject var model: KitchenModel
    func makeCoordinator() -> Coordinator { Coordinator(model) }
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.limitsNavigationsToAppBoundDomains = true
        config.allowsInlineMediaPlayback = true
        config.userContentController.add(context.coordinator, name: "kitchenExport")
        config.userContentController.add(context.coordinator, name: "kitchenPrint")
        config.userContentController.addUserScript(WKUserScript(source: """
        if (location.origin === 'https://meal-planner-wm4j.onrender.com') {
          window.print = function() { window.webkit.messageHandlers.kitchenPrint.postMessage({}); };
          window.downloadFile = function(name, text, type) {
            window.webkit.messageHandlers.kitchenExport.postMessage({name:String(name),text:String(text),type:String(type)});
          };
        }
        """, injectionTime: .atDocumentEnd, forMainFrameOnly: true))
        let web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = context.coordinator
        web.uiDelegate = context.coordinator
        web.allowsBackForwardNavigationGestures = true
        web.isOpaque = false
        web.backgroundColor = .clear
        web.scrollView.backgroundColor = .clear
        model.webView = web
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("--ui-testing") {
            web.loadHTMLString("<html><meta name='viewport' content='width=device-width,initial-scale=1'><body><h1>Meal Planner</h1><p>Private iPhone shell</p><button onclick=\"window.webkit.messageHandlers.kitchenExport.postMessage({name:'meal-planner-backup.json',text:'{}',type:'application/json'})\">Export test backup</button></body></html>", baseURL: KitchenOrigin.url)
            return web
        }
        #endif
        web.load(URLRequest(url: KitchenOrigin.url))
        return web
    }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "kitchenExport")
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "kitchenPrint")
        uiView.navigationDelegate = nil
        uiView.uiDelegate = nil
    }
    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        weak var model: KitchenModel?
        init(_ model: KitchenModel) { self.model = model }
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { model?.loading = false; model?.failure = nil }
        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) { model?.failure = nil }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { failed(error) }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { failed(error) }
        private func failed(_ error: Error) {
            guard (error as NSError).code != NSURLErrorCancelled else { return }
            model?.loading = false
            model?.failure = "Check your connection and try again. Your saved meals stay on this iPhone."
        }
        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { model?.loading = false; model?.failure = "The kitchen was interrupted. Reopen it to continue." }
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { decisionHandler(.cancel); return }
            if KitchenOrigin.contains(url) || url.absoluteString == "about:blank" {
                decisionHandler(.allow)
            } else {
                decisionHandler(.cancel)
                if action.targetFrame?.isMainFrame != false, ["https", "http", "mailto"].contains(url.scheme ?? "") { UIApplication.shared.open(url) }
            }
        }
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = action.request.url {
                if KitchenOrigin.contains(url) { webView.load(URLRequest(url: url)) }
                else if ["https", "http", "mailto"].contains(url.scheme ?? "") { UIApplication.shared.open(url) }
            }
            return nil
        }
        func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin, initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType, decisionHandler: @escaping (WKPermissionDecision) -> Void) {
            decisionHandler(origin.protocol == "https" && origin.host == KitchenOrigin.url.host && (origin.port == 0 || origin.port == 443) ? .prompt : .deny)
        }
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.frameInfo.isMainFrame, KitchenOrigin.contains(message.frameInfo.request.url) else { return }
            if message.name == "kitchenPrint", let web = model?.webView {
                let printer = UIPrintInteractionController.shared
                printer.printFormatter = web.viewPrintFormatter()
                printer.present(animated: true)
                return
            }
            guard message.name == "kitchenExport", let body = message.body as? [String: String], let name = body["name"].flatMap(KitchenOrigin.exportName),
                  let text = body["text"], let data = text.data(using: .utf8), data.count <= 20*1024*1024 else { return }
            do {
                let folder = FileManager.default.temporaryDirectory.appendingPathComponent("MealPlannerExports", isDirectory: true)
                try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
                let file = folder.appendingPathComponent(name)
                try data.write(to: file, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
                model?.export = KitchenExport(url: file)
            } catch { model?.failure = "Couldn’t prepare the backup. Your saved meals have not been changed." }
        }
    }
}

struct ShareExport: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> UIActivityViewController { UIActivityViewController(activityItems: [url], applicationActivities: nil) }
    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}
