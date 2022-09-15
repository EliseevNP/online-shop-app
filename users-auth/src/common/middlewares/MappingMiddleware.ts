import _ from 'lodash';
import {
  ActionSchema, CallingOptions, Context, Middleware,
} from 'moleculer';

export const MappingMiddleware = (): Middleware => ({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  localAction(next, action: ActionSchema & { map: MappingFunction<any, any> } | string) {
    return (ctx: Context<any>): Promise<any> => next(ctx).then((res: any) => {
      if (!_.isObject(action) || !action.map || !_.isFunction(action.map)) {
        return res;
      }
      return action.map.call(null, res, ctx);
    });
  },
});

export type MappingFunction<T, P> = (data: T, params: any, callingOpts?: CallingOptions) => P | null;
