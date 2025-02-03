const express = require('express')
const app = express()
const path = require('path')
const router = require('./router')
const connectDB = require('./utils/db')


app.use(express.json())
app.use(express.urlencoded())

app.use(express.static(path.join(__dirname, "./public")))

connectDB()


app.use('/api', router)



app.listen(5000, () => {
    console.log('server has strated')
})