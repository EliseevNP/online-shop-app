import { Context, Errors } from 'moleculer';
import _ from 'lodash';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload, JsonWebTokenError } from 'jsonwebtoken';
import { v4 } from 'uuid';
import { Op } from 'sequelize';
import {
  ActionLink, ActionService, ServiceLink, AUTH_CONFIG,
} from '../../common';
import User from '../models/User';
import { EUserStates } from '../enums/EUserStates'

type TokenPair = { accessToken: string, refreshToken: string };

@ServiceLink({ prefix: 'Auth' })
class AuthService extends ActionService {
  @ActionLink({
    rest: 'POST /signup',
    description: 'Регистрация пользователя',
    params: {
      userId: {
        type: 'uuid',
        optional: true,
        default: () => v4(),
      },
      username: {
        type: 'string',
        optional: false,
        max: 255,
      },
      password: {
        type: 'string',
        optional: false,
        max: 255,
      },
      name: {
        type: 'string',
        optional: true,
        max: 255,
      },
      surname: {
        type: 'string',
        optional: true,
        max: 255,
      },
      patronymic: {
        type: 'string',
        optional: true,
        max: 255,
      },
    },
  })
  public async signup(ctx: Context<{
    userId: string,
    username: string,
    password: string,
    name?: string | null,
    surname?: string | null,
    patronymic?: string | null,
  }>): Promise<any> {
    const {
      userId,
      username,
      password,
      name,
      surname,
      patronymic,
    } = ctx.params;

    const existingUser = await User.unscoped().findOne({ where: { [Op.or]: [{ userId }, { username }] } });

    if (existingUser?.userId === userId) {
      // duplicated request, so just return existing user
      return _.omit(existingUser.get({ plain: true }), 'passwordHash');
    }

    if (existingUser) {
      throw new Errors.MoleculerClientError('username already in use', 400, 'USERNAME_ALREADY_IN_USE')
    }

    const salt = bcrypt.genSaltSync(AUTH_CONFIG.hash.saltRounds);
    const passwordHash = bcrypt.hashSync(password, salt);

    const user = await User.create({
      userId,
      state: EUserStates.PENDING,
      revision: 0,
      username,
      passwordHash,
      name,
      surname,
      patronymic,
    });

    await ctx.broker.emit('SignupRequested', { userId });

    return _.omit(user.get({ plain: true }), 'passwordHash');
  }

  @ActionLink({
    rest: 'POST /signin',
    description: 'Логин пользователя',
    params: {
      username: {
        type: 'string',
        optional: false,
        max: 255,
      },
      password: {
        type: 'string',
        optional: false,
        max: 255,
      },
    },
  })
  public async signin(ctx: Context<{
    username: string,
    password: string,
  }>): Promise<TokenPair> {
    const {
      username,
      password,
    } = ctx.params;

    const user = await User.findOne({ where: { username }, attributes: { include: ['passwordHash'] } });

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      throw new Errors.MoleculerClientError('username or password is wrong', 401);
    }

    const tokenPair = this.getTokenPair(user);

    return tokenPair;
  }

  @ActionLink({
    description: 'Проверка accessToken\'а + поиск пользователя в БД',
    params: {
      accessToken: {
        type: 'string',
        optional: false,
      },
    },
  })
  public async resolveToken(ctx: Context<{ accessToken: string }>): Promise<User | null> {
    const decoded = this.verifyToken(ctx.params.accessToken, 'accessToken');
    
    if (!decoded.userId) {
      throw new Errors.MoleculerClientError('userId not found in decoded token', 401);
    }

    const user = await User.findOne({ where: { userId: decoded.userId } });

    if (!user) {
      throw new Errors.MoleculerClientError(`user not found by userId#${decoded.userId} from decoded token`, 401);
    }

    return user;
  }

  @ActionLink({
    description: 'Обновление accessToken\'a и refreshToken\'а',
    params: {
      refreshToken: {
        type: 'string',
        optional: false,
      },
    },
  })
  public async refreshTokens(ctx: Context<{ refreshToken: string }>): Promise<TokenPair> {
    const decoded = this.verifyToken(ctx.params.refreshToken, 'refreshToken');
    const user = await User.findOne({ where: { userId: decoded.userId } });

    if (!user) {
      throw new Errors.MoleculerClientError('user not found while trying to refresh tokens', 401);
    }

    return this.getTokenPair(user);
  }

  private verifyToken(token: string, type: 'accessToken' | 'refreshToken'): JwtPayload {
    const decoded = jwt.verify(token, AUTH_CONFIG.jwt[type].secret, { ...AUTH_CONFIG.jwt.common, complete: true });

    if (decoded.header.alg !== AUTH_CONFIG.jwt.common.algorithm) {
      throw new JsonWebTokenError(`jwt algorithm invalid, expected: ${AUTH_CONFIG.jwt.common.algorithm}`);
    }

    if (typeof decoded.payload === 'string') {
      throw new Error("jwt decoded payload have unexpected 'string' type. expected: 'object'");
    }

    return decoded.payload;
  }

  private getTokenPair(user: User): TokenPair {
    return {
      accessToken: jwt.sign({ userId: user.userId }, AUTH_CONFIG.jwt.accessToken.secret, {
        ...AUTH_CONFIG.jwt.common,
        expiresIn: AUTH_CONFIG.jwt.accessToken.expiresIn,
      }),
      refreshToken: jwt.sign({ userId: user.userId }, AUTH_CONFIG.jwt.refreshToken.secret, {
        ...AUTH_CONFIG.jwt.common,
        expiresIn: AUTH_CONFIG.jwt.refreshToken.expiresIn,
      }),
    };
  }

  /* ----------------------------- Event handlers ----------------------------- */

  async PaymentAccountCreatedHandler(ctx: Context<{ userId: string }>) {
    ctx.broker.logger.info('Handling PaymentAccountCreated event');

    const { userId } = ctx.params;
    const pendingUser = await User.unscoped().findOne({ where: { userId, state: EUserStates.PENDING } });

    if (!pendingUser) {
      throw new Error(`Can't completely create user#${userId} because it's not found`);
    }


    const newUserData = {
      userId,
      state: EUserStates.CREATED,
      revision: pendingUser.revision + 1,
      username: pendingUser.username,
      name: pendingUser.name,
      surname: pendingUser.surname,
      patronymic: pendingUser.patronymic,
      passwordHash: pendingUser.passwordHash,
    }

    const transaction = await this.db.transaction({ autocommit: false });

    try {
      await User.create(newUserData, { transaction });
      await pendingUser.destroy({ transaction });

      await transaction?.commit();
    } catch (error) {
      await transaction?.rollback();
      throw error;
    }

    await ctx.broker.emit('UserRegistered', _.omit(newUserData, 'passwordHash'));

    ctx.broker.logger.info('PaymentAccountCreated event handled');
  }
}

export const authService = new AuthService();
