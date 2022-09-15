// import { Context, Errors } from 'moleculer';
import _ from 'lodash';
import { Context } from 'moleculer';
import {
  ActionLink, ActionService, ServiceLink,
} from '../../common';
import Item from '../models/Item';

@ServiceLink({ prefix: 'Item' })
class ItemService extends ActionService {
  @ActionLink({
    description: 'Пополнение списка элементов',
  })
  public async GetItemsList(_ctx: Context): Promise<Array<Item>> {
    return Item.findAll();
  }
}

export const itemService = new ItemService();
