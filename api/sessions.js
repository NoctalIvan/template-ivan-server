const sessions = {}
const uuid = require('uuid')
const db = require('./../db/index')

exports.add = (user) => {
    const token = uuid()
    sessions[token] = {
        token,
        user: {mail: user.mail}
    }

    return token
}

exports.get = (token) => sessions[token]

exports.deleteWithMail = (mail) => {
    Object.keys(sessions).forEach(token => {
        const user = sessions[token]
        if(user.mail == mail) {
            delete sessions[token]
        }
    })
}

exports.delete = (token) => {
    delete sessions[token]
}

exports.update = (token, user) => {
    sessions[token].user = {mail: user.mail}
}

exports.load = async () => {
    const savedSessions = await db.loadSessions()
    savedSessions.forEach(s => {
        sessions[s.token] = {
            token: s.token,
            user: s.user
        } 
    })
}

let lastSaved = null
exports.save = async () => {
    if(Object.values(sessions).length == 0 || lastSaved == JSON.stringify(sessions)) {
        return
    }

    lastSaved = JSON.stringify(sessions)
    await db.saveSessions(sessions)
}
setInterval(exports.save, 10000)