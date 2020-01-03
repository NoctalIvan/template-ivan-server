const conf = require('./../conf')
const moment = require('moment')

const MongoClient = require('mongodb').MongoClient;
let db = null
let users = null
let history = null

const client = new MongoClient(conf.mongo.url, { useNewUrlParser: true });

exports.connect = async () => {
    await client.connect()
    db = client.db(conf.mongo.database)
    console.log('connected to mongo ' + conf.mongo.database)

    users = db.collection('users')
    await users.createIndex({mail: 1}, {unique: true})

    history = db.collection('history')
    await history.createIndex({id: 1}, {unique: true})
    await history.createIndex({userMail: 1, date: 1, campaignId: 1, prospectId: 1})
}

// users
exports.getUsers = () => 
    users.find({}, {fields: {mail: true, admin: true, plan: true, linkedinId: true, isLinkedinPremium: true, createdAt: true, extensionLastConnection: true}})
        .toArray()

exports.getUser = (mail, fields) => 
    users.findOne({mail}, fields && {fields})

exports.createUser = (user) => 
    users.insertOne(user)


exports.updateUser = (mail, newUser) => 
    users.updateOne({mail}, {$set: newUser})


exports.deleteUser = (mail) => 
    users.deleteOne({mail})

exports.archiveUser = async (user) => {
    await db.collection('users_archive').insertOne(JSON.parse(JSON.stringify({_id: undefined, ...user})))
    return exports.deleteUser(user.mail)
}

exports.downgradeTrials = async () => 
    users.update({plan: 'trial', createdAt: {$lt: new Date(new Date() - 1000 * 60 * 60 * 24 * 15)}}, {$set: {plan: 'free'}})

// sessions
exports.saveSessions = (sessions) => 
    db.collection('sessions').insertMany(JSON.parse(JSON.stringify(Object.values(sessions))))

exports.loadSessions = () => 
    db.collection('sessions').find({}, {fields: {_id: false}}).toArray()

// prospects
exports.upsertProspects = (mail, newProspects) => Promise.all(newProspects.map(newProspect => 
    users.updateOne({mail}, {$set: {[`prospects.${newProspect.linkId}`]: newProspect}})
))

exports.deleteProspect = (mail, linkId) => 
    users.updateOne({mail}, {$set: {[`prospects.${linkId}`]: undefined}})

// history
exports.addToHistory = (userMail, action) =>
    history.insertOne({
        userMail,
        id: action.id,
        prospectId: action.prospectId,
        campaignId: action.campaignId,
        messageNumber: action.messageNumber,
        date: action.date || new Date(),
        type: action.type
    }).catch(error => {error})

exports.addAllToHistory = (userMail, hist) => 
    history.insertMany(hist.map(action => ({
        userMail,
        id: action.id,
        prospectId: action.prospectId,
        campaignId: action.campaignId,
        messageNumber: action.messageNumber,
        date: action.date || new Date(),
        type: action.type
    })))

exports.getRecentHistory = (userMail) => 
    history.find({userMail}).sort({date: -1}).limit(50).toArray()

exports.getTodayHistory = (userMail) => 
    history.find(
        {userMail, date: {$gt: new Date(moment().startOf('day')), $lt: new Date(moment().endOf('day'))}}
    ).toArray()

exports.getCampaignHistory = (userMail, campaignId) =>
    history.find({userMail, campaignId}, {fields: {type: 1, messageNumber: 1}}).toArray()

exports.getProspectHistory = (userMail, prospectId) =>
    history.find({userMail, prospectId}).toArray()
