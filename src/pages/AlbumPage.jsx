import React from 'react';
import PageTemplate from '../components/PageTemplate';

const AlbumPage = () => {
    return (
        <PageTemplate title="כאן מעלים תמונות 📸">
            <p style={{ color: '#00ffff', fontSize: '1.2rem' }}>
                כאן תוכלו להעלות תמונות משותפות ולראות את כל התמונות של האורחים!
            </p>
        </PageTemplate>
    );
};

export default AlbumPage;
