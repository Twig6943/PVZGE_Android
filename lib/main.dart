import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PVZ WebView',
      theme: ThemeData(
        primarySwatch: Colors.green,
      ),
      home: const WebViewPage(),
    );
  }
}

class WebViewPage extends StatefulWidget {
  const WebViewPage({super.key});

  @override
  State<WebViewPage> createState() => _WebViewPageState();
}

class _WebViewPageState extends State<WebViewPage> {
  late InAppWebViewController webViewController;
  late InAppLocalhostServer localhostServer;

  @override
  void initState() {
    super.initState();
    localhostServer = InAppLocalhostServer(port: 8080);
    startServer();
  }

  Future<void> startServer() async {
    await localhostServer.start();
    debugPrint('Localhost server started at http://localhost:8080/');
  }

  @override
  void dispose() {
    // localhostServer.stop(); // <-- Removed because method doesn't exist
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('PVZ WebView'),
      ),
      body: InAppWebView(
        initialUrlRequest: URLRequest(
          url: WebUri('http://localhost:8080/assets/index.html'),
        ),
        onWebViewCreated: (controller) {
          webViewController = controller;
        },
        onLoadStart: (controller, url) {
          debugPrint('Page started loading: $url');
        },
        onLoadStop: (controller, url) {
          debugPrint('Page finished loading: $url');
        },
      ),
    );
  }
}
