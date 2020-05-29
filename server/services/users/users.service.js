// Initializes the `users` service on path `/users`
const createService = require('feathers-mongoose')
const createModel = require('../../models/users.model')
const hooks = require('./users.hooks')

module.exports = function (app) {
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    Model,
    paginate,
    multi: true // Allow multi create, patch and remove
  }

  // Initialize our service with any options it requires
  app.use('/users', createService(options))

  // Get our initialized service so that we can register hooks
  const service = app.service('users')

  service.hooks(hooks)
}