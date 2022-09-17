import { ZonedDateTime } from '@js-joda/core';
import _ from 'lodash';
import { parseDateTime } from '../helpers/date-utils';

export const VALIDATION_ALIASES = {
  DateTime: {
    type: 'string',
    empty: false, // Do not allow empty string
    singleLine: true, // Do not allow \n
    trim: true, // Trim string
    // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
    custom(value: any, errors: any): ZonedDateTime | null | undefined {
      if (typeof value === 'string') {
        try {
          return parseDateTime(value);
        } catch (err) {
          errors.push({ type: 'stringPattern', expected: 'yyyy-MM-ddTHH:mm:ssX', actual: value });
        }
      }

      if (_.isArray(value) || value === undefined) {
        return undefined;
      }

      return null;
    },
  },
}
