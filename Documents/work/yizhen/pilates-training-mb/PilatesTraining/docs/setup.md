npx @react-native-community/cli init myAPP

That will:

Create the React Native project

Generate iOS (Xcode) + Android projects

Work exactly like the old command


# iOS
npx react-native run-ios

# Android
npx react-native run-android


cd ios
pod install

Then add Firebase plist  through Xcode

npx react-native run-ios --simulator="iPhone 16e"