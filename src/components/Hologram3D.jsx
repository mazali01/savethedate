import * as THREE from 'three'
import { Canvas, useLoader } from '@react-three/fiber'
import { useGLTF, MeshRefractionMaterial, AccumulativeShadows, RandomizedLight, Environment, Center } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { RGBELoader } from 'three-stdlib'
import { useEffect } from 'react'
import { useState } from 'react'

function Ring({ map, glbUrl, ...props }) {
    const { nodes, materials } = useGLTF(glbUrl)
    return (
        <group {...props} dispose={null}>
            <mesh geometry={nodes.diamonds.geometry}>
                <MeshRefractionMaterial envMap={map} aberrationStrength={0.02} toneMapped={false} />
            </mesh>
            <mesh castShadow receiveShadow geometry={nodes.ring.geometry} material={materials.ring} material-color={"gold"} material-envMapIntensity={4} />
        </group>
    )
}

export default function Hologram3D({ glbUrl, hdrUrl }) {
    const texture = useLoader(RGBELoader, hdrUrl)
    texture.mapping = THREE.EquirectangularReflectionMapping;
    const [y, setY] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setY(y => y + 0.003);
        }, 10);
        return () => clearInterval(interval);
    }
        , []);
    return (
        <Canvas shadows camera={{ position: [0, 0, 30], fov: 35, near: 1, far: 100 }}>
            <ambientLight />
            <Environment map={texture} />
            <group position={[0, 3, 0]}>
                <Center top>
                    <Ring map={texture} rotation={[-Math.PI / 3, 0, y]} scale={3} glbUrl={glbUrl} />
                </Center>
                <AccumulativeShadows temporal frames={100} alphaTest={0.95} opacity={1} scale={20}>
                    <RandomizedLight amount={8} radius={10} ambient={0.5} position={[0, 10, -2.5]} bias={0.001} size={3} />
                </AccumulativeShadows>
            </group>
            <EffectComposer>
                <Bloom luminanceThreshold={1} intensity={0.85} levels={9} mipmapBlur />
            </EffectComposer>
        </Canvas>
    )
}
