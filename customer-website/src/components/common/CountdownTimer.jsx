import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = new Date(targetDate) - new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        }
        return timeLeft;
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    const format = (num) => String(num || 0).padStart(2, '0');

    return (
        <div style={{ display: 'flex', gap: '0.5rem', fontWeight: 'bold', alignItems: 'center', color: '#ef4444' }}>
            <span>Ends in: </span>
            <div style={{ background: '#fee2e2', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{format(timeLeft.hours)}h</div> :
            <div style={{ background: '#fee2e2', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{format(timeLeft.minutes)}m</div> :
            <div style={{ background: '#fee2e2', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{format(timeLeft.seconds)}s</div>
        </div>
    );
};

export default CountdownTimer;
