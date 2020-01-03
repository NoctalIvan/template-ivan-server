const conf = require('./conf')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()
app.use(bodyParser.json({limit: '50mb'}))
app.use(cors())


// api routes
const sessions = require('./api/sessions')
require('./api/users')(app)
app.get('/', function (req, res) {
    res.send('Hello World!')
})

// db init
const db = require('./db')
db.connect().then(() => {
    sessions.load()
    app.listen(conf.PORT, function () {
        console.log(`/\n/\nWebsongbook listening on port ${conf.PORT}!`)
    })
})
