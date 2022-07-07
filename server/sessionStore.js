/* abstract */ class SessionStore {
    findSession(id) {}
    saveSession(id, session) {}
    delete(id) {}
  }
  
  class InMemorySessionStore extends SessionStore {
    constructor() {
      super();
      this.sessions = new Map();
    }
  
    findSession(id) {
      return this.sessions.get(id);
    }
  
    saveSession(id, session) {
      this.sessions.set(id, session);
    }

    delete(id) {
      this.sessions.delete(id);
    }

    contains(id) {
      return this.sessions.has(id);
    }
  }
  
  module.exports = {
    InMemorySessionStore
  };
  