import { forwardRef } from 'react'

const RingVideo = forwardRef(function RingVideo({ src = '/ring-loop.webm', style }, ref) {
    return (
        <video
            ref={ref}
            src={src}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'transparent', ...style }}
        />
    )
})

export default RingVideo

