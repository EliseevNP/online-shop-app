import {
  ActionSchema, Context, LoggerInstance, Service, ServiceActionsSchema, ServiceSettingSchema,
} from 'moleculer';
import { ModelCtor, Sequelize } from 'sequelize-typescript';

export class ActionService {
  private readonly actions!: ServiceActionsSchema;

  protected service: Service;

  protected logger: LoggerInstance;

  protected db!: Sequelize;

  protected models!: {
    [ key: string ]: ModelCtor;
  };

  constructor(actions?: { actionName: string; options: ActionSchema }[], prefix?: string) {
    if (actions) {
      this.actions = {};

      actions.forEach((action: { actionName: string; options: ActionSchema }) => {
        // eslint-disable-next-line prefer-const
        let { actionName, options } = action;
        if (prefix && prefix.trim() !== '') {
          actionName = `${prefix}.${actionName}`;
          if (options.rest) {
            const urlParts = options.rest.split(' ');
            if (urlParts.length === 2) {
              urlParts[1] = `${prefix}/${urlParts[1]}`;
            }
            options.rest = urlParts.join(' ');
          }
        }

        const { handler } = options;
        options.handler = (ctx: Context<any, any>) => handler?.apply(this, [ctx]);

        this.actions[actionName] = options;
      });
    }
  }

  getSchema(): Partial<ServiceSettingSchema> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const scope = this;
    return {
      actions: this.actions,
      async started(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        scope.service = this;
        scope.logger = this.logger;
        scope.db = this.db;
        scope.models = this.models;
      },
    };
  }
}
