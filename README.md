# react-native-Webrtc

### Setting up Project

#### create new project 
     $ react-native init Webrtc

#### install packages
     $ npm install @react-native-community/masked-view @react-navigation/native @react-navigation/stack react-native-gesture-handler react-native-reanimated react-native-safe-area-context react-native-screens react-native-webrtc socket.io-client 

   App crash on android when add react-native-webrtc into package.json
     
   add this to your gradle.properties

     android.enableDexingArtifactTransform.desugaring=false
   
   https://stackoverflow.com/questions/37090135/to-run-dex-in-process-the-gradle-daemon-needs-a-larger-heap-it-currently-has-a

   add this to your gradle.properties.

     org.gradle.jvmargs=-Xmx3072m


####  In android/app/src/main/AndroidManifest.xml add these permissions

     <uses-permission android:name="android.permission.CAMERA" />
     <uses-feature android:name="android.hardware.camera" />
     <uses-feature android:name="android.hardware.camera.autofocus"/>

     <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
     <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
     <uses-permission android:name="android.permission.RECORD_AUDIO" />
     <uses-permission android:name="android.permission.WAKE_LOCK" />
     <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
     
     
   https://github.com/Anjani-prog/react-native-Webrtc/edit/main/Webrtc/DOC.md
     
 detailed Explanation about webrtc
