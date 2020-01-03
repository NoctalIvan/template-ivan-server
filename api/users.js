const db = require('./../db')
const sessions = require('./sessions')

module.exports = (app) => {
    // get users (admin)
    app.get('/user', async (req, res) => {
        const session = sessions.get(req.headers.token)

        // not found token
        if(!session) {
            return res.sendStatus(403)
        }

        // get admin
        const user = await db.getUser(session.user.mail, {admin: true})
        if(!user || !user.admin) {
            return res.sendStatus(403)
        }

        // get users
        const users = await db.getUsers()
        res.send(users)
    })

    // create user
    app.post('/user', async (req, res) => {
        const newUser = {
            mail: req.body.mail,
            pass: req.body.pass,
            createdAt: new Date(),
        }

        // incorrect query
        if(!newUser.mail || !newUser.pass) {
            return res.sendStatus(400)
        }

        // duplicate mail
        const existingUser = await db.getUser(newUser.mail, {_id: true})
        if(existingUser) {
            return res.sendStatus(409)
        }

        await db.createUser(newUser)
        res.sendStatus(204)
    })

    // update user (self)
    app.put('/user/me', async (req, res) => {
        const session = sessions.get(req.headers.token)

        // not found token
        if(!session) {
            return res.sendStatus(403)
        }

        const newUserFields = JSON.parse(JSON.stringify({
            pass: req.body.pass,
        }))

        await db.updateUser(session.user.mail, newUserFields)
        sessions.update(req.headers.token, {
            ...session.user,
            ...newUserFields
        })
        
        res.sendStatus(204)
    })

    // login
    app.post('/user/login', async (req, res) => {
        try {
            const user = await db.getUser(req.body.mail)
            
            // bad mail / pass combo
            if(!user || !(user.pass == req.body.pass)) {
                return res.sendStatus(403)
            }

            // rm user previous sessions (?)
            sessions.deleteWithMail(req.body.mail)

            // add to login
            const token = sessions.add(user)

            res.send({
                ...user, 
                token,
                pass: undefined
            })
        } catch (error) {
            console.error(error)
            return res.sendStatus(500)
        }
    })
    
    // me
    app.get('/user/me', async (req, res) => {
        const session = sessions.get(req.headers.token)
        
        // not found token
        if(!session) {
            return res.sendStatus(403)
        }

        const user = await db.getUser(session.user.mail)
        if(!user) {
            return res.sendStatus(404)
        }

        res.send({
            ...user,
            token: session.token,
            pass: undefined
        })
    })

    // logout
    app.delete('/user/login', async (req, res) => {
        const session = sessions.get(req.headers.token)
        
        // not connected
        if(!session) {
            return res.sendStatus(404)
        }

        sessions.delete(req.headers.token)
        res.sendStatus(204)
    })
}