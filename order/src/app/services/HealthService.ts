import {
  ActionLink, ActionService, ServiceLink,
} from '../../common';

@ServiceLink({ prefix: 'Health' })
class HealthService extends ActionService {
  @ActionLink({
    rest: 'GET /health',
    description: 'Метод проверяет работоспособность сервера',
  })
  public health(): string {
    return 'ok';
  }
}

export const healthService = new HealthService();
