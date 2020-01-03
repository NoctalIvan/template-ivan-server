const conf = {
    PORT: process.env.PORT || 5354,
    mongo: {
        url: process.env.DATABASE_URL || 'mongodb+srv://ivan:azer@clustertest-lh3ql.mongodb.net/test?retryWrites=true&w=majority',
        database: process.env.DATABASE_NAME || 'websongbook'
    }
}

console.log({conf})

module.exports = conf