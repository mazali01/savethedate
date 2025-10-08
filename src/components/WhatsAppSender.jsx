import React, { useState } from 'react';
import axios from 'axios';

/**
 * Add this component anywhere in your admin panel
 * Shows users and lets you send WhatsApp reminders
 */
const WhatsAppSender = ({ users }) => {
    const [sending, setSending] = useState(false);
    const [results, setResults] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);

    const toggleUser = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(u => u.id));
        }
    };

    const sendMessages = async () => {
        setSending(true);
        setResults(null);

        try {
            const usersToSend = users.filter(u => selectedUsers.includes(u.id));
            const response = await axios.post('http://localhost:3001/send', {
                users: usersToSend
            });
            setResults(response.data);
        } catch (error) {
            alert('Error: ' + (error.response?.data?.error || error.message));
        } finally {
            setSending(false);
        }
    };

    const usersNeedingReminder = users.filter(u =>
        !u.rsvpStatus || u.rsvpStatus === 'pending' || !u.confirmed
    );

    return (
        <div style={styles.container}>
            <h3>📱 WhatsApp Reminders</h3>

            <p>{usersNeedingReminder.length} users need reminders</p>

            {usersNeedingReminder.length > 0 && (
                <>
                    <div style={styles.actions}>
                        <button onClick={toggleAll} style={styles.button}>
                            {selectedUsers.length === usersNeedingReminder.length
                                ? '⬜ Deselect All'
                                : '✅ Select All'}
                        </button>
                        <button
                            onClick={sendMessages}
                            disabled={selectedUsers.length === 0 || sending}
                            style={{
                                ...styles.button,
                                ...styles.sendButton,
                                opacity: (selectedUsers.length === 0 || sending) ? 0.5 : 1
                            }}
                        >
                            {sending
                                ? `⏳ Sending (${selectedUsers.length})...`
                                : `📤 Send to ${selectedUsers.length} users`}
                        </button>
                    </div>

                    <div style={styles.userList}>
                        {usersNeedingReminder.map(user => (
                            <label key={user.id} style={styles.userItem}>
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={() => toggleUser(user.id)}
                                />
                                <span style={styles.userName}>{user.name}</span>
                                <span style={styles.userPhone}>{user.phoneNumber}</span>
                            </label>
                        ))}
                    </div>
                </>
            )}

            {results && (
                <div style={styles.results}>
                    <h4>Results</h4>
                    <p>✅ Sent: {results.success.length}</p>
                    <p>❌ Failed: {results.failed.length}</p>
                    {results.failed.length > 0 && (
                        <details>
                            <summary>Show failures</summary>
                            {results.failed.map(u => (
                                <div key={u.id}>{u.name}: {u.error}</div>
                            ))}
                        </details>
                    )}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        background: '#f9fafb',
        borderRadius: '8px',
        marginTop: '20px'
    },
    actions: {
        display: 'flex',
        gap: '10px',
        marginBottom: '15px'
    },
    button: {
        padding: '10px 20px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        background: 'white',
        cursor: 'pointer',
        fontSize: '14px'
    },
    sendButton: {
        background: '#10b981',
        color: 'white',
        border: 'none',
        fontWeight: 'bold'
    },
    userList: {
        maxHeight: '300px',
        overflowY: 'auto',
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '6px',
        padding: '10px'
    },
    userItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '8px',
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer'
    },
    userName: {
        marginLeft: '10px',
        flex: 1
    },
    userPhone: {
        color: '#666',
        fontSize: '13px'
    },
    results: {
        marginTop: '20px',
        padding: '15px',
        background: 'white',
        borderRadius: '6px',
        border: '1px solid #ddd'
    }
};

export default WhatsAppSender;
