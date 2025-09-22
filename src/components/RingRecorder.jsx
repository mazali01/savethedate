import React, { useEffect, useRef, useState } from 'react'
import Hologram3D, { DEFAULT_SECONDS_PER_REV } from './Hologram3D'

// Records exactly N frames or one full revolution as a seamless loop.
export default function RingRecorder({
    glbUrl,
    hdrUrl,
    secondsPerRevolution = DEFAULT_SECONDS_PER_REV,
    fps = 60,
    width = 1280,
    height = 720,
    mimeType = 'video/webm;codecs=vp9',
    frames,
    onReady
}) {
    const canvasContainerRef = useRef(null)

    const [sceneReady, setSceneReady] = useState(false)
    const [oneRevComplete, setOneRevComplete] = useState(false)

    useEffect(() => {
        if (!sceneReady) return

        // Wait for one full revolution to complete before starting recording
        // This ensures we start at the same angle where the loop will restart
        if (!oneRevComplete) return

        const startRecording = async () => {
            const canvas = canvasContainerRef.current?.querySelector('canvas')
            if (!canvas) return

            try {
                canvas.width = width
                canvas.height = height
                canvas.style.width = width + 'px'
                canvas.style.height = height + 'px'

                const stream = canvas.captureStream(fps)
                let chosenType = mimeType
                if (typeof MediaRecorder !== 'undefined') {
                    const candidates = [mimeType, 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
                    chosenType = candidates.find(t => MediaRecorder.isTypeSupported?.(t)) || 'video/webm'
                }

                const recorder = new MediaRecorder(stream, { mimeType: chosenType })
                const chunks = []
                let finished = false

                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunks.push(e.data)
                }

                recorder.onstop = async () => {
                    console.log('MediaRecorder onstop called')
                    if (finished) {
                        console.log('Already finished, returning early')
                        return
                    }
                    finished = true

                    try {
                        console.log('Processing chunks:', chunks.length)
                        const blob = new Blob(chunks, { type: chosenType })
                        console.log('Blob created, size:', blob.size)

                        // For large blobs, just download directly and signal completion
                        console.log('Downloading directly due to size')
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'ring-loop.webm'
                        document.body.appendChild(a)
                        a.click()
                        a.remove()
                        URL.revokeObjectURL(url)

                        // Signal completion to Puppeteer
                        if (typeof window.nodeResolveVideo === 'function') {
                            console.log('Notifying Puppeteer of completion')
                            window.nodeResolveVideo({ downloaded: true, size: blob.size, mimeType: chosenType })
                        }

                        onReady?.(blob)
                        console.log('Recording processing complete')
                    } catch (err) {
                        console.error('Error in onstop handler:', err)
                    }
                }

                console.log('Starting recording at loop position')
                recorder.start()
                console.log('Recording started')

                if (typeof frames === 'number' && frames > 0) {
                    let count = 0
                    let shouldStop = false
                    const tick = () => {
                        count++
                        console.log('Frame count:', count, '/', frames)
                        if (count >= frames && !shouldStop) {
                            shouldStop = true
                            console.log(`Stopping recorder after ${count} frames, state:`, recorder.state)
                            if (recorder.state === 'recording') {
                                recorder.stop()
                            } else {
                                console.log('Recorder not in recording state:', recorder.state)
                            }
                        } else if (!shouldStop) {
                            requestAnimationFrame(tick)
                        }
                    }
                    requestAnimationFrame(tick)
                }

            } catch (err) {
                console.error('Recording failed', err)
            }
        }

        // Small delay to ensure we're at the exact start of the loop
        const timer = setTimeout(startRecording, 300)
        return () => clearTimeout(timer)
    }, [sceneReady, oneRevComplete, glbUrl, hdrUrl, secondsPerRevolution, fps, width, height, mimeType, frames, onReady])

    return (
        <div ref={canvasContainerRef} style={{ width, height, background: '#000000' }}>
            <Hologram3D
                glbUrl={glbUrl}
                hdrUrl={hdrUrl}
                transparent={false}
                secondsPerRevolution={secondsPerRevolution}
                onReady={() => setSceneReady(true)}
                onOneRev={() => setOneRevComplete(true)}
            />
        </div>
    )
}
