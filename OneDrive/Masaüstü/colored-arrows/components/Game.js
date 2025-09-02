import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Dimensions, TouchableWithoutFeedback, Animated, Alert, Easing } from 'react-native';
import Svg, { Circle, G, Path, Line, Text as SvgText } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const CENTER_X = width / 2;
const CENTER_Y = height / 2;
const MAIN_CIRCLE_RADIUS = 90; // Daireyi büyüttük
const PIN_RADIUS = 12;
const PIN_LENGTH = 80;
const SHOOT_DURATION = 250;
const COLLISION_THRESHOLD_ANGLE = 15;
const ROTATION_SPEED = 3000;

// Level sistemi - her level için farklı ok sayısı
const LEVELS = [
  { level: 1, pins: 6, speed: 4000 },
  { level: 2, pins: 8, speed: 3800 },
  { level: 3, pins: 10, speed: 3600 },
  { level: 4, pins: 12, speed: 3400 },
  { level: 5, pins: 14, speed: 3200 },
  { level: 6, pins: 16, speed: 3000 },
  { level: 7, pins: 18, speed: 2800 },
  { level: 8, pins: 20, speed: 2600 },
  { level: 9, pins: 22, speed: 2400 },
  { level: 10, pins: 24, speed: 2200 },
];

const Game = () => {
  const rotation = useRef(new Animated.Value(0)).current;
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentLevelData, setCurrentLevelData] = useState(LEVELS[0]);
  const [pinsToShoot, setPinsToShoot] = useState([]);
  const [attachedPins, setAttachedPins] = useState([]);
  const [backgroundColor, setBackgroundColor] = useState('#f5f5f5');
  const [currentPin, setCurrentPin] = useState(null);
  const pinShootAnim = useRef(new Animated.Value(0)).current;
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  // const [isPaused, setIsPaused] = useState(false); // Kaldırıldı

  const currentRotationAngle = useRef(0);
  const spinAnimation = useRef(null);

  const colors = ['#FF6347', '#6A5ACD', '#3CB371', '#FFD700', '#DA70D6', '#1E90FF'];
  
  useEffect(() => {
    initializeLevel();
  }, [currentLevel]);

  useEffect(() => {
    startSpinAnimation();
    
    const listener = rotation.addListener(({ value }) => {
      currentRotationAngle.current = (value * 360) % 360;
    });

    return () => {
      rotation.removeListener(listener);
      if (spinAnimation.current) {
        spinAnimation.current.stop();
      }
    };
  }, [currentLevelData]);

  const initializeLevel = () => {
    const levelData = LEVELS[currentLevel - 1] || LEVELS[0];
    setCurrentLevelData(levelData);
    
    // Ok sayılarını oluştur (levelData.pins sayısında)
    const pins = [];
    for (let i = levelData.pins; i > 0; i--) {
      pins.push(i);
    }
    setPinsToShoot(pins);
    setAttachedPins([]);
    setCurrentPin(null);
    setGameOver(false);
    setGameWon(false);
    // setIsPaused(false); // Kaldırıldı
    setBackgroundColor('#f5f5f5');
  };

  const startSpinAnimation = () => { // isResuming parametresi kaldırıldı
    if (spinAnimation.current) {
      spinAnimation.current.stop();
    }
    
    rotation.setValue(currentRotationAngle.current / 360); // Mevcut açıdan başla
    // setIsPaused(false); // Kaldırıldı
    
    spinAnimation.current = Animated.loop(
      Animated.timing(rotation, {
        toValue: rotation._value + 1, // Mevcut değerin üzerine 1 ekleyerek devam et
        duration: currentLevelData.speed, // Level hızını kullan
        easing: Easing.linear, // Sürekli ve pürüzsüz dönüş için linear easing
        useNativeDriver: true,
      }),
      { iterations: -1 }
    );
    
    spinAnimation.current.start();
  };

  // pauseSpinAnimation kaldırıldı

  // resumeSpinAnimation kaldırıldı

  const resetGame = () => {
    setCurrentLevel(1);
    initializeLevel();
    if (spinAnimation.current) {
      spinAnimation.current.stop();
    }
    rotation.setValue(0);
    currentRotationAngle.current = 0;
    
    setTimeout(() => {
      startSpinAnimation(); // Parametresiz çağrı
    }, 100);
  };

  const nextLevel = () => {
    if (currentLevel < LEVELS.length) {
      setCurrentLevel(currentLevel + 1);
    } else {
      // Tüm levellar tamamlandı
      Alert.alert("🎉 Tebrikler!", "Tüm levelleri tamamladınız!", [{
        text: "Yeniden Başla",
        onPress: resetGame
      }]);
    }
  };

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const checkCollision = (newPinAngle) => {
    for (let i = 0; i < attachedPins.length; i++) {
      const existingPinAngle = attachedPins[i].angle;
      let angleDiff = Math.abs(newPinAngle - existingPinAngle);

      if (angleDiff > 180) {
        angleDiff = 360 - angleDiff;
      }

      if (angleDiff < COLLISION_THRESHOLD_ANGLE) {
        return true;
      }
    }
    return false;
  };

  const normalizeAngle = (angle) => {
    while (angle < 0) angle += 360;
    while (angle >= 360) angle -= 360;
    return angle;
  };

  const handleTap = () => {
    if (gameOver || gameWon || pinsToShoot.length === 0 || currentPin !== null) {
      return;
    }

    const newPinNumber = pinsToShoot[0];
    const currentPinColor = colors[(currentLevelData.pins - pinsToShoot.length) % colors.length];
    const capturedAngle = normalizeAngle(currentRotationAngle.current);
    
    setCurrentPin({ id: newPinNumber, targetAngle: capturedAngle, color: currentPinColor });
    pinShootAnim.setValue(0);
    
    // Eğer ilk top atılıyorsa daireyi duraklatma (artık tamamen kaldırıldı)

    const remainingPinsAfterShot = pinsToShoot.slice(1);

    Animated.timing(pinShootAnim, {
      toValue: 1,
      duration: SHOOT_DURATION,
      useNativeDriver: true,
    }).start(() => {
      if (checkCollision(capturedAngle)) {
        setGameOver(true);
        Alert.alert("💥 Çarpışma!", "Başka bir oka çarptınız!", [{
          text: "Tekrar Dene",
          onPress: () => initializeLevel()
        }, {
          text: "Başa Dön",
          onPress: resetGame
        }]);
        setPinsToShoot(remainingPinsAfterShot);
      } else {
        setAttachedPins(prev => [...prev, { 
          id: newPinNumber, 
          angle: capturedAngle,
          color: currentPinColor
        }]);
        
        setPinsToShoot(remainingPinsAfterShot);

        // Bir sonraki pinin rengini arka plana ayarla
        if (remainingPinsAfterShot.length > 0) {
          const nextPinIndex = currentLevelData.pins - remainingPinsAfterShot.length;
          const nextPinColor = colors[nextPinIndex % colors.length];
          setBackgroundColor(nextPinColor);
        } else {
          setBackgroundColor('#f5f5f5'); // Tüm pinler atıldıysa varsayılan arka plan rengine dön
        }
        
        if (remainingPinsAfterShot.length === 0) {
          setGameWon(true);
          setTimeout(() => {
            Alert.alert("🎯 Level Tamamlandı!", `Level ${currentLevel} başarıyla tamamlandı!`, [{
              text: currentLevel < LEVELS.length ? "Sonraki Level" : "Yeniden Başla",
              onPress: currentLevel < LEVELS.length ? nextLevel : resetGame
            }]);
          }, 500);
        }
      }
      
      setCurrentPin(null);
      
      // setTimeout içindeki resumeSpinAnimation çağrısı kaldırıldı
    });
  };

  const currentPinY = pinShootAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      0,
      -(height - 150 - MAIN_CIRCLE_RADIUS - PIN_LENGTH),
    ],
  });

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

  return (
    <TouchableWithoutFeedback onPress={handleTap} disabled={gameOver || gameWon}>
      <View style={[styles.container, { backgroundColor: backgroundColor }]}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.levelText}>Lv {currentLevel}/1000</Text>
          <View style={styles.headerIcons}>
            <View style={styles.iconButton}>
              <Text style={styles.iconText}>🛒</Text>
            </View>
            <View style={styles.iconButton}>
              <Text style={styles.iconText}>🏆</Text>
            </View>
            <View style={styles.iconButton}>
              <Text style={styles.iconText}>⚙️</Text>
            </View>
          </View>
        </View>

        {/* Ana oyun alanı */}
        <View style={styles.gameArea}>
          <Animated.View style={[{ transform: [{ rotate: spin }] }]}>
            <Svg width={width} height={height}>
              <G x={CENTER_X} y={CENTER_Y}>
                {/* Renkli segmentler */}
                {colors.map((color, index) => {
                  const anglePerSegment = 360 / colors.length;
                  const startAngle = index * anglePerSegment;
                  const endAngle = (index + 1) * anglePerSegment;
                  
                  return (
                    <Path
                      key={index}
                      d={getPath(0, MAIN_CIRCLE_RADIUS, startAngle, endAngle)}
                      fill={color}
                      opacity={0.8}
                    />
                  );
                })}

                {/* Merkez daire - siyah dairenin yerine, içindeki sayı ve oklar üstte olacak */}
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
                  {pinsToShoot.length}
                </SvgText>

                {/* Saplanmış oklar */}
                {attachedPins.map(pin => {
                  const pinX = (MAIN_CIRCLE_RADIUS + PIN_LENGTH) * Math.cos((pin.angle - 90) * Math.PI / 180);
                  const pinY = (MAIN_CIRCLE_RADIUS + PIN_LENGTH) * Math.sin((pin.angle - 90) * Math.PI / 180);

                  const startLegX = MAIN_CIRCLE_RADIUS * Math.cos((pin.angle - 90) * Math.PI / 180);
                  const startLegY = MAIN_CIRCLE_RADIUS * Math.sin((pin.angle - 90) * Math.PI / 180);

                  return (
                    <G key={`${pin.id}-${pin.angle}`}>
                      {/* Ok gövdesi */}
                      <Line
                        x1={startLegX}
                        y1={startLegY}
                        x2={pinX}
                        y2={pinY}
                        stroke="#333"
                        strokeWidth="3"
                      />
                      {/* Ok başı */}
                      <Circle cx={pinX} cy={pinY} r={PIN_RADIUS} fill={pin.color} stroke="#fff" strokeWidth="2" />
                      <SvgText
                        x={pinX}
                        y={pinY}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fontSize="14"
                        fontWeight="bold"
                        fill="#fff"
                      >
                        {pin.id}
                      </SvgText>
                    </G>
                  );
                })}
              </G>
            </Svg>
          </Animated.View>

          {/* Atılmakta olan ok */}
          {currentPin && (
            <Animated.View style={[{
              position: 'absolute',
              top: height - 150,
              left: CENTER_X - PIN_RADIUS,
              transform: [{ translateY: currentPinY }],
              zIndex: 10,
            }]}>
              <View style={[styles.shootingPin, { backgroundColor: currentPin.color }]}>
                <Text style={styles.shootingPinText}>{currentPin.id}</Text>
              </View>
            </Animated.View>
          )}
        </View>

        {/* Alt kısımda bekleyen oklar */}
        <View style={styles.pinsToShootContainer}>
          {pinsToShoot.slice(currentPin ? 1 : 0).map((pin, index) => {
            const pinIndex = currentLevelData.pins - pinsToShoot.length + index + (currentPin ? 1 : 0);
            const pinColor = colors[pinIndex % colors.length];
            return (
              <View key={`${pin}-${index}`} style={[styles.queuePin, { backgroundColor: pinColor }]}>
                <Text style={styles.queuePinText}>{pin}</Text>
              </View>
            );
          })}
        </View>

    
        {/* Oyun bitişi ekranı */}
        {(gameOver || gameWon) && (
          <View style={styles.overlay}>
            <View style={styles.gameEndCard}>
              <Text style={styles.overlayTitle}>
                {gameWon ? "🎯 Level Tamamlandı!" : "💥 Oyun Bitti!"}
              </Text>
              <Text style={styles.overlaySubtitle}>
                {gameWon 
                  ? `Level ${currentLevel} başarıyla geçildi!` 
                  : `Level ${currentLevel}'de ${attachedPins.length}/${currentLevelData.pins} ok attınız`
                }
              </Text>
              <View style={styles.buttonContainer}>
                {gameOver && (
                  <TouchableWithoutFeedback onPress={() => initializeLevel()}>
                    <View style={styles.retryButton}>
                      <Text style={styles.buttonText}>🔄 Tekrar Dene</Text>
                    </View>
                  </TouchableWithoutFeedback>
                )}
                <TouchableWithoutFeedback onPress={gameWon && currentLevel < LEVELS.length ? nextLevel : resetGame}>
                  <View style={styles.nextButton}>
                    <Text style={styles.buttonText}>
                      {gameWon && currentLevel < LEVELS.length ? "➡️ Sonraki Level" : "🏠 Başa Dön"}
                    </Text>
                  </View>
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    backgroundColor: '#000',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  iconText: {
    fontSize: 16,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinsToShootContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  queuePin: {
    width: PIN_RADIUS * 2,
    height: PIN_RADIUS * 2,
    borderRadius: PIN_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  queuePinText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  shootingPin: {
    width: PIN_RADIUS * 2,
    height: PIN_RADIUS * 2,
    borderRadius: PIN_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  shootingPinText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionContainer: {
    alignItems: 'center',
    paddingBottom: 40,
    backgroundColor: '#8e44ad',
    paddingVertical: 20,
  },
  instructionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  instructionSubtitle: {
    fontSize: 24,
    color: '#fff',
    marginTop: 5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameEndCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: width * 0.8,
  },
  overlayTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#000',
  },
  overlaySubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'column',
    width: '100%',
  },
  retryButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Game;