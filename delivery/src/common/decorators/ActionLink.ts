import { ActionSchema } from 'moleculer';
import { MappingFunction } from '../middlewares';

export type HRMActionSchema<MapSource, MapResult> = ActionSchema & { map?: MappingFunction<MapSource, MapResult> };

export const ActionLink = <MapSource, MapResult>(options: HRMActionSchema<MapSource, MapResult> = {}) => (
  (target: any, key: string, descriptor: PropertyDescriptor) => {
    options.handler = descriptor.value;

    if (target.actions === undefined) {
      target.actions = [];
    }

    target.actions.push({
      actionName: key,
      options: { ...options },
    });
  }
);
