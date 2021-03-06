// users-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
const validatePattern = require('../utils/validate-pattern')

const colors = [
  '#1ABC9C',
  '#16A085',
  '#2ECC71',
  '#27AE60',
  '#3498DB',
  '#2980B9',
  '#34495E',
  '#EA4C88',
  '#CA2C68',
  '#9B59B6',
  '#8E44AD',
  '#F1C40F',
  '#F39C12',
  '#E74C3C',
  '#C0392B'
]

module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient')
  const Schema = mongooseClient.Schema
  const users = new Schema({

    // External authorisation parties
    auth0Id: { type: String },
    bitbucketId: { type: String },
    bitbucket: { type: Schema.Types.Mixed },
    dropboxId: { type: String },
    dropbox: { type: Schema.Types.Mixed },
    facebookId: { type: String },
    facebook: { type: Schema.Types.Mixed },
    githubId: { type: String },
    github: { type: Schema.Types.Mixed },
    googleId: { type: String },
    google: { type: Schema.Types.Mixed },
    instagramId: { type: String },
    instagram: { type: Schema.Types.Mixed },
    linkedinId: { type: String },
    linkedin: { type: Schema.Types.Mixed },
    paypalId: { type: String },
    paypal: { type: Schema.Types.Mixed },
    spotifyId: { type: String },
    spotify: { type: Schema.Types.Mixed },

    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, required: false },

    isEnabled: {
      type: Boolean,
      default: true
    },

    role: {
      required: true,
      type: String,
      trim: true,
      validate: validatePattern('isTitle'),
      default: 'basic'
    },

    color: {
      required: false,
      type: String,
      trim: true,
      enum: colors,
      default: function () {
        return colors[Math.floor(Math.random() * colors.length)]
      }
    },

    initials: {
      required: false,
      type: String,
      trim: true,
      maxlength: 2
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

    // Used for email verification
    isVerified: { type: Boolean },
    verifyToken: { type: String },
    verifyShortToken: { type: String },
    verifyExpires: { type: Date }, // or a long integer
    verifyChanges: { type: Object }, // an object (key-value map), e.g. { field: "value" }
    resetToken: { type: String },
    resetShortToken: { type: String },
    resetExpires: { type: Date } // or a long integer

  })

  return mongooseClient.model('users', users)
}
