// Game.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Circle, G, Path, Line, Text as SvgText } from 'react-native-svg';
import LEVELS from '../data/levels';

const { width, height } = Dimensions.get('window');
const CENTER_X = width / 2;

// Visual constants
const MAIN_CIRCLE_RADIUS = 90;
const PIN_RADIUS = 12;
const PIN_LENGTH = 70;
const TOTAL_PIN_EXTENT = MAIN_CIRCLE_RADIUS + PIN_LENGTH + PIN_RADIUS + PIN_RADIUS;

const SHOOT_DURATION = 250;
const COLLISION_THRESHOLD_ANGLE = 15;

const getPath = (innerRadius, outerRadius, startAng, endAng) => {
  const startRad = (startAng - 90) * Math.PI / 180;
  const endRad = (endAng - 90) * Math.PI / 180;

  const x1 = outerRadius * Math.cos(startRad);
  const y1 = outerRadius * Math.sin(startRad);
  const x2 = outerRadius * Math.cos(endRad);
  const y2 = outerRadius * Math.sin(endRad);
  const x3 = innerRadius * Math.cos(endRad);
  const y3 = innerRadius * Math.sin(endRad);
  const x4 = innerRadius * Math.cos(startRad);
  const y4 = innerRadius * Math.sin(startRad);

  const largeArcFlag = (endAng - startAng) > 180 ? 1 : 0;

  return `M ${x4} ${y4} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
};

// Normalize level object to safe types
const normalizeLevel = (raw = {}, idx = 0) => {
  const defaultColors = ['#FF6347', '#6A5ACD', '#3CB371'];
  const pins = Number(raw.pins) || 5;
  const speed = Number(raw.speed) || 3000;
  const colors = Array.isArray(raw.colors) && raw.colors.length > 0 ? raw.colors : defaultColors;
  const pinColors = Array.isArray(raw.pinColors) ? raw.pinColors : [];
  const fixedPins = Array.isArray(raw.fixedPins)
    ? raw.fixedPins.map((p, i) => ({
        id: typeof p.id === 'number' ? p.id : -(i + 1),
        angle: Number(p.angle) || 0,
        color: p.color || (colors[i % colors.length]),
      }))
    : [];
  return { pins, speed, colors, pinColors, fixedPins, rawIndex: idx };
};

const Game = () => {
  const rotation = useRef(new Animated.Value(0)).current;
  const [currentLevel, setCurrentLevel] = useState(1);
  const normalizedLevels = useRef((Array.isArray(LEVELS) ? LEVELS : []).map((l, i) => normalizeLevel(l, i))).current;
  const [currentLevelData, setCurrentLevelData] = useState(normalizedLevels[0] || normalizeLevel({}, 0));

  const [pinsToShoot, setPinsToShoot] = useState([]);
  const [attachedPins, setAttachedPins] = useState([]);
  const [backgroundColor, setBackgroundColor] = useState('#f5f5f5');
  const [currentPin, setCurrentPin] = useState(null);
  const pinShootAnim = useRef(new Animated.Value(0)).current;
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const currentRotationAngle = useRef(0);
  const spinAnimation = useRef(null);
  const rotationListenerId = useRef(null);

  useEffect(() => {
    const level = normalizedLevels[Math.max(0, Math.min(normalizedLevels.length - 1, currentLevel - 1))] || normalizeLevel({}, 0);
    setCurrentLevelData(level);
    initializeLevel(level);
  }, [currentLevel]);

  useEffect(() => {
    startSpinAnimation();

    rotationListenerId.current = rotation.addListener(({ value }) => {
      currentRotationAngle.current = (value * 360) % 360;
    });

    return () => {
      if (rotationListenerId.current) {
        rotation.removeListener(rotationListenerId.current);
        rotationListenerId.current = null;
      }
      if (spinAnimation.current) {
        spinAnimation.current.stop();
        spinAnimation.current = null;
      }
    };
  }, [currentLevelData]);

  const initializeLevel = (levelData = currentLevelData) => {
    const pins = [];
    for (let i = levelData.pins; i > 0; i--) pins.push(i);
    setPinsToShoot(pins);
    setAttachedPins((levelData.fixedPins || []).map(fp => ({
      id: fp.id,
      angle: Number(fp.angle) || 0,
      color: fp.color,
    })));
    setCurrentPin(null);
    setGameOver(false);
    setGameWon(false);
    setBackgroundColor('#f5f5f5');
    rotation.setValue(0);
    currentRotationAngle.current = 0;
  };

  const startSpinAnimation = () => {
    if (spinAnimation.current) {
      spinAnimation.current.stop();
      spinAnimation.current = null;
    }
    rotation.setValue(0);
    spinAnimation.current = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: Math.max(100, Number(currentLevelData.speed) || 3000),
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { iterations: -1 }
    );
    spinAnimation.current.start();
  };

  const resetGame = () => {
    setCurrentLevel(1);
    const lvl = normalizedLevels[0] || normalizeLevel({}, 0);
    setCurrentLevelData(lvl);
    initializeLevel(lvl);
    if (spinAnimation.current) spinAnimation.current.stop();
    rotation.setValue(0);
    currentRotationAngle.current = 0;
    setTimeout(() => startSpinAnimation(), 50);
  };

  const nextLevel = () => {
    setCurrentLevel(prev => {
      if (prev < normalizedLevels.length) return prev + 1;
      return 1;
    });
  };

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const checkCollision = (newPinAngle) => {
    const newA = normalizeAngle(Number(newPinAngle));
    for (let i = 0; i < attachedPins.length; i++) {
      const existingPinAngle = Number(attachedPins[i].angle || 0);
      let angleDiff = Math.abs(newA - normalizeAngle(existingPinAngle));
      if (angleDiff > 180) angleDiff = 360 - angleDiff;
      if (angleDiff < COLLISION_THRESHOLD_ANGLE) return true;
    }
    return false;
  };

  const normalizeAngle = (angle) => {
    let a = Number(angle) || 0;
    while (a < 0) a += 360;
    while (a >= 360) a -= 360;
    return a;
  };

  const handleTap = () => {
    if (gameOver || gameWon || pinsToShoot.length === 0 || currentPin !== null) return;

    const newPinNumber = pinsToShoot[0];
    const pinIndex = currentLevelData.pins - pinsToShoot.length;
    const currentPinColor = getPinColorForSequenceIndex(pinIndex);

    setCurrentPin({ id: newPinNumber, color: currentPinColor });
    pinShootAnim.setValue(0);

    const remainingPinsAfterShot = pinsToShoot.slice(1);

    Animated.timing(pinShootAnim, {
      toValue: 1,
      duration: SHOOT_DURATION,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start(() => {
      const impactAngle = normalizeAngle(180 - currentRotationAngle.current);

      if (checkCollision(impactAngle)) {
        setGameOver(true);
        setPinsToShoot(remainingPinsAfterShot);
      } else {
        setAttachedPins(prev => [
          ...prev,
          {
            id: newPinNumber,
            angle: impactAngle,
            color: currentPinColor,
          },
        ]);
        setPinsToShoot(remainingPinsAfterShot);

        if (remainingPinsAfterShot.length > 0) {
          const nextPinIndex = currentLevelData.pins - remainingPinsAfterShot.length;
          const nextPinColor = getPinColorForSequenceIndex(nextPinIndex);
          setBackgroundColor(nextPinColor);
        } else {
          setBackgroundColor('#f5f5f5');
        }

        if (remainingPinsAfterShot.length === 0) setGameWon(true);
      }

      setCurrentPin(null);
    });
  };

  const getPinColorForSequenceIndex = (sequenceIndex) => {
    const levelPinColors = currentLevelData.pinColors;
    const baseArray = (Array.isArray(levelPinColors) && levelPinColors.length > 0)
      ? levelPinColors
      : (Array.isArray(currentLevelData.colors) ? currentLevelData.colors : ['#000']);

    if (baseArray.length === 0) return '#000';
    const safeIndex = ((sequenceIndex % baseArray.length) + baseArray.length) % baseArray.length;
    return baseArray[safeIndex];
  };

  const startY = height / 2 + MAIN_CIRCLE_RADIUS + PIN_LENGTH + PIN_RADIUS;
  const endY = height / 2 - (MAIN_CIRCLE_RADIUS + PIN_LENGTH + PIN_RADIUS) - 50; // yukarı kaydırıldı
  const currentPinY = pinShootAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, - (startY - endY)],
  });

  return (
    <TouchableWithoutFeedback onPress={handleTap} disabled={!!(gameOver || gameWon)}>
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <Text style={styles.levelText}>Lv {currentLevel}/{Math.max(1, normalizedLevels.length)}</Text>
          <View style={styles.headerIcons}>
            <View style={styles.iconButton}><Text style={styles.iconText}>🛒</Text></View>
            <View style={styles.iconButton}><Text style={styles.iconText}>🏆</Text></View>
            <View style={styles.iconButton}><Text style={styles.iconText}>⚙️</Text></View>
          </View>
        </View>

        <View style={styles.gameArea}>
          <Animated.View
            pointerEvents="box-none"
            style={[{
              width: width, // ekranın tamamı
              height: TOTAL_PIN_EXTENT * 2,
              transform: [{ rotate: spin }, { translateY: -50 }], // yukarı kaydırıldı
              zIndex: 5,
            }]}
          >
            <Svg width={width} height={TOTAL_PIN_EXTENT * 2}>
              <G x={width / 2} y={TOTAL_PIN_EXTENT}>
                {(currentLevelData.colors || []).map((color, index) => {
                  const anglePerSegment = 360 / (currentLevelData.colors.length || 1);
                  const startAngle = index * anglePerSegment;
                  const endAngle = (index + 1) * anglePerSegment;
                  return (
                    <Path
                      key={`seg-${index}`}
                      d={getPath(0, MAIN_CIRCLE_RADIUS, startAngle, endAngle)}
                      fill={color}
                      opacity={0.8}
                    />
                  );
                })}

                <Circle cx="0" cy="0" r={MAIN_CIRCLE_RADIUS} stroke="black" strokeWidth="5" fill="none" />
                <Circle cx="0" cy="0" r={MAIN_CIRCLE_RADIUS / 2} fill="#000" />
                <SvgText
                  x="0"
                  y="0"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontSize="36"
                  fontWeight="bold"
                  fill="#fff"
                >
                  {String(pinsToShoot.length)}
                </SvgText>

                {attachedPins.map((pin) => {
                  const angle = normalizeAngle(pin.angle || 0);
                  const angleRad = (angle - 90) * Math.PI / 180;
                  const ballCenterX = (MAIN_CIRCLE_RADIUS + PIN_LENGTH + PIN_RADIUS) * Math.cos(angleRad);
                  const ballCenterY = (MAIN_CIRCLE_RADIUS + PIN_LENGTH + PIN_RADIUS) * Math.sin(angleRad);
                  const startLegX = MAIN_CIRCLE_RADIUS * Math.cos(angleRad);
                  const startLegY = MAIN_CIRCLE_RADIUS * Math.sin(angleRad);
                  const endLegX = (MAIN_CIRCLE_RADIUS + PIN_LENGTH) * Math.cos(angleRad);
                  const endLegY = (MAIN_CIRCLE_RADIUS + PIN_LENGTH) * Math.sin(angleRad);

                  const colorsArr = Array.isArray(currentLevelData.colors) && currentLevelData.colors.length > 0
                    ? currentLevelData.colors
                    : ['#000'];
                  const safeColor = pin.color || colorsArr[Math.abs(Number(pin.id || 0)) % colorsArr.length] || colorsArr[0];

                  return (
                    <G key={`attached-${pin.id}-${angle.toFixed(2)}`}>
                      <Line
                        x1={startLegX}
                        y1={startLegY}
                        x2={endLegX}
                        y2={endLegY}
                        stroke="#000"
                        strokeWidth="4"
                      />
                      <Circle cx={ballCenterX} cy={ballCenterY} r={PIN_RADIUS} fill={safeColor} stroke="#fff" strokeWidth="2" />
                      <SvgText
                        x={ballCenterX}
                        y={ballCenterY}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fontSize="14"
                        fontWeight="bold"
                        fill="#fff"
                      >
                        {String(pin.id)}
                      </SvgText>
                    </G>
                  );
                })}
              </G>
            </Svg>
          </Animated.View>

          {currentPin && (
            <Animated.View
              style={{
                position: 'absolute',
                top: startY,
                left: CENTER_X - PIN_RADIUS,
                transform: [{ translateY: currentPinY }],
                zIndex: 10,
              }}
            >
              <View style={[styles.shootingPin, { backgroundColor: currentPin.color }]}>
                <Text style={styles.shootingPinText}>{currentPin.id}</Text>
              </View>
            </Animated.View>
          )}
        </View>

        <View style={styles.bottomAreaContainer}>
          <View style={styles.pinsToShootContainer}>
            {pinsToShoot.slice(currentPin ? 1 : 0).slice(0, 5).map((pin, index) => {
              const pinIndex = (currentLevelData.pins - pinsToShoot.length) + index + (currentPin ? 1 : 0);
              const pinColor = getPinColorForSequenceIndex(pinIndex);
              return (
                <View key={`q-${pin}-${index}`} style={[styles.queuePin, { backgroundColor: pinColor }]}>
                  <Text style={styles.queuePinText}>{String(pin)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {(gameOver || gameWon) && (
          <View style={styles.overlay}>
            <View style={styles.gameEndCard}>
              <Text style={styles.overlayTitle}>{gameWon ? "🎯 Level Tamamlandı!" : "💥 Oyun Bitti!"}</Text>
              <Text style={styles.overlaySubtitle}>
                {gameWon
                  ? `Level ${currentLevel} başarıyla geçildi!`
                  : `Level ${currentLevel}'de ${attachedPins.length}/${currentLevelData.pins} ok attınız`}
              </Text>

              <View style={styles.buttonContainer}>
                {gameOver && (
                  <TouchableWithoutFeedback onPress={() => initializeLevel(currentLevelData)}>
                    <View style={styles.retryButton}><Text style={styles.buttonText}>🔄 Tekrar Dene</Text></View>
                  </TouchableWithoutFeedback>
                )}
                <TouchableWithoutFeedback onPress={gameWon && currentLevel < normalizedLevels.length ? nextLevel : resetGame}>
                  <View style={styles.nextButton}><Text style={styles.buttonText}>{gameWon && currentLevel < normalizedLevels.length ? "➡️ Sonraki Level" : "🏠 Başa Dön"}</Text></View>
                </TouchableWithoutFeedback>
              </View>
            </View>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  levelText: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  headerIcons: { flexDirection: 'row' },
  iconButton: {
    width: 40, height: 40, backgroundColor: '#000', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  iconText: { fontSize: 16 },
  gameArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pinsToShootContainer: { alignItems: 'center', paddingVertical: 20, maxHeight: 12 * 5 + 4 * 5, overflow: 'hidden' },
  bottomAreaContainer: { position: 'absolute', bottom: height * 0.1, width: '100%', alignItems: 'center' },
  queuePin: {
    width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginVertical: 4, backgroundColor: '#000', borderWidth: 2, borderColor: '#fff',
  },
  queuePinText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  shootingPin: {
    width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5,
  },
  shootingPinText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  gameEndCard: { backgroundColor: '#fff', borderRadius: 20, padding: 30, alignItems: 'center', minWidth: width * 0.8 },
  overlayTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#000' },
  overlaySubtitle: { fontSize: 16, color: '#666', marginBottom: 25, textAlign: 'center' },
  buttonContainer: { flexDirection: 'column', width: '100%' },
  retryButton: { backgroundColor: '#e74c3c', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  nextButton: { backgroundColor: '#27ae60', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default Game;
