import { requestClient } from '#/api/request';

export async function esiAuthApi() {
  return requestClient.get('/esi/auth');
}
