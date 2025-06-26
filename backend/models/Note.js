const mongoose = require('mongoose')
// const AutoIncrement = require('mongoose-sequence')(mongoose)

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

// noteSchema.plugin(AutoIncrement, {
//     inc_field: 'ticket',
//     id: 'ticketNums',
//     start_seq: 666
// })

module.exports = mongoose.model('Note', noteSchema)