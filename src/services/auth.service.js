/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/**
 * Dream Code Auth Service
 *
 * Client-Side Authentication and Authorization Service
 *
 * Creates a global `auth` constant
 * Methods
 *
 * - __authenticate({ email, password }) - internal method
 *
 * - login({ email, password })
 *
 * - logout()
 *
 * - signup({ email, name, password })
 *
 * - changePassword({ oldPassword, newPassword })
 *
 * - changeMyIdentity( password, { email, name }) - Must be logged in
 *
 * - verifySignUp( verifyToken )
 *
 * - verifyChanges( verifyToken )
 *
 * - resendVerification( email )
 *
 * - sendResetPassword( email )
 *
 * - resetPassword( email )
 *
 * - getToken()
 *
 * - isLoggedIn()
 *
 * - hasPermission( permissionName ) -
 *     Checks user permissions against a single permission string
 *     but waits for login request to finish
 *
 * - hasPermissionSync( permissionName )
 *
 * Properties
 * - currentUser - Contains the current user definition
 */

import './notification.service'

// Change these to 'verifyToken' and 'resetToken' to handle long tokens
const verifySignupAction = 'verifySignupShort'
const resetAction = 'resetShortToken'

const auth = {
  currentUser: null,
  __authenticate: user => {
    notify.log('__authenticate(): user: ', JSON.stringify(user))
    user = user ? Object.assign(user, { strategy: 'local' }) : undefined

    notify.log('xxUser before auth: ' + JSON.stringify(user))
    return feathers.authenticate(user)
      .then(response => {
        notify.log('__authenticate(): response: ', JSON.stringify(response))
        if (window.location.hostname.indexOf('localhost') > -1) {
          notify.log('Access Token: ', response.accessToken)
          notify.log('User: ', response.user)
        }

        feathers.set('user', response.user)
        auth.currentUser = response.user
        console.log(`auth.service __authenticate: auth.currentUser=${JSON.stringify(auth.currentUser)}`)
        return auth.currentUser
      })
  },

  login: async user => {
    await auth.logout()

    const [err, foundUser] = await to(auth.__authenticate(user))

    if (!err) {
      notify.success(`Hello ${foundUser.name || foundUser.email}`)
      console.log(`auth.service login(success): auth.currentUser=${JSON.stringify(auth.currentUser)}`)
      feathers.emit('FeathersIsLoggedIn', true)
      return auth.currentUser
    } else {
      notify.warning(err.message)
      notify.debug('Error authenticating', err)
      auth.logout()
      return false
    }
  },

  logout: async message => {
    const [err, success] = await to(feathers.logout())

    if (!err && message) {
      notify.success(message)
    }

    feathers.set('user', null)
    auth.currentUser = null
    feathers.emit('FeathersIsLoggedIn', false)
  },

  signup: async user => {
    if (!user) {
      notify.error('Please fill out the user information')
      return false
    }

    await auth.logout()

    const [err, result] = await api.users.create(user)

    if (!err) {
      const options = {
        type: 'local',
        email: user.email,
        password: user.password
      }

      const [authFail, currentUser] = await to(auth.__authenticate(user))

      if (!authFail) {
        notify.success(`Hello ${currentUser.name || currentUser.email}. Please check your email and verify so we can protect your account.`)
        return auth.currentUser
      } else {
        notify.error(parseErrors(authFail), 'Error signing up')
        return false
      }
    } else {
      if (err.code === 409) {
        notify.error('That email is already taken.')
      } else {
        notify.error(parseErrors(err))
      }
      return false
    }
  },

  changePassword: async function (oldPassword, password) {
    if (!_.get(auth, 'currentUser.email')) {
      notify.warning('You must be logged in to change your password.')
      return false
    }

    const options = {
      action: 'passwordChange',
      value: {
        user: {
          email: auth.currentUser.email
        },
        oldPassword,
        password
      }
    }

    const [err, result] = await api.authManagement.create(options)

    if (!err) {
      notify.success('Your current password has been changed. Next time you log in please use the new password.')
    } else {
      notify.error(err.message)
    }
  },

  changeMyIdentity: async function (password, changes) {
    if (!_.get(auth, 'currentUser.email')) {
      notify.warning('You must be logged in to update your account.')
      return false
    }

    if (!password) {
      notify.warning('You must provide a password to update your account.')
      return false
    }

    if (!changes) {
      notify.warning('Please provide information to update your account with.')
      return false
    }

    const options = {
      action: 'identityChange',
      value: {
        password,
        changes,
        user: {
          email: auth.currentUser.email
        }
      }
    }

    const [err, result] = await api.authManagement.create(options)

    if (!err) {
      notify.success('The changes are pending. Please check your email to verify that you made the change.')
    } else {
      notify.error(err.message)
    }
  },

  verifySignUp: async function verifySignUp (slug) {
    if (!_.get(auth, 'currentUser.email')) {
      notify.warning('You must be logged in to verify your account.')
      return false
    }
    if (!slug) { return false }
    const user = { email: auth.currentUser.email }

    let payload = { action: verifySignupAction }
    if (verifySignupAction.indexOf('Short') > 0) { payload = Object.assign({}, payload, { value: { token: slug, user: user } }) } else { payload = Object.assign({}, payload, { value: slug }) }

    const [err, response] = await api.authManagement.create(payload)

    if (response) {
      auth.currentUser = response
      notify.success('Your email has been verified. We can now protect your account.')
    } else {
      notify.error('Sorry, but we could not verify your email.')
      notify.debug('Verify Email Error: ', err)
    }

    return response
  },

  verifyChanges: async function verifyChanges (slug) {
    if (!slug) { return false }
    const [err, response] = await api.authManagement.create({
      action: verifySignupAction,
      value: slug
    })

    if (!err) {
      auth.currentUser = response
      notify.success('You have approved the changes to your account. You may now sign in under the new email.')
    } else {
      notify.error('Sorry, but we could not approved the changes to your account.')
      notify.debug('Verify Changes Error: ', err)
    }
  },

  resendVerification: async function resendVerification (email) {
    if (_.get(auth, 'currentUser.isVerified')) {
      return notify.success('This account has already been verified')
    }
    if (!email) {
      notify.success('Please fill out your email to verify.')
      return false
    }

    const options = {
      action: 'resendVerifySignup',
      value: { email }
    }

    const [err, result] = await api.authManagement.create(options)

    if (!err) {
      auth.currentUser = result
      notify.success('Another verification email has been sent.')
    } else {
      notify.error('Sorry but we could not send a verification email.')
    }
  },

  sendResetPassword: async function sendResetPassword (email) {
    if (!email) {
      notify.warning('Please provide your email so we can send you a reset password email.')
      return false
    }

    const options = {
      action: 'sendResetPwd',
      value: { email }
    }

    const [err, result] = await api.authManagement.create(options)

    if (!err) {
      notify.success('Please check your email. A link to reset your password has been sent.')
    } else {
      notify.warning(err.message)
      notify.debug('Error sending reset password email', err)
    }
  },

  resetPassword: async function saveResetPassword (slug, password) {
    const options = {
      action: 'resetPwdLong',
      value: { token: slug, password }
    }

    const [err, result] = await api.authManagement.create(options)

    if (!err) {
      auth.currentUser = result
      notify.success('Your password was updated. You may now sign in under the new password.')
      return true
    } else {
      notify.warning('Sorry but there was an error updating your password.')
    }
  },

  getToken: () => feathers.get('token'),

  isLoggedIn: () => {
    return auth.__authenticate().then(_response => {
      auth.currentUser = feathers.get('user')
      return auth.currentUser
    }, _err => {
      notify.debug('Currently not logged in')
      return false
    })
  },

  hasPermission: permissionName => {
    const privs = _.get(auth, 'currentUser.permissions')

    if (!privs) {
      return this.isLoggedIn().then(isLoggedIn => {
        if (!isLoggedIn) { return false }

        auth.currentUser = feathers.get('user')

        const privs = _.get(auth, 'currentUser.permissions')

        return !privs || (!privs.includes(permissionName) && _.get(auth, 'currentUser.role') !== 'admin')
      }, _err => {
        return false
      })
    } else {
      if (privs.includes(permissionName) || _.get(auth, 'currentUser.role') === 'admin') {
        return true
      } else {
        return false
      }
    }
  },

  hasPermissionSync: permissionName => {
    const privs = _.get(auth, 'currentUser.permissions')

    return !privs || (!privs.includes(permissionName) && _.get(auth, 'currentUser.role') !== 'admin')
  }

}

try {
  global.auth = auth
// eslint-disable-next-line no-empty
} catch (err) {}

// module.exports = auth;
export default auth
