import React, { useEffect, useState } from "react";

const formatDateForICS = (date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};

const CalendarButtons = ({ event, style }) => {
    const { title, description, location, start, end } = event;
    const [countdown, setCountdown] = useState('');
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const update = () => {
            const diff = start - new Date();
            if (diff <= 0) {
                setStarted(true);
                setCountdown('🎉 התחלנו! 🎉');
                return;
            }
            const days = Math.floor(diff / 864e5);
            const hours = Math.floor((diff % 864e5) / 36e5);
            const mins = Math.floor((diff % 36e5) / 6e4);
            const secs = Math.floor((diff % 6e4) / 1000);
            setCountdown(`האירוע בעוד: ${days} ימים ${hours} שעות ${mins} דקות ו${secs} שניות`);
        };

        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [start]);

    const handleGoogle = () => {
        const url = new URL("https://calendar.google.com/calendar/render");
        url.searchParams.set("action", "TEMPLATE");
        url.searchParams.set("text", title);
        url.searchParams.set("dates", `${formatDateForICS(start)}/${formatDateForICS(end)}`);
        url.searchParams.set("details", description);
        url.searchParams.set("location", location);
        window.open(url.toString(), "_blank");
    };

    const handleOutlook = () => {
        const url = new URL("https://outlook.live.com/owa/");
        url.pathname = "/owa/";
        url.searchParams.set("path", "/calendar/action/compose");
        url.searchParams.set("subject", title);
        url.searchParams.set("body", description);
        url.searchParams.set("location", location);
        url.searchParams.set("startdt", start.toISOString());
        url.searchParams.set("enddt", end.toISOString());
        window.open(url.toString(), "_blank");
    };

    const handleICSDownload = () => {
        const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
DTSTART:${formatDateForICS(start)}
DTEND:${formatDateForICS(end)}
END:VEVENT
END:VCALENDAR
    `.trim();

        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "event.ics";
        link.click();
        URL.revokeObjectURL(url);
    };

    // Only render calendar buttons when the wedding hasn't started yet
    if (started) {
        return (
            <div style={{ textAlign: 'center', color: '#00ffff' }}>{countdown}</div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: 'column', alignItems: 'center', padding: '0.5em 0', gap: "1rem", ...style }}>
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
                <button onClick={handleGoogle} className="add-calendar">הוסף ליומן Google</button>
                <button onClick={handleOutlook} className="add-calendar">הוסף ל-Outlook</button>
                <button onClick={handleICSDownload} className="add-calendar">הורדה ליומן Apple</button>
            </div>
            <div style={{ color: '#00ffff', fontSize: '0.8rem' }}>{countdown}</div>
        </div>
    );
};

export default CalendarButtons;
