import React from 'react';
import PageTemplate from '../components/PageTemplate';

const SongsPage = () => {
    return (
        <PageTemplate title="תצביעו לשיר הבא 🎶">
            <p style={{ color: '#00ffff', fontSize: '1.2rem' }}>
                כאן תוכלו להצביע לשירים שתרצו לשמוע בחתונה ולהציע שירים חדשים!
            </p>
        </PageTemplate>
    );
};

export default SongsPage;
