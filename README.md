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
