import * as React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import PrayerRoom from './src/PrayerRoom';
const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator >
        <Stack.Screen name="Home" options={{ title: 'WebRTC Demo' }} component={PrayerRoom} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;