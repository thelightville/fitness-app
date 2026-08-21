import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import type { WebView as WebViewType } from 'react-native-webview';

const FITNESS_APP_URL = 'https://fitness.myapps.com.ng';
const ALLOWED_HOSTS = new Set(['fitness.myapps.com.ng', 'www.fitness.myapps.com.ng']);

function isAllowedUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ALLOWED_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export default function App() {
  const webViewRef = useRef<WebViewType>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(FITNESS_APP_URL);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack) return false;
      webViewRef.current?.goBack();
      return true;
    });

    return () => subscription.remove();
  }, [canGoBack]);

  function handleNavigationStateChange(navState: WebViewNavigation) {
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);
  }

  function reload() {
    setLoadError(false);
    webViewRef.current?.reload();
  }

  function openCurrentPage() {
    Linking.openURL(currentUrl).catch(() => undefined);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>Fitness PT Tracker</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {loadError ? 'Connection issue' : 'fitness.myapps.com.ng'}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            disabled={!canGoBack}
            onPress={() => webViewRef.current?.goBack()}
            style={[styles.actionButton, !canGoBack && styles.actionButtonDisabled]}
          >
            <Text style={[styles.actionText, !canGoBack && styles.actionTextDisabled]}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Reload" onPress={reload} style={styles.actionButton}>
            <Text style={styles.actionText}>Reload</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.browserFrame}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#0f766e" size="large" />
            <Text style={styles.loadingText}>Loading your fitness dashboard</Text>
          </View>
        )}
        {loadError && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorTitle}>Unable to load the app</Text>
            <Text style={styles.errorText}>Check your connection, then reload this screen.</Text>
            <TouchableOpacity accessibilityRole="button" onPress={reload} style={styles.errorButton}>
              <Text style={styles.errorButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}
        <WebView
          ref={webViewRef}
          source={{ uri: FITNESS_APP_URL }}
          style={styles.webView}
          originWhitelist={[`${FITNESS_APP_URL}/*`]}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          javaScriptEnabled
          domStorageEnabled
          geolocationEnabled
          pullToRefreshEnabled
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
          onLoadStart={() => {
            setLoading(true);
            setLoadError(false);
          }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setLoadError(true);
          }}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={(request) => {
            if (isAllowedUrl(request.url)) return true;
            Linking.openURL(request.url).catch(() => undefined);
            return false;
          }}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity accessibilityRole="button" onPress={openCurrentPage}>
          <Text style={styles.footerLink}>Open current page in browser</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#082f2a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 18,
    paddingBottom: 14,
    paddingTop: Platform.OS === 'android' ? 34 : 8,
    backgroundColor: '#082f2a',
  },
  titleGroup: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#f8fafc',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0,
  },
  subtitle: {
    marginTop: 2,
    color: '#99f6e4',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2dd4bf',
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  actionButtonDisabled: {
    borderColor: '#134e4a',
  },
  actionText: {
    color: '#f0fdfa',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
  actionTextDisabled: {
    color: '#5eead4',
    opacity: 0.4,
  },
  browserFrame: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  webView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    color: '#134e4a',
    fontSize: 14,
    fontWeight: '700',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  errorTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    color: '#475569',
    fontSize: 15,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 18,
    borderRadius: 8,
    backgroundColor: '#0f766e',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  errorButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#082f2a',
  },
  footerLink: {
    color: '#99f6e4',
    fontSize: 12,
    fontWeight: '700',
  },
});
