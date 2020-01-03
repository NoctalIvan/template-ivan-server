#start db
mongod --fork --dbpath ~/db/data --logpath ~/db/logs/mongodb.log

# open tabs
ttab -t 'web-server' -d ~/Perso/websongbook/server/ 'node index'
ttab -t 'web-webapp' -d ~/Perso/websongbook/webapp/ 'npm run serve'
# ttab -t 'web-extension' -d ~/Perso/websongbook/extension/ 'npm run dev'