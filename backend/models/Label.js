/*
const mongoose = require('mongoose')

const labelSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
)

// Index for faster queries
labelSchema.index({ name: 1 })

module.exports = mongoose.model('Label', labelSchema)
*/ 