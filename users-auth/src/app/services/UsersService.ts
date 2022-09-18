import { Context, Errors } from 'moleculer';
import _ from 'lodash';
import {
  ActionLink, ActionService, ServiceLink,
} from '../../common';
import User from '../models/User';

@ServiceLink({ prefix: 'Users' })
class UsersService extends ActionService {
  @ActionLink({
    rest: 'GET /:id',
    description: 'Получение пользователя по id',
    params: {
      id: {
        type: 'uuid',
        optional: false,
      },
    },
  })
  public async getById(ctx: Context<{ id: string }, { user: User }>): Promise<User | null> {
    if (ctx.meta.user.userId !== ctx.params.id) {
      throw new Errors.MoleculerClientError('Forbidden', 403);
    }

    const user = await User.findByPk(ctx.params.id);

    return user;
  }

  @ActionLink({
    rest: 'GET /me',
    description: 'Получение информации о себе',
  })
  public async getMe(ctx: Context<{}, { user: User }>): Promise<User | null> {
    const user = await User.findByPk(ctx.meta.user.userId);

    return user;
  }

  @ActionLink({
    rest: 'PATCH /:id',
    description: 'Изменение пользователя по id',
    params: {
      id: {
        type: 'uuid',
        optional: false,
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
  public async update(ctx: Context<{
    id: string,
    name?: string | null,
    surname?: string | null,
    patronymic?: string | null,
  }, { user: User }>): Promise<User | null> {
    if (ctx.meta.user.userId !== ctx.params.id) {
      throw new Errors.MoleculerClientError('Forbidden', 403);
    }

    const user = await User.findByPk(ctx.params.id);

    if (!user) {
      throw new Errors.MoleculerClientError('User not found', 404, 'USER_NOT_FOUND');
    }

    await user.update({ ..._.pick(ctx.params, ['name', 'surname', 'patronymic']), revision: user.revision + 1 });
    await ctx.emit('UserUpdated', {
      userId: user.userId,
      state: user.state,
      revision: user.revision,
      username: user.username,
      name: user.name,
      surname: user.surname,
      patronymic: user.patronymic,
    })

    return user;
  }
}

export const usersService = new UsersService();
