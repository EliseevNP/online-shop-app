import { Model, ModelCtor, Sequelize } from 'sequelize-typescript';
import fs from 'fs';
import _ from 'lodash';
import * as path from 'path';
import { ServiceSettingSchema } from 'moleculer';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore, types for this package does'nt exists yet
import { JsonSchemaManager, OpenApi3Strategy } from '@alt3/sequelize-to-json-schemas';

const schemaManager = new JsonSchemaManager();

export const DBMixin = {
  async started(): Promise<void> {
    if (!this.settings.dbConfig) {
      throw new Error('Cannot create DB connection, please define settings.dbConfig');
    }

    this.db = new Sequelize(this.settings.dbConfig);
    const models = fs.readdirSync(this.settings.dbModelsPath);

    this.db.addModels(models.map((modelFileName: string) => path.join(this.settings.dbModelsPath, modelFileName)));

    // and/or the OpenAPI 3.0 equivalent
    Object.values(this.db.models).forEach((model: any) => {
      const modelSchema = schemaManager.generate(model, new OpenApi3Strategy());
      _.set(this.settings, `openapi.components.schemas.${modelSchema.title}`, modelSchema);
    });

    this.models = this.db.models as {
      [ key: string ]: ModelCtor<Model<any, any>>;
    };
  },
  async stopped(): Promise<void> {
    return this.db.close();
  },
} as Partial<ServiceSettingSchema>;
