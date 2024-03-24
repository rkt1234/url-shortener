const express =require('express')
const URL = require('./models/url')
const {connectToMongoDB} = require('./connect')
const urlRoute = require('./routes/url')
const app = express()
const PORT = 8001
connectToMongoDB('mongodb://localhost:27017/short-url').then(
    console.log("MongoDB connected")
)
app.use(express.json())
app.use('/url',urlRoute)
app.get('/:shortId', async (req,res) => {
   const shortId = req.params.shortId
   const entry = await URL.findOneAndUpdate({
        shortId
   }, {$push :{visitHistory : {
    timeStamp: Date.now()
   }} })
   res.redirect(entry.redirectURL)
})
app.listen(PORT, () => {
    console.log("Server is live at  port " + PORT)
})