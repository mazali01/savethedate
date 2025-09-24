import ConfettiBoom from 'react-confetti-boom';

const WelcomeConfetti = () => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1000,
            pointerEvents: 'none'
        }}>
            {/* Left side confetti boom */}
            <ConfettiBoom
                particleCount={300}
                deg={250}
                x={1}
                launchSpeed={2}
                spreadDeg={15}
            />

            {/* Right side confetti boom */}
            <ConfettiBoom
                particleCount={300}
                deg={290}
                x={0}
                launchSpeed={2}
                spreadDeg={15}
            />
        </div>
    );
};

export default WelcomeConfetti;
