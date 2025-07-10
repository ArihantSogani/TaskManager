/*
const mongoose = require('mongoose')


const noteSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    tag: {
        type: [String],
    }
}, { timestamps: true })

module.exports = mongoose.model('Note', noteSchema)
*/