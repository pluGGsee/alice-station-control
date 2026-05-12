import { useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, Text } from '@react-three/drei'

function StationMesh({ isPlaying }) {
  const groupRef = useRef()
  const lightRingRef = useRef()
  const lightIntRef = useRef()
  const clockRef = useRef(0)

  useFrame((_, delta) => {
    clockRef.current += delta
    const t = clockRef.current

    // Медленное покачивание вместо полного вращения — как живое
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.3
    groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.05

    // Подсветка пульсирует когда играет
    if (lightRingRef.current) {
      lightRingRef.current.intensity = isPlaying
        ? 1.2 + Math.sin(t * 3) * 0.6
        : 0.4
    }
  })

  // Цвета
  const bodyColor = '#C2185B'       // малиново-розовый (как на референсе)
  const fabricColor = '#AD1457'     // ткань чуть темнее
  const topColor = '#880E4F'        // верхняя панель темнее
  const ringColor = '#E040FB'       // фиолетово-розовое кольцо подсветки
  const ledColor = '#FF80AB'        // цифры на дисплее

  return (
    <group ref={groupRef}>

      {/* === Основной корпус — скруглённый куб === */}
      <RoundedBox args={[1.8, 2.0, 1.8]} radius={0.18} smoothness={8} position={[0, 0, 0]}>
        <meshStandardMaterial color={bodyColor} roughness={0.85} metalness={0.05} />
      </RoundedBox>

      {/* === Тканевое покрытие (чуть меньше основного) === */}
      <RoundedBox args={[1.75, 1.5, 1.75]} radius={0.15} smoothness={8} position={[0, -0.15, 0]}>
        <meshStandardMaterial color={fabricColor} roughness={0.95} metalness={0} />
      </RoundedBox>

      {/* === Верхняя панель === */}
      <RoundedBox args={[1.82, 0.08, 1.82]} radius={0.1} smoothness={4} position={[0, 0.96, 0]}>
        <meshStandardMaterial color={topColor} roughness={0.4} metalness={0.2} />
      </RoundedBox>

      {/* === Кольцо подсветки сверху === */}
      <mesh position={[0, 1.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.65, 0.04, 16, 80]} />
        <meshStandardMaterial
          color={ringColor}
          emissive={ringColor}
          emissiveIntensity={isPlaying ? 1.5 : 0.5}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>

      {/* === LED дисплей на передней панели === */}
      <Text
        position={[0, 0.1, 0.91]}
        fontSize={0.35}
        color={ledColor}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {isPlaying ? '♪  ♫  ♪' : '12:35'}
      </Text>

      {/* === Логотип Яндекса (Y) === */}
      <Text
        position={[0, 0.62, 0.91]}
        fontSize={0.18}
        color={ledColor}
        anchorX="center"
        anchorY="middle"
      >
        Я
      </Text>

      {/* === Свет от кольца подсветки === */}
      <pointLight
        ref={lightRingRef}
        position={[0, 1.2, 0]}
        color={ringColor}
        intensity={0.4}
        distance={4}
      />

      {/* === Свет от дисплея === */}
      <pointLight
        position={[0, 0.1, 1.2]}
        color={ledColor}
        intensity={isPlaying ? 0.6 : 0.2}
        distance={2}
      />
    </group>
  )
}

function Scene({ isPlaying }) {
  return (
    <>
      <ambientLight intensity={1.0} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} />
      <directionalLight position={[-2, 2, -2]} intensity={0.4} color="#fce7f3" />
      <pointLight position={[0, 3, 2]} intensity={0.5} color="#f8bbd0" />
      <StationMesh isPlaying={isPlaying} />
    </>
  )
}

export default function StationModel({ isPlaying }) {
  return (
    <div className="w-full h-full min-h-[480px]">
      <Canvas
        camera={{ position: [0, 0.2, 5.8], fov: 34 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene isPlaying={isPlaying} />
        </Suspense>
      </Canvas>
    </div>
  )
}
