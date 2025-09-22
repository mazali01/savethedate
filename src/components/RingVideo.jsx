const RingVideo = () => {
    return (
        <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
            }}
        >
            <source src="/ring-loop.webm" type="video/webm" />
        </video>
    )
}

export default RingVideo

