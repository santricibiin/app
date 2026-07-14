
const sessions = new Map();

const setSession = (userId, data) => {
    const current = sessions.get(userId) || {};
    sessions.set(userId, { ...current, ...data });
};

const getSession = (userId) => {
    return sessions.get(userId);
};

const pushHistory = (userId, content) => {
    const session = sessions.get(userId) || {};
    const history = session.history || [];
    history.push(content);
    sessions.set(userId, { ...session, history });
};

const popHistory = (userId) => {
    const session = sessions.get(userId) || {};
    const history = session.history || [];
    return history.pop();
};

const clearSession = (userId) => {
    sessions.delete(userId);
};

module.exports = { setSession, getSession, pushHistory, popHistory, clearSession };
