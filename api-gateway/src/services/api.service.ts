import { ServiceSchema } from 'moleculer';
import ApiGateway from 'moleculer-web';

const ApiService: ServiceSchema = {
  name: 'api-gateway',
  mixins: [ApiGateway],
  settings: {
    port: process.env.PORT || 3000,
    routes: [
      {
        path: '/auth',
        authorization: false,
        bodyParsers: { json: { limit: '50MB' } },
        aliases: {
          'POST /signup': 'v1.services.users-auth.Auth.signup',
          'POST /signin': 'v1.services.users-auth.Auth.signin',
          'POST /refreshTokens': 'v1.services.users-auth.Auth.refreshTokens',
        },
      },
      {
        path: '/users',
        authorization: true,
        bodyParsers: { json: { limit: '50MB' } },
        aliases: {
          'GET /me': 'v1.services.users-auth.Users.getMe',
          'GET /:id': 'v1.services.users-auth.Users.getById',
          'PATCH /:id': 'v1.services.users-auth.Users.update',
        },
      },
      {
        path: '/payments',
        authorization: true,
        bodyParsers: { json: { limit: '50MB' } },
        aliases: {
          'GET /account/self': 'v1.services.payment.Account.GetSelfAccount',
          'PATCH /balance/replanish': 'v1.services.payment.Balance.ReplanishBalance',
          'PATCH /balance/withdraw': 'v1.services.payment.Balance.WithdrawFromBalance',
        },
      },
      {
        path: '/orders',
        authorization: true,
        bodyParsers: { json: { limit: '50MB' } },
        aliases: {
          'POST /': 'v1.services.order.Order.CreateOrder',
          'GET /:id': 'v1.services.order.Order.GetOrderById',
        },
      },
      {
        path: '/items',
        authorization: true,
        bodyParsers: { json: { limit: '50MB' } },
        aliases: {
          'GET /': 'v1.services.stock.Item.GetItemsList',
        },
      },
      {
        path: '/couriers',
        authorization: true,
        bodyParsers: { json: { limit: '50MB' } },
        aliases: {
          'POST /': 'v1.services.delivery.Delivery.CreateCourier',
          'DELETE /:id': 'v1.services.delivery.Delivery.DeleteCourier',
        },
      },
      {
        path: '/notifications',
        authorization: true,
        bodyParsers: { json: { limit: '50MB' } },
        aliases: {
          'GET /': 'v1.services.notification.Notification.GetNotificationsList',
        },
      },
    ],
  },
  methods: {
		authorize(ctx, _route, req) {
			let token;

			if (req.headers.authorization) {
				let type = req.headers.authorization.split(" ")[0];

				if (type === 'Token') {
					token = req.headers.authorization.split(" ")[1];
				}
			}

			if (!token) {
				return Promise.reject(new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_NO_TOKEN, {}));
			}

			// Resolve JWT token
			return ctx.call("v1.services.users-auth.Auth.resolveToken", { accessToken: token })
				.then((user) => {
					if (!user) {
						return Promise.reject(new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN, {}));
          }

					ctx.meta.user = user;
				})
				.catch(() => {
					return Promise.reject(new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN, {}));
				});
		}
	}
};

export = ApiService;
