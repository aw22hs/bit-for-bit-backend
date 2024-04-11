/**
 * Mongoose model Puzzle.
 *
 * @author Anja Willsund
 * @version 1.0.0
 */

import mongoose from 'mongoose'

// Create a puzzle schema.
const schema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    validate: {
      /**
       * Validates that the submitted title is a string.
       *
       * @param {string} value - The submitted title.
       * @returns {boolean} True if the submitted title is valid, otherwise false.
       */
      validator: function (value) {
        // The title must only contain letters, numbers, and spaces.
        return /^[a-zA-Z0-9åäöÅÄÖ ]+$/.test(value)
      }
    },
    minLength: 1,
    maxLength: [100, 'The title must not contain more than 100 characters']
  },
  piecesNumber: {
    type: Number,
    required: false,
    trim: true
  },
  size: {
    type: String,
    required: false,
    trim: true
    // validate: {
    //   /**
    //    * Validates that the submitted flow is a number.
    //    *
    //    * @param {string} value - The submitted flow.
    //    * @returns {boolean} True if the submitted flow is valid, otherwise false.
    //    */
    //   validator: function (value) {
    //     // The flow must only contain numbers.
    //     return /^\d+$/.test(value)
    //   }
    // },
  },
  manufacturer: {
    type: String,
    required: false,
    trim: true
  },
  lastPlayed: {
    type: Date,
    required: false
  },
  location: {
    type: String,
    required: false,
    trim: true
  },
  complete: {
    type: Boolean,
    required: false
  },
  missingPiecesNumber: {
    type: Number,
    required: false,
    trim: true
  },
  privateNote: {
    type: String,
    required: false,
    trim: true
  },
  sharedNote: {
    type: String,
    required: false,
    trim: true
  },
  isPrivate: {
    type: Boolean,
    default: true
  },
  isLentOut: {
    type: Boolean,
    default: false
  },
  lentOutTo: {
    type: String,
    required: false,
    trim: true
  },
  image: {
    type: Buffer
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toObject: {
    virtuals: true, // ensure virtual fields are serialized
    /**
     * Performs a transformation of the resulting object to remove sensitive information.
     *
     * @param {object} doc - The mongoose document which is being converted.
     * @param {object} ret - The plain object representation which has been converted.
     */
    transform: function (doc, ret) {
      delete ret._id
      delete ret.__v
    }
  }
})

// Makes the code more readable and doesn't expose that we are using
// mongoose.
schema.virtual('id').get(function () {
  return this._id.toHexString()
})

// Create a model using the schema.
export const Puzzle = mongoose.model('Puzzle', schema)
