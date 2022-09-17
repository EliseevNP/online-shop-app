import { Service } from 'moleculer-decorators';
import { Service as MoleculerService } from 'moleculer';
import MailerService from 'moleculer-mail';
import path from 'path';

@Service({
  name: 'services.mailer',
  version: 1,
  settings: {
    from: 'otus-eliseevnp@yandex.ru',
    htmlToText: false,
    transport: {
			host: 'smtp.yandex.ru',
			port: 465,
      secure: true,
			auth: {
				user: 'otus-eliseevnp@yandex.ru',
				pass: 'jmdhiqerormgwhls'
			}
		},
		templateFolder: path.join(__dirname, '../app/templates')
  },
  mixins: [MailerService],
})
export default class MolService extends MoleculerService {
}
