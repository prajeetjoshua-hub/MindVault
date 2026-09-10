import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable } from 'react-native';
import Svg, { Ellipse, Path, Circle } from 'react-native-svg';

/** Original vector companion. Motion is decorative, never a chat response. */
export default function Squirrel() {
  const y = useRef(new Animated.Value(0)).current;
  const [reduced, setReduced] = useState(true);
  const hop = () => {
    if (reduced) return;
    y.stopAnimation();
    Animated.sequence([
      Animated.timing(y, { toValue: -20, duration: 180, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(y, { toValue: 0, friction: 4, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  };
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => active && setReduced(value));
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { active = false; listener.remove(); y.stopAnimation(); };
  }, [y]);
  useEffect(() => { if (!reduced) hop(); else { y.stopAnimation(); y.setValue(0); } }, [reduced]);
  return <Pressable onPress={hop} accessibilityRole="button" accessibilityLabel="Make the squirrel hop" accessibilityHint="Decorative animation only">
    <Animated.View style={{ transform: [{ translateY: y }] }}>
      <Svg width={250} height={242} viewBox="0 0 300 290">
        <Ellipse cx="153" cy="266" rx="94" ry="10" fill="#C9DFA6" />
        <Path d="M177 242 C270 261 291 181 267 129 C253 99 215 94 209 120 C203 146 244 160 224 180 C207 196 177 178 169 201" fill="#BA7544" />
        <Path d="M213 228 C256 214 271 168 245 137" fill="none" stroke="#E4AA6B" strokeWidth="19" strokeLinecap="round" />
        <Ellipse cx="145" cy="214" rx="57" ry="53" fill="#C8874D" />
        <Ellipse cx="141" cy="224" rx="33" ry="35" fill="#FFE4B9" />
        <Path d="M97 108 Q66 37 96 40 Q123 42 128 96 M158 91 Q167 34 188 48 Q208 69 189 112" fill="#C8874D" />
        <Path d="M98 89 Q86 54 97 57 L114 91 M171 87 L184 61 Q192 76 181 95" fill="#F2B99B" />
        <Ellipse cx="143" cy="139" rx="65" ry="56" fill="#D89859" />
        <Path d="M89 141 Q111 146 132 119 Q141 114 151 127 Q165 146 195 141 Q196 186 144 191 Q97 189 89 141" fill="#FFEACB" />
        <Ellipse cx="114" cy="136" rx="6" ry="9" fill="#34382D" />
        <Ellipse cx="172" cy="136" rx="6" ry="9" fill="#34382D" />
        <Circle cx="116" cy="133" r="2" fill="white" /><Circle cx="174" cy="133" r="2" fill="white" />
        <Ellipse cx="101" cy="155" rx="10" ry="6" fill="#ECA88B" /><Ellipse cx="185" cy="155" rx="10" ry="6" fill="#ECA88B" />
        <Path d="M135 153 Q144 148 152 153 Q148 163 144 161 Q140 162 135 153" fill="#704832" />
        <Path d="M131 170 Q144 181 158 169" fill="none" stroke="#704832" strokeWidth="3" strokeLinecap="round" />
        <Path d="M106 207 Q123 229 141 222 M182 205 Q169 229 151 222" stroke="#B97641" strokeWidth="17" fill="none" strokeLinecap="round" />
        <Path d="M133 218 Q144 200 156 218 L154 237 Q144 248 134 237Z" fill="#94744B" />
        <Path d="M132 219 Q145 205 158 219" fill="none" stroke="#67543D" strokeWidth="7" strokeLinecap="round" />
        <Ellipse cx="113" cy="259" rx="25" ry="10" fill="#B97641" /><Ellipse cx="176" cy="259" rx="25" ry="10" fill="#B97641" />
      </Svg>
    </Animated.View>
  </Pressable>;
}
