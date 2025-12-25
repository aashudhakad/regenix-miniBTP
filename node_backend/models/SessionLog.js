    // models/SessionLog.js
    const mongoose = require('mongoose');

    const SessionLogSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    setNumber: {
        type: Number,
        required: true
    },
    repCount: {
        type: Number,
        required: true
    },
    logs: [{
        counter: Number,
        stage: String,
        feedback: String,
        feedbackFlags: [String],
        repScore: Number,
        scoreLabel: String,
        advancedMetrics: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
        },
        affectedJoints: [String],
        affectedSegments: [[String]],
        timestamp: {
        type: Date,
        default: Date.now
        }
    }]
    }, {
    timestamps: true
    });

    module.exports = mongoose.model('SessionLog', SessionLogSchema);