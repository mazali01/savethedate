import * as THREE from 'three'
import { Canvas, useLoader, useFrame } from '@react-three/fiber'
import { useGLTF, MeshRefractionMaterial, AccumulativeShadows, RandomizedLight, Environment, Center } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { RGBELoader } from 'three-stdlib'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'

function Ring({ map, glbUrl, onLoaded, ...props }) {
    const { nodes, materials } = useGLTF(glbUrl)
    const notifiedRef = useRef(false)
    useEffect(() => {
        if (!notifiedRef.current && nodes && materials) {
            notifiedRef.current = true
            onLoaded?.()
        }
    }, [nodes, materials, onLoaded])
    return (
        <group {...props} dispose={null}>
            <mesh geometry={nodes.diamonds.geometry}>
                <MeshRefractionMaterial envMap={map} aberrationStrength={0.02} toneMapped={false} />
            </mesh>
            <mesh castShadow receiveShadow geometry={nodes.ring.geometry} material={materials.ring} material-color={"gold"} material-envMapIntensity={4} />
        </group>
    )
}

// Default rotation speed matches previous implementation: +0.003 rad every 10ms => 0.3 rad/s
export const DEFAULT_SECONDS_PER_REV = (2 * Math.PI) / 0.3;

function Scene({ glbUrl, hdrUrl, secondsPerRevolution, onReady, onOneRev }) {
    const texture = useLoader(RGBELoader, hdrUrl)
    texture.mapping = THREE.EquirectangularReflectionMapping;
    const angleRef = useRef(0)
    const groupRef = useRef()
    const sPerRev = useMemo(() => secondsPerRevolution || DEFAULT_SECONDS_PER_REV, [secondsPerRevolution])
    const [ringReady, setRingReady] = useState(false)
    const [texReady, setTexReady] = useState(false)
    const startedRef = useRef(false)
    const startAngleRef = useRef(0)
    const oneRevFiredRef = useRef(false)
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        angleRef.current = (t * (2 * Math.PI) / sPerRev) % (2 * Math.PI)
        if (groupRef.current) {
            groupRef.current.rotation.set(-Math.PI / 3, 0, angleRef.current)
        }
        if (ringReady && texReady) {
            if (!startedRef.current) {
                startedRef.current = true
                startAngleRef.current = angleRef.current
            } else if (!oneRevFiredRef.current) {
                // compute normalized delta from start
                const delta = (angleRef.current - startAngleRef.current + 2 * Math.PI) % (2 * Math.PI)
                if (delta >= (2 * Math.PI - 0.01)) { // ~0.6 degrees tolerance
                    oneRevFiredRef.current = true
                    onOneRev?.()
                }
            }
        }
    })
    useEffect(() => {
        setTexReady(!!texture)
    }, [texture])
    useEffect(() => {
        if (ringReady && texReady) {
            const id = requestAnimationFrame(() => onReady?.())
            return () => cancelAnimationFrame(id)
        }
    }, [ringReady, texReady, onReady])
    return (
        <>
            <ambientLight />
            <Environment map={texture} />
            <group ref={groupRef} position={[0, 3, 0]}>
                <Center top>
                    <Ring map={texture} scale={3} glbUrl={glbUrl} onLoaded={() => setRingReady(true)} />
                </Center>
                <AccumulativeShadows temporal frames={100} alphaTest={0.95} opacity={1} scale={20}>
                    <RandomizedLight amount={8} radius={10} ambient={0.5} position={[0, 10, -2.5]} bias={0.001} size={3} />
                </AccumulativeShadows>
            </group>
            <EffectComposer>
                <Bloom luminanceThreshold={1} intensity={0.85} levels={9} mipmapBlur />
            </EffectComposer>
        </>
    )
}

export default function Hologram3D({ glbUrl, hdrUrl, transparent = false, secondsPerRevolution = DEFAULT_SECONDS_PER_REV, onReady, onOneRev }) {
    return (
        <Canvas
            shadows
            camera={{ position: [0, 0, 30], fov: 35, near: 1, far: 100 }}
            gl={{ alpha: transparent, preserveDrawingBuffer: true, powerPreference: 'high-performance', antialias: true }}
            frameloop="always"
            onCreated={({ gl }) => {
                if (transparent) gl.setClearColor(0x000000, 0)
            }}
            style={transparent ? { background: 'transparent' } : undefined}
        >
            <Suspense fallback={null}>
                <Scene glbUrl={glbUrl} hdrUrl={hdrUrl} secondsPerRevolution={secondsPerRevolution} onReady={onReady} onOneRev={onOneRev} />
            </Suspense>
        </Canvas>
    )
}
