const LEVELS = [
  {
    level: 1,
    pins: 6,
    speed: 4000,
    colors: ['#FF6347', '#FF8A65', '#FF7043', '#FF5722', '#E64A19', '#BF360C'],
    // Atılacak pinlerin renk sırası (opsiyonel). Yoksa colors döngüsü kullanılır.
    pinColors: ['#FF6347', '#FF8A65', '#FF7043', '#FF5722', '#E64A19', '#BF360C'],
    // Başlangıçta ana daireye yapışık pinler: açı derece cinsinden
    fixedPins: [
      { angle: 0, id: 0 },
    ],
  },
  {
    level: 2,
    pins: 8,
    speed: 3800,
    colors: ['#6A5ACD', '#6A5ACD', '#6A5ACD', '#6A5ACD', '#6A5ACD', '#6A5ACD', '#6A5ACD', '#6A5ACD'],
    pinColors: ['#6A5ACD', '#7B68EE', '#8470FF', '#6A5ACD', '#7B68EE', '#8470FF', '#6A5ACD', '#7B68EE'],
    fixedPins: [
      { angle: 0, id: 0 },
      { angle: 180, id: 0 },
    ],
  },
  { level: 3, 
    pins: 10, 
    speed: 3600, 
    colors: ['#3CB371', '#3CB371', '#3CB371', '#3CB371', '#3CB371', '#3CB371', '#3CB371', '#3CB371', '#3CB371', '#3CB371'],
    pinColors: ['#3CB371', '#2E8B57', '#66CDAA', '#20B2AA', '#008B8B', '#3CB371', '#2E8B57', '#66CDAA', '#20B2AA', '#008B8B'],
    fixedPins: [
      { angle: 0, id: 0 },
      { angle: 180, id: 0 },
    ],
  },
  { level: 4, pins: 12, speed: 3400, colors: ['#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700'] },
  { level: 5, pins: 14, speed: 3200, colors: ['#DA70D6', '#DA70D6', '#DA70D6', '#DA70D6', '#DA70D6', '#DA70D6', '#DA70D6', '#DA70D6', '#DA70D6', '#DA70D6', '#DA70D6', '#DA70D6', '#DA70D6', '#DA70D6'] },
  { level: 6, pins: 16, speed: 3000, colors: ['#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF', '#1E90FF'] },
  { level: 7, pins: 18, speed: 2800, colors: ['#FF6347', '#6A5ACD', '#FF6347', '#6A5ACD', '#FF6347', '#6A5ACD', '#FF6347', '#6A5ACD', '#FF6347', '#6A5ACD', '#FF6347', '#6A5ACD', '#FF6347', '#6A5ACD', '#FF6347', '#6A5ACD', '#FF6347', '#6A5ACD'] },
  { level: 8, pins: 20, speed: 2600, colors: ['#3CB371', '#FFD700', '#3CB371', '#FFD700', '#3CB371', '#FFD700', '#3CB371', '#FFD700', '#3CB371', '#FFD700', '#3CB371', '#FFD700', '#3CB371', '#FFD700', '#3CB371', '#FFD700', '#3CB371', '#FFD700', '#3CB371', '#FFD700'] },
  { level: 9, pins: 22, speed: 2400, colors: ['#DA70D6', '#1E90FF', '#DA70D6', '#1E90FF', '#DA70D6', '#1E90FF', '#DA70D6', '#1E90FF', '#DA70D6', '#1E90FF', '#DA70D6', '#1E90FF', '#DA70D6', '#1E90FF', '#DA70D6', '#1E90FF', '#DA70D6', '#1E90FF', '#DA70D6', '#1E90FF', '#DA70D6', '#1E90FF'] },
  { level: 10, pins: 24, speed: 2200, colors: ['#FF6347', '#6A5ACD', '#3CB371', '#FFD700', '#DA70D6', '#1E90FF', '#FF6347', '#6A5ACD', '#3CB371', '#FFD700', '#DA70D6', '#1E90FF', '#FF6347', '#6A5ACD', '#3CB371', '#FFD700', '#DA70D6', '#1E90FF', '#FF6347', '#6A5ACD', '#3CB371', '#FFD700', '#DA70D6', '#1E90FF'] },
];

export default LEVELS;
