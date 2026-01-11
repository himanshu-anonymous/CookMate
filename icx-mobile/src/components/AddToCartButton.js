import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withTiming, 
  runOnJS,
  Easing 
} from 'react-native-reanimated';
import { Plus } from 'lucide-react-native';

export default function AddToCartButton({ onPress, cartPosition }) {
  const scale = useSharedValue(1);
  
  // Flight Animation Values
  const flyingX = useSharedValue(0);
  const flyingY = useSharedValue(0);
  const flyingScale = useSharedValue(0);
  const flyingOpacity = useSharedValue(0);

  // 1. Button Scale Animation
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // 2. Flying Dot Style
  const flyingStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    transform: [
        { translateX: flyingX.value },
        { translateY: flyingY.value },
        { scale: flyingScale.value }
    ],
    opacity: flyingOpacity.value,
  }));

  const handlePress = (event) => {
    // A. Button Tactile Feedback
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1)
    );

    // B. Trigger the Flight (Simulated)
    // In a real app, you calculate positions using measure(). 
    // Here we simulate a flight to top-right (Cart position).
    
    // Reset position to center of button
    flyingX.value = 0;
    flyingY.value = 0;
    flyingScale.value = 1;
    flyingOpacity.value = 1;

    // Animate to top right (approximate cart location relative to button)
    // You might need to adjust these values based on where your button sits
    flyingX.value = withTiming(150, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    flyingY.value = withTiming(-300, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    
    flyingScale.value = withTiming(0.2, { duration: 600 });
    flyingOpacity.value = withTiming(0, { duration: 600 }, (finished) => {
        if (finished && onPress) {
            runOnJS(onPress)(); // Trigger the actual cart update
        }
    });
  };

  return (
    <View>
        {/* The Flying Particle (Hidden until clicked) */}
        <Animated.View style={[flyingStyle, { zIndex: 99, width: 20, height: 20, borderRadius: 10, backgroundColor: '#D4A373' }]} />

        {/* The Button */}
        <TouchableOpacity activeOpacity={1} onPress={handlePress}>
            <Animated.View style={[buttonStyle]} className="bg-earth-primary p-3 rounded-full">
                <Plus color="#fff" size={24} />
            </Animated.View>
        </TouchableOpacity>
    </View>
  );
}