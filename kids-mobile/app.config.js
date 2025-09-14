const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  "expo": {
    "name": IS_DEV ? "Kids Curator (Dev)" : "Kids Curator",
    "slug": "kids-curator",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "kidscurator",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#8B5CF6"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": IS_DEV ? "com.kidscurator.app.dev" : "com.kidscurator.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSAppTransportSecurity": {
          "NSAllowsArbitraryLoads": IS_DEV, // Only allow HTTP in development
          "NSExceptionDomains": IS_DEV ? {
            "localhost": {
              "NSExceptionAllowsInsecureHTTPLoads": true,
              "NSExceptionMinimumTLSVersion": "1.0",
              "NSIncludesSubdomains": true
            }
          } : {}
        },
        "NSUserTrackingUsageDescription": "This app uses tracking to provide personalized educational content for your child.",
        "NSCameraUsageDescription": "Camera access is needed for profile pictures.",
        "NSMicrophoneUsageDescription": "Microphone access is needed for interactive features."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/icon.png",
        "backgroundColor": "#8B5CF6"
      },
      "package": IS_DEV ? "com.kidscurator.app.dev" : "com.kidscurator.app",
      "versionCode": 1,
      "permissions": [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE"
      ],
      "usesCleartextTraffic": IS_DEV // Only allow HTTP in development
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/icon.png"
    },
    "plugins": [
      "expo-router",
      "expo-video",
      [
        "expo-font",
        {
          "fonts": [
            "./assets/fonts/SpaceMono-Regular.ttf"
          ]
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "your-eas-project-id-here"
      }
    },
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/your-eas-project-id-here"
    }
  }
};
