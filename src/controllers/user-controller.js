/**
 * Module for the UserController.
 *
 * @author Anja Willsund
 * @version 1.0.0
 */

import { User } from '../models/user.js'
import jwt from 'jsonwebtoken'
import { MovieResponse } from '../models/movie-response.js'

/**
 * Encapsulates a controller.
 */
export class UserController {
  /**
   * Authenticates token.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {object} next - Express next middleware function.
   * @returns {object} - Express response object.
   */
  async authenticateToken (req, res, next) {
    // Extract the token from the authorization header
    const token = req.headers.authorization?.split(' ')[1]

    // Check if the token is missing
    if (!token) {
      console.log('No token provided.')
      return res.status(401).json({ error: 'No token provided.' })
    }

    // TODO: Är detta rätt hantering av JWT?
    // Verify the token using the secret key
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      // Check if there is an error during token verification
      if (err) {
        console.log(err)
        // Return a 401 error if the token is invalid
        return res.status(401).json({ error: 'Invalid token.' })
      }
      // Attach the decoded user information to the request object for further processing
      req.user = decoded
      console.log('Token authenticated')
      // Proceed to the next middleware or route handler if the token is valid
      next()
    })
  }

  /**
   * Tries to log in to user account.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async loginPost (req, res, next) {
    try {
      let token
      // Checks if submitted username and password matches any saved data in database.
      if (await User.authenticate(req.body.username, req.body.password)) {
        const user = await User.findOne({ username: req.body.username })

        const payload = {
          id: user.id.toString(),
          username: req.body.username
        }

        // TODO: Är detta rätt hantering av JWT?
        // Generate a new JWT token with user data, using the JWT secret and setting it to expire in 1 hour
        token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })
        res.status(200).json({ message: `Welcome ${req.body.username}! You are now logged in.`, token })
      }
      // Regenerates a new session.
      req.session.regenerate(() => {
        // Sets session username to the submitted username.
        req.session.username = req.body.username
        // Sets session token to the generated token.
        req.session.token = token
      })
      console.log('User logged in successfully.')
    } catch (error) {
      console.log('Error: ' + error.message)
      error.status = 401
      next(error)
    }
  }

  // /**
  //  * Gets a users groups from the database.
  //  *
  //  * @param {object} req - Express request object.
  //  * @param {object} res - Express response object.
  //  * @param {Function} next - Express next middleware function.
  //  */
  // async getUserGroups (req, res, next) {
  //   try {
  //     const user = await User.findOne({ _id: req.user.userId })
  //     const groups = user.groups
  //     res.status(200).json({ groups })
  //     console.log('Groups retrieved successfully.')
  //   } catch (error) {
  //     console.log(error)
  //     next(error)
  //   }
  // }

  /**
   * Creates a new user account.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async createPost (req, res, next) {
    console.log('Creating user account.')
    console.log(req.body)
    try {
      const user = new User({
        username: req.body.username,
        password: req.body.password
      })

      if (await user.save()) {
        console.log('User account created successfully.')
        res.status(201).send('Your account was created successfully. Please log in.')
      } else {
        throw new Error('An unknown error occured. Please try again.')
      }
    } catch (error) {
      if (error.message.includes('E11000 duplicate key error collection')) {
        error.message = 'The username is not available.'
      } else if (error.message.includes('The username must not contain more than 50 characters.')) {
        error.message = 'The username must not contain more than 50 characters.'
      } else if (error.message.includes('The password must contain at least 10 characters.')) {
        error.message = 'The password must contain at least 10 characters.'
      } else if (error.message.includes('The password must not contain more than 2000 characters.')) {
        error.message = 'The password must not contain more than 2000 characters.'
      }
      console.log(error)
      error.status = 400
      next(error)
    }
  }

  // /**
  //  * Adds a new group to the user's account.
  //  *
  //  * @param {object} req - Express request object.
  //  * @param {object} res - Express response object.
  //  * @param {Function} next - Express next middleware function.
  //  **/
  // async addGroup (req, res, next) {
  //   const token = req.headers.authorization?.split(' ')[1]
  //   const decodedToken = jwt.verify(token, process.env.JWT_SECRET)

  //   try {
  //     const user = await User.findOne({ _id: decodedToken.userId })
  //     if (user) {
  //       user.updateOne({ $push: { groups: req.body.groupcode } }).exec()
  //       console.log('Group added to user.')
  //       res.status(200).send('Group added successfully.')
  //     } else {
  //       throw new Error('An unknown error occured. Please try again.')
  //     }
  //   } catch (error) {
  //     console.log(error)
  //     error.status = 400
  //     next(error)
  //   }
  // }

  /**
   * Get a copy of the fetched array to the database.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async deleteUser (req, res, next) {
    const token = req.headers.authorization?.split(' ')[1]

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET)

    // TODO: Se över denna metod och ta bort användaren från vänners vänlistor vid borttagning.
    // If decodedToken.userId === user1Id, use this update.
    const update1 = {
      $set: {
        user1Id: '-',
        user1Answered: false,
        user1AnsweredYes: false
      }
    }

    // If decodedToken.userId === user2Id, use this update.
    const update2 = {
      $set: {
        user2Id: '-',
        user2Answered: false,
        user2AnsweredYes: false
      }
    }

    try {
      const update1MovieResponses = await MovieResponse.updateMany({ user1Id: decodedToken.userId }, update1)
      const update2MovieResponses = await MovieResponse.updateMany({ user2Id: decodedToken.userId }, update2)

      // If the updates were successful.
      if (update1MovieResponses.acknowledged === true && update2MovieResponses.acknowledged === true) {
        // Delete the user from the database.
        const user = await User.deleteOne({ _id: decodedToken.userId })
        // If the user was deleted successfully.
        if (user.deletedCount === 1) {
          console.log('Account was deleted successfully.')
          req.message = 'Account was deleted successfully.'
        } else {
          throw new Error('An unknown error occured. Please try again.')
        }
      }
      // Go to logout function.
      next()
    } catch (error) {
      console.log(error)
      next(error)
    }
  }

  /**
   * Logs out the user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  async logout (req, res) {
    // Destroys the session when logging out.
    req.session.destroy(() => {
      if (req.message) {
        res.status(200).send(req.message + ' You are now logged out.')
      } else {
        res.status(200).send('You are now logged out.')
        console.log('User logged out successfully.')
      }
    })
  }
}